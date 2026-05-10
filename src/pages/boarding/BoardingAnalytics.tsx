import { useMemo, useState } from 'react'
import { useBoardingStore } from '@/stores/BoardingStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from 'recharts'
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  differenceInDays,
  parseISO,
} from 'date-fns'
import { Users, Clock, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const chartConfig = {
  ocupacao: {
    label: 'Canis Ocupados',
    color: '#f97316',
  },
  checkIns: {
    label: 'Check-ins',
    color: '#8b5cf6',
  },
}

type Period = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear'

export function BoardingAnalytics() {
  const { boardingStays, kennels } = useBoardingStore()
  const [period, setPeriod] = useState<Period>('thisMonth')

  const dateRange = useMemo(() => {
    const today = new Date()
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
  }, [period])

  const filteredStays = useMemo(() => {
    return boardingStays.filter((stay) => {
      const checkIn = parseISO(stay.checkIn)
      return checkIn >= dateRange.start && checkIn <= dateRange.end
    })
  }, [boardingStays, dateRange])

  const stats = useMemo(() => {
    const totalCapacity = kennels.filter((k) => k.status === 'available').length || kennels.length
    const relevantStays = boardingStays.filter((s) => {
      if (s.status === 'cancelled') return false
      const sStart = parseISO(s.actualCheckIn || s.checkIn)
      const sEnd = parseISO(s.actualCheckOut || s.checkOut)
      return sStart <= dateRange.end && sEnd >= dateRange.start
    })

    // Average Stay Duration
    const completedStays = filteredStays.filter((s) => s.status === 'completed')
    const totalDays = completedStays.reduce((acc, stay) => {
      const end = parseISO(stay.actualCheckOut || stay.checkOut)
      const start = parseISO(stay.actualCheckIn || stay.checkIn)
      return acc + Math.max(1, differenceInDays(end, start))
    }, 0)
    const avgDuration =
      completedStays.length > 0 ? totalDays / completedStays.length : 0

    // Occupancy Rate real: bed-nights ocupados / bed-nights disponíveis no período
    const periodDays = Math.max(1, differenceInDays(dateRange.end, dateRange.start) + 1)
    const totalBedNightsAvailable = totalCapacity * periodDays

    const actualBedNights = relevantStays.reduce((acc, stay) => {
      const sStart = parseISO(stay.actualCheckIn || stay.checkIn)
      const sEnd = parseISO(stay.actualCheckOut || stay.checkOut)
      const overlapStart = sStart < dateRange.start ? dateRange.start : sStart
      const overlapEnd = sEnd > dateRange.end ? dateRange.end : sEnd
      const nights = Math.max(0, differenceInDays(overlapEnd, overlapStart))
      return acc + nights
    }, 0)

    const occupancyRate =
      totalBedNightsAvailable > 0
        ? (actualBedNights / totalBedNightsAvailable) * 100
        : 0

    // Faturamento do período (estadias concluídas com checkOut no período)
    const revenue = completedStays.reduce((acc, s) => acc + (s.totalPrice || 0), 0)

    return {
      totalStays: filteredStays.filter((s) => s.status !== 'cancelled').length,
      avgDuration: avgDuration.toFixed(1),
      occupancyRate: Math.min(100, occupancyRate).toFixed(1),
      revenue,
    }
  }, [filteredStays, boardingStays, kennels, dateRange])

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    })

    const allActive = boardingStays.filter((s) => s.status !== 'cancelled')

    return days.map((day) => {
      const dayStart = day
      const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000)

      // Quantos canis estavam ocupados neste dia
      const occupied = allActive.filter((s) => {
        const sStart = parseISO(s.actualCheckIn || s.checkIn)
        const sEnd = parseISO(s.actualCheckOut || s.checkOut)
        return sStart < dayEnd && sEnd > dayStart
      }).length

      const dailyCheckIns = allActive.filter((s) =>
        (s.actualCheckIn || s.checkIn).startsWith(format(day, 'yyyy-MM-dd')),
      ).length

      return {
        date: format(day, 'dd/MM'),
        ocupacao: occupied,
        checkIns: dailyCheckIns,
      }
    })
  }, [dateRange, boardingStays])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Análise de Hospedagem</h2>
        <Select value={period} onValueChange={(val: Period) => setPeriod(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">Este Mês</SelectItem>
            <SelectItem value="lastMonth">Mês Passado</SelectItem>
            <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
            <SelectItem value="thisYear">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Ocupação
            </CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Bed-nights / capacidade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} dias</div>
            <p className="text-xs text-muted-foreground">Por estadia concluída</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estadias
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStays}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">Estadias concluídas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ocupação e Check-ins Diários</CardTitle>
          <CardDescription>
            Canis ocupados por dia (laranja) e check-ins realizados (roxo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar
                dataKey="ocupacao"
                fill="var(--color-ocupacao)"
                radius={[4, 4, 0, 0]}
                name="Canis Ocupados"
              />
              <Bar
                dataKey="checkIns"
                fill="var(--color-checkIns)"
                radius={[4, 4, 0, 0]}
                name="Check-ins"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
