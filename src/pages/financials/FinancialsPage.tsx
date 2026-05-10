import { useCallback, useMemo, useState } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useBoardingStore } from '@/stores/BoardingStore'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts'
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  differenceInDays,
  addDays,
} from 'date-fns'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
  products: {
    label: 'Vendas (Produtos)',
    color: '#3b82f6',
  },
  services: {
    label: 'Serviços',
    color: '#8b5cf6',
  },
}

type Period = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom'

export default function FinancialsPage() {
  const { appointments } = useAppointmentStore()
  const { sales } = useInventoryStore()
  const { boardingStays } = useBoardingStore()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Date Range Calculation
  const dateRange = useMemo(() => {
    const today = new Date()
    if (period === 'custom' && customStart && customEnd) {
      return { start: parseISO(customStart), end: parseISO(customEnd) }
    }

    switch (period) {
      case 'thisMonth':
        return { start: startOfMonth(today), end: today }
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(today, 1)),
          end: endOfMonth(subMonths(today, 1)),
        }
      case 'last3Months':
        return { start: subMonths(today, 3), end: today }
      case 'thisYear':
        return { start: new Date(today.getFullYear(), 0, 1), end: today }
      default:
        return { start: startOfMonth(today), end: today }
    }
  }, [period, customStart, customEnd])

  // Comparison Logic (MoM / Period vs Period)
  // Logic: Previous period has same duration, ending just before current start
  const prevRange = useMemo(() => {
    const duration = differenceInDays(dateRange.end, dateRange.start) + 1
    const end = addDays(dateRange.start, -1)
    const start = addDays(end, -duration + 1)
    return { start, end }
  }, [dateRange])

  const calculateRevenue = useCallback((start: Date, end: Date, catFilter: string) => {
    // Services (Appointments)
    const periodAppointments = appointments.filter((a) => {
      const d = parseISO(a.date)
      const matchesDate = d >= start && d <= end
      const isComplete = a.status === 'completed' || a.status === 'in_progress'

      const matchesCat =
        catFilter === 'all' ||
        (catFilter === 'services' &&
          (a.serviceType === 'consultation' || a.serviceType === 'grooming')) ||
        (catFilter === 'grooming' && a.serviceType === 'grooming') ||
        (catFilter === 'consultation' && a.serviceType === 'consultation')

      return matchesDate && isComplete && matchesCat
    })

    // Sales (Products)
    const periodSales = sales.filter((s) => {
      const d = parseISO(s.date)
      const matchesDate = d >= start && d <= end
      const matchesCat = catFilter === 'all' || catFilter === 'products'
      return matchesDate && s.status === 'completed' && matchesCat
    })

    // Boarding Revenue (Simulated as checked-out stays)
    const periodBoarding = boardingStays.filter((b) => {
      const d = parseISO(b.actualCheckOut || b.checkOut)
      const matchesDate = d >= start && d <= end
      const matchesCat = catFilter === 'all' || catFilter === 'boarding'
      return matchesDate && b.status === 'completed' && matchesCat
    })

    const serviceRev = periodAppointments.reduce(
      (acc, curr) => acc + (curr.price || 0),
      0,
    )
    const productRev = periodSales.reduce((acc, curr) => acc + curr.total, 0)

    // Boarding revenue logic
    const boardingRev = periodBoarding.reduce(
      (acc, curr) => acc + (curr.totalPrice || 0),
      0,
    )

    // Adjust categorization based on filter
    // If filter is 'boarding', productRev and serviceRev should be 0 unless we consider boarding services as services?
    // Current logic separates them.
    // Let's sum based on what's active.

    return {
      serviceRev:
        catFilter === 'all' ||
        catFilter === 'services' ||
        catFilter === 'consultation' ||
        catFilter === 'grooming'
          ? serviceRev
          : 0,
      productRev:
        catFilter === 'all' || catFilter === 'products' ? productRev : 0,
      boardingRev:
        catFilter === 'all' || catFilter === 'boarding' ? boardingRev : 0,
      total:
        (catFilter === 'all' || catFilter === 'services' ? serviceRev : 0) +
        (catFilter === 'all' || catFilter === 'products' ? productRev : 0) +
        (catFilter === 'all' || catFilter === 'boarding' ? boardingRev : 0),
    }
  }, [appointments, sales, boardingStays])

  const currentRevenue = calculateRevenue(
    dateRange.start,
    dateRange.end,
    categoryFilter,
  )
  const prevRevenue = calculateRevenue(
    prevRange.start,
    prevRange.end,
    categoryFilter,
  )

  // Re-sum for total display to handle overlaps correctly
  const totalCurrent =
    currentRevenue.serviceRev +
    currentRevenue.productRev +
    currentRevenue.boardingRev
  const totalPrev =
    prevRevenue.serviceRev + prevRevenue.productRev + prevRevenue.boardingRev

  const growth =
    totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : 0

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    })

    return days.map((day) => {
      const dayRev = calculateRevenue(day, day, categoryFilter)

      return {
        date: format(day, 'dd/MM'),
        services: dayRev.serviceRev + dayRev.boardingRev, // Combine services + boarding for chart simplicity
        products: dayRev.productRev,
        total: dayRev.serviceRev + dayRev.productRev + dayRev.boardingRev,
      }
    })
  }, [dateRange, categoryFilter, calculateRevenue])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Relatórios Financeiros
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho do seu negócio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="services">Serviços (Geral)</SelectItem>
                <SelectItem value="products">Produtos (Vendas)</SelectItem>
                <SelectItem value="boarding">Hospedagem</SelectItem>
                <SelectItem value="grooming">Banho e Tosa</SelectItem>
                <SelectItem value="consultation">Clínica</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border rounded-md p-1 bg-card">
              <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
              <Select
                value={period}
                onValueChange={(val: Period) => setPeriod(val)}
              >
                <SelectTrigger className="w-[140px] border-none shadow-none h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">Este Mês</SelectItem>
                  <SelectItem value="lastMonth">Mês Passado</SelectItem>
                  <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="thisYear">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 self-end animate-fade-in">
            <div className="grid gap-1">
              <Label className="text-xs">Início</Label>
              <Input
                type="date"
                className="h-8"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Fim</Label>
              <Input
                type="date"
                className="h-8"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCurrent)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {growth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={cn(
                  'font-medium',
                  growth >= 0 ? 'text-green-500' : 'text-red-500',
                )}
              >
                {Math.abs(growth).toFixed(1)}%
              </span>
              <span className="ml-1">vs. período anterior</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <div className="h-4 w-4 rounded-full bg-[#8b5cf6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentRevenue.serviceRev + currentRevenue.boardingRev)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultas, Banhos, Hospedagem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <div className="h-4 w-4 rounded-full bg-[#3b82f6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentRevenue.productRev)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos e Itens de Loja
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Evolução da Receita</CardTitle>
            <CardDescription>
              Comparativo diário no período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <AreaChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="products"
                  type="monotone"
                  fill="var(--color-products)"
                  fillOpacity={0.4}
                  stroke="var(--color-products)"
                  stackId="a"
                />
                <Area
                  dataKey="services"
                  type="monotone"
                  fill="var(--color-services)"
                  fillOpacity={0.4}
                  stroke="var(--color-services)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Composição da Receita</CardTitle>
            <CardDescription>Proporção Serviços vs. Produtos</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={[
                  {
                    productRev: currentRevenue.productRev,
                    serviceRev:
                      currentRevenue.serviceRev + currentRevenue.boardingRev,
                  },
                ]}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={() => 'Total do Período'}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar
                  dataKey="productRev"
                  fill="var(--color-products)"
                  radius={[0, 0, 4, 4]}
                  name="Produtos"
                  stackId="a"
                />
                <Bar
                  dataKey="serviceRev"
                  fill="var(--color-services)"
                  radius={[4, 4, 0, 0]}
                  name="Serviços"
                  stackId="a"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
