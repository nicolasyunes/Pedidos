import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarClock, CircleDollarSign, Plus, Search } from 'lucide-react'
import { useOrders, useUpdateOrder } from '@/hooks/use-orders'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants'
import { cn, formatCurrency, formatDateShort, isUrgent } from '@/lib/utils'
import type { Order, OrderPriority, OrderStatus as StatusType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const statusFilters: Array<{ label: string; value: 'all' | StatusType }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Pedido', value: 'pedido' },
  { label: 'Imprimiendo', value: 'imprimiendo' },
  { label: 'Listo', value: 'listo' },
]

const priorityFilters: Array<{ label: string; value: 'all' | OrderPriority }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Normal', value: 'normal' },
  { label: 'Urgente', value: 'urgente' },
]

export function OrderList() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useOrders('active')
  const updateOrder = useUpdateOrder()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | StatusType>('all')
  const [priority, setPriority] = useState<'all' | OrderPriority>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all')

  const filteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      const matchesSearch = !search.trim() || [
        order.product_name,
        order.contact_handle,
        order.customization_summary,
      ].join(' ').toLowerCase().includes(search.trim().toLowerCase())

      const matchesStatus = status === 'all' || order.status === status
      const matchesPriority = priority === 'all' || order.priority === priority
      const matchesDate = (() => {
        if (dateFilter === 'all') return true
        if (!order.due_date) return false
        const days = Math.ceil((new Date(order.due_date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
        if (dateFilter === 'today') return days <= 0
        return days <= 7
      })()

      return matchesSearch && matchesStatus && matchesPriority && matchesDate
    })
  }, [dateFilter, orders, priority, search, status])

  const pendingCount = orders.filter((order: Order) => order.status === 'pedido').length
  const printingCount = orders.filter((order: Order) => order.status === 'imprimiendo').length
  const readyCount = orders.filter((order: Order) => order.status === 'listo').length

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-6 pt-4">
      <section className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Operación del día</p>
            <h2 className="text-xl font-semibold">Abrís y ya sabés qué imprimir</h2>
          </div>

          <Button className="gap-2 rounded-2xl" onClick={() => navigate('/new-order')}>
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Metric label="Pendientes" value={pendingCount} accent="bg-sky-50 text-sky-700" />
          <Metric label="Imprimiendo" value={printingCount} accent="bg-violet-50 text-violet-700" />
          <Metric label="Listos" value={readyCount} accent="bg-amber-50 text-amber-700" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por producto, contacto o detalle"
            className="h-11 rounded-2xl pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((item) => (
            <FilterChip key={item.value} active={status === item.value} onClick={() => setStatus(item.value)}>
              {item.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {priorityFilters.map((item) => (
            <FilterChip key={item.value} active={priority === item.value} onClick={() => setPriority(item.value)}>
              {item.label}
            </FilterChip>
          ))}
          <FilterChip active={dateFilter === 'today'} onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}>
            Hoy o vencido
          </FilterChip>
          <FilterChip active={dateFilter === 'week'} onClick={() => setDateFilter(dateFilter === 'week' ? 'all' : 'week')}>
            Esta semana
          </FilterChip>
        </div>
      </section>

      <section className="space-y-3">
        {isLoading && <LoadingCard />}

        {!isLoading && filteredOrders.length === 0 && (
          <Card className="rounded-3xl">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No hay pedidos para esos filtros.
            </CardContent>
          </Card>
        )}

        {filteredOrders.map((order: Order) => {
          const nextStatus = getNextStatus(order.status)

          return (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={() => navigate(`/order/${order.id}`)}
              onAdvance={() => {
                if (!nextStatus) return
                updateOrder.mutate({ id: order.id, status: nextStatus })
              }}
              onNotified={() => updateOrder.mutate({ id: order.id, notified: !order.notified })}
            />
          )
        })}
      </section>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={cn('rounded-2xl px-3 py-3', accent)}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
      )}
    >
      {children}
    </button>
  )
}

function LoadingCard() {
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-6 text-sm text-muted-foreground">Cargando pedidos...</CardContent>
    </Card>
  )
}

function OrderCard({
  order,
  onOpen,
  onAdvance,
  onNotified,
}: {
  order: Order
  onOpen: () => void
  onAdvance: () => void
  onNotified: () => void
}) {
  const urgentByDate = isUrgent(order.due_date)
  const nextStatus = getNextStatus(order.status)
  const nextStatusLabel = nextStatus ? ORDER_STATUS[nextStatus].label : 'Sin siguiente paso'
  const advanceDisabled = nextStatus === null

  return (
    <Card className="overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
      <CardContent className="p-0">
        <button type="button" onClick={onOpen} className="w-full p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Badge>
                {order.priority === 'urgente' && <Badge variant="destructive">Urgente</Badge>}
                {order.notified && <Badge className="bg-emerald-100 text-emerald-700">Avisado</Badge>}
                {urgentByDate && order.status !== 'entregado' && <Badge className="bg-rose-100 text-rose-700">Vence pronto</Badge>}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pedido #{order.order_number}</p>
                <h3 className="truncate text-lg font-semibold">{order.product_name}</h3>
                <p className="truncate text-sm text-muted-foreground">{order.contact_handle}</p>
              </div>

              {order.customization_summary && (
                <p className="line-clamp-2 text-sm text-foreground/80">{order.customization_summary}</p>
              )}
            </div>

            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2 border-t bg-muted/40 px-4 py-3 text-sm sm:grid-cols-4">
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Entrega" value={order.due_date ? formatDateShort(order.due_date) : 'Sin fecha'} />
          <Meta icon={<CircleDollarSign className="h-4 w-4" />} label="Seña" value={formatCurrency(order.deposit_amount)} />
          <Meta label="Saldo" value={formatCurrency(order.balance_amount)} />
          <Meta label="Cobro" value={PAYMENT_STATUS[order.payment_status].label} />
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <Button variant="outline" className="rounded-2xl" onClick={onNotified}>
            <Bell className="mr-2 h-4 w-4" />
            {order.notified ? 'Quitar aviso' : 'Marcar avisado'}
          </Button>

          <Button className="rounded-2xl" disabled={advanceDisabled} onClick={onAdvance}>
            {nextStatus ? `Pasar a ${nextStatusLabel}` : nextStatusLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Meta({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function getNextStatus(status: StatusType): StatusType | null {
  if (status === 'pedido') return 'imprimiendo'
  if (status === 'imprimiendo') return 'listo'
  if (status === 'listo') return 'entregado'
  return null
}
