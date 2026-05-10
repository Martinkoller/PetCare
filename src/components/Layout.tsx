import { Outlet, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  Users,
  Scissors,
  Stethoscope,
  BedDouble,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Activity,
  List,
  Calendar,
  Package,
  ShoppingCart,
  Dog,
  LayoutDashboard,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  Building2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Agenda', url: '/schedule', icon: Calendar },
    { title: 'Tarefas', url: '/tasks', icon: ClipboardCheck },
    { title: 'Clientes', url: '/clients', icon: Users },
    { title: 'Pets', url: '/pets', icon: Dog },
    { title: 'Banho e Tosa', url: '/grooming', icon: Scissors },
    { title: 'Clínica', url: '/clinic', icon: Stethoscope },
    { title: 'Hospedagem', url: '/boarding', icon: BedDouble },
    { title: 'Internação', url: '/hospitalization', icon: Activity },
  ]

  if (user?.role === 'admin' || user?.role === 'attendant') {
    navItems.push(
      { title: 'Vendas', url: '/sales', icon: ShoppingCart },
      { title: 'Estoque', url: '/inventory', icon: Package },
    )
  }

  if (user?.role === 'admin') {
    navItems.push(
      { title: 'Relatórios Financeiros', url: '/financials', icon: TrendingUp },
      { title: 'Catálogo de Serviços', url: '/services', icon: List },
      { title: 'Meus Dados', url: '/my-data', icon: Building2 },
      { title: 'Administração', url: '/admin', icon: Settings },
    )
  }

  navItems.push({ title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen })

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    schedule: 'Agenda',
    tasks: 'Tarefas',
    clients: 'Clientes',
    pets: 'Pets',
    grooming: 'Banho e Tosa',
    clinic: 'Clínica',
    boarding: 'Hospedagem',
    hospitalization: 'Internação',
    admin: 'Administração',
    'my-data': 'Meus Dados',
    services: 'Catálogo de Serviços',
    inventory: 'Estoque',
    sales: 'Vendas',
    financials: 'Relatórios Financeiros',
    knowledge: 'Base de Conhecimento',
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scissors className="h-5 w-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">AgiliPet</span>
                <span className="truncate text-xs text-muted-foreground">
                  Sistema Clínico
                </span>
              </div>
            </div>
          </SidebarHeader>
          <Separator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="rounded-lg">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">
                          {user?.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground capitalize">
                          {user?.role}
                        </span>
                      </div>
                      <Menu className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user?.avatar} alt={user?.name} />
                          <AvatarFallback className="rounded-lg">
                            {user?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {user?.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-500 focus:text-red-500 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments
                  .filter((s) => s !== 'dashboard')
                  .map((segment, index, filteredArr) => {
                    const label = breadcrumbMap[segment] || segment
                    const isLast = index === filteredArr.length - 1
                    return (
                      <div key={segment} className="flex items-center gap-2">
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink className="capitalize">
                              {label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    )
                  })}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar clientes ou pets..."
                  className="w-64 pl-9 h-9"
                />
              </div>
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
