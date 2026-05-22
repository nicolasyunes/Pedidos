import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CalendarClock, CircleDollarSign, Plus, Search, Trash2, Users } from 'lucide-react'
import { useDeleteOrder, useOrders, useUpdateOrder } from '@/hooks/use-orders'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants'
import { cn, formatCurrency, formatDateShort, isUrgent } from '@/lib/utils'
import type { Order, OrderPriority, OrderStatus as StatusType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { WorkspaceShell } from '@/components/layout/workspace-shell'

export function OrderList() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useOrders('active')
  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | StatusType>('all')
  const [priority, setPriority] = useState<'all' | OrderPriority>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all')
  const [groupByClient, setGroupByClient] = useState(true)

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
  const urgentCount = orders.filter((order: Order) => order.priority === 'urgente').length

  const resetFilters = () => {
    setStatus('all')
    setPriority('all')
    setDateFilter('all')
  }

  const anyFilterActive = status !== 'all' || priority !== 'all' || dateFilter !== 'all'

  const groups = useMemo(() => {
    const map = new Map<string, { orders: Order[]; total: number }>()
    for (const order of filteredOrders) {
      const contact = order.contact_handle || '(sin contacto)'
      const existing = map.get(contact) ?? { orders: [] as Order[], total: 0 }
      existing.orders.push(order)
      existing.total += order.sale_price || 0
      map.set(contact, existing)
    }
    return Array.from(map.entries())
      .map(([contact, data]) => ({ contact, orders: data.orders, total: data.total }))
      .sort((a, b) => b.orders.length - a.orders.length || a.contact.localeCompare(b.contact))
  }, [filteredOrders])

  return (
    <WorkspaceShell
      eyebrow="Operación del día"
      title="Pedidos activos"
      description="Lista compacta para decidir rápido qué imprimir, qué está listo y qué falta cobrar."
      tone="orders"
      actions={
        <Button className="gap-2 rounded-2xl" onClick={() => navigate('/new-order')}>
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </Button>
      }
    >
      <div className="space-y-3 w-full">
        <div className="rounded-xl bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-card border-2 border-sky-200/80 dark:border-sky-800/50 px-3 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative flex-1 min-w-[140px] max-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="h-8 rounded-xl pl-7 text-xs"
              />
            </div>

            <span className="h-5 w-px bg-sky-200/60 dark:bg-sky-800/40 mx-0.5" />

            <FilterChip active={!anyFilterActive} onClick={resetFilters}>
              Todos
            </FilterChip>
            <span className="h-5 w-px bg-sky-200/60 dark:bg-sky-800/40 mx-0.5" />

            <button
              type="button"
              onClick={() => setStatus(status === 'pedido' ? 'all' : 'pedido')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                status === 'pedido'
                  ? 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-600 dark:bg-sky-900/50 dark:text-sky-300'
                  : 'border-transparent bg-sky-100/40 text-sky-600/70 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-950/20 dark:text-sky-400/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-300'
              )}
            >
              📋 Pend. {pendingCount}
            </button>
            <button
              type="button"
              onClick={() => setStatus(status === 'imprimiendo' ? 'all' : 'imprimiendo')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                status === 'imprimiendo'
                  ? 'border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-600 dark:bg-violet-900/50 dark:text-violet-300'
                  : 'border-transparent bg-violet-100/40 text-violet-600/70 hover:bg-violet-100 hover:text-violet-700 dark:bg-violet-950/20 dark:text-violet-400/70 dark:hover:bg-violet-950/40 dark:hover:text-violet-300'
              )}
            >
              🖨 Imp. {printingCount}
            </button>
            <button
              type="button"
              onClick={() => setStatus(status === 'listo' ? 'all' : 'listo')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                status === 'listo'
                  ? 'border-amber-400 bg-amber-100 text-amber-700 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-300'
                  : 'border-transparent bg-amber-100/40 text-amber-600/70 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-950/20 dark:text-amber-400/70 dark:hover:bg-amber-950/40 dark:hover:text-amber-300'
              )}
            >
              ✅ Listos {readyCount}
            </button>

            <span className="h-5 w-px bg-sky-200/60 dark:bg-sky-800/40 mx-0.5" />

            <button
              type="button"
              onClick={() => setPriority(priority === 'urgente' ? 'all' : 'urgente')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                priority === 'urgente'
                  ? 'border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-900/50 dark:text-rose-300'
                  : 'border-transparent bg-rose-100/40 text-rose-600/70 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/20 dark:text-rose-400/70 dark:hover:bg-rose-950/40 dark:hover:text-rose-300'
              )}
            >
              🔥 Urg. {urgentCount}
            </button>

            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                dateFilter === 'today'
                  ? 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-600 dark:bg-sky-900/50 dark:text-sky-300'
                  : 'border-transparent bg-sky-100/40 text-sky-600/70 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-950/20 dark:text-sky-400/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-300'
              )}
            >
              📅 Hoy
            </button>
            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === 'week' ? 'all' : 'week')}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                dateFilter === 'week'
                  ? 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-600 dark:bg-sky-900/50 dark:text-sky-300'
                  : 'border-transparent bg-sky-100/40 text-sky-600/70 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-950/20 dark:text-sky-400/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-300'
              )}
            >
              📅 Semana
            </button>

            <span className="h-5 w-px bg-sky-200/60 dark:bg-sky-800/40 mx-0.5" />

            <button
              type="button"
              onClick={() => setGroupByClient((prev) => !prev)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs whitespace-nowrap transition-all font-medium',
                groupByClient
                  ? 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-600 dark:bg-sky-900/50 dark:text-sky-300'
                  : 'border-transparent bg-sky-100/40 text-sky-600/70 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-950/20 dark:text-sky-400/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-300'
              )}
            >
              <Users className="inline h-3.5 w-3.5 -mt-0.5 mr-1" />
              {groupByClient ? 'Agrupado' : 'Cliente'}
            </button>
          </div>
        </div>

        <section className="space-y-2">
          {isLoading && <LoadingCard />}

          {!isLoading && filteredOrders.length === 0 && (
            <Card className="rounded-3xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No hay pedidos para esos filtros.
              </CardContent>
            </Card>
          )}

          {!isLoading && filteredOrders.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm divide-y">
              {groupByClient ? (
                groups.map((group) => (
                  <div key={group.contact}>
                    <div className="flex items-center justify-between gap-2 bg-sky-50/60 dark:bg-sky-950/20 px-3 py-2 border-b border-border/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-semibold truncate">{group.contact}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''}</span>
                        <span className="font-medium text-foreground">{formatCurrency(group.total)}</span>
                      </div>
                    </div>
                    <div className="divide-y">
                      {group.orders.map((order: Order) => {
                        const nextStatus = getNextStatus(order.status)
                        return (
                          <OrderRow
                            key={order.id}
                            order={order}
                            onOpen={() => navigate(`/order/${order.id}`)}
                            onStatusChange={(nextStatus) => updateOrder.mutate({ id: order.id, status: nextStatus })}
                            onAdvance={() => {
                              if (!nextStatus) return
                              updateOrder.mutate({ id: order.id, status: nextStatus })
                            }}
                            onNotified={() => updateOrder.mutate({ id: order.id, notified: !order.notified })}
                            onDelete={() => {
                              if (confirm(`¿Eliminar pedido #${order.order_number} (${order.product_name})?`)) {
                                deleteOrder.mutate(order.id)
                              }
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                filteredOrders.map((order: Order) => {
                  const nextStatus = getNextStatus(order.status)
                  return (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onOpen={() => navigate(`/order/${order.id}`)}
                      onStatusChange={(nextStatus) => updateOrder.mutate({ id: order.id, status: nextStatus })}
                      onAdvance={() => {
                        if (!nextStatus) return
                        updateOrder.mutate({ id: order.id, status: nextStatus })
                      }}
                      onNotified={() => updateOrder.mutate({ id: order.id, notified: !order.notified })}
                      onDelete={() => {
                        if (confirm(`¿Eliminar pedido #${order.order_number} (${order.product_name})?`)) {
                          deleteOrder.mutate(order.id)
                        }
                      }}
                    />
                  )
                })
              )}
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  )
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted'
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

function OrderRow({
  order,
  onOpen,
  onStatusChange,
  onAdvance,
  onNotified,
  onDelete,
}: {
  order: Order
  onOpen: () => void
  onStatusChange: (status: StatusType) => void
  onAdvance: () => void
  onNotified: () => void
  onDelete: () => void
}) {
  const urgentByDate = isUrgent(order.due_date)
  const nextStatus = getNextStatus(order.status)
  const nextStatusLabel = nextStatus ? ORDER_STATUS[nextStatus].label : 'Sin siguiente paso'
  const advanceDisabled = nextStatus === null
  const rowTone = getRowTone(order.status)

  return (
    <div className={cn('px-3 py-2 transition-colors', rowTone)}>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_0.75fr_0.8fr_0.85fr_1fr] lg:items-center">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <div className="flex items-start justify-between gap-3 lg:block">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className={cn(ORDER_STATUS[order.status].color, 'text-[10px] px-2 py-0.5')}>{ORDER_STATUS[order.status].label}</Badge>
                {order.priority === 'urgente' && <Badge variant="destructive" className="text-[10px] px-2 py-0.5">Urgente</Badge>}
                 {order.notified && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 text-[10px] px-2 py-0.5">Avisado</Badge>}
                 {urgentByDate && order.status !== 'entregado' && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200 text-[10px] px-2 py-0.5">Vence pronto</Badge>}
              </div>

              <div className="space-y-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-bold text-foreground">{order.product_name}</h3>
                  <span className="text-[9px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">#{order.order_number}</span>
                </div>
                <p className="truncate text-xs font-medium text-muted-foreground">{order.contact_handle}</p>
              </div>
            </div>

            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground lg:hidden" />
          </div>
        </button>

        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground lg:hidden">Personalización</p>
          <p className="line-clamp-1 text-xs text-foreground">
            {order.customization_summary || 'Sin detalle cargado'}
          </p>
          <p className="text-[10px] text-muted-foreground">{PAYMENT_STATUS[order.payment_status].label}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm lg:contents">
          <Meta icon={<CalendarClock className="h-3.5 w-3.5" />} label="Entrega" value={order.due_date ? formatDateShort(order.due_date) : 'Sin fecha'} />
          <Meta icon={<CircleDollarSign className="h-3.5 w-3.5" />} label="Seña" value={formatCurrency(order.deposit_amount)} />
          <Meta label="Saldo" value={formatCurrency(order.balance_amount)} />
        </div>

        <div className="grid gap-1.5 lg:grid-cols-1">
          <NativeSelect
            value={order.status}
            onChange={(event) => onStatusChange(event.target.value as StatusType)}
            options={Object.entries(ORDER_STATUS).map(([value, item]) => ({ value, label: item.label }))}
            className="h-9 rounded-2xl text-[11px] uppercase tracking-[0.12em]"
          />

          <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
            <Button variant="outline" className="rounded-2xl h-9 text-[11px] px-2" onClick={onNotified} title={order.notified ? 'Quitar aviso' : 'Avisar'}>
              <Bell className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.notified ? 'Quitar' : 'Avisar'}</span>
            </Button>

            <Button className="rounded-2xl h-9 text-[11px] px-2 truncate" disabled={advanceDisabled} onClick={onAdvance}>
              {nextStatus ? nextStatusLabel : '—'}
            </Button>

            <Button variant="ghost" size="icon" className="rounded-2xl h-9 w-9 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="lg:min-w-0">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-xs font-medium">{value}</p>
    </div>
  )
}

function getNextStatus(status: StatusType): StatusType | null {
  if (status === 'pedido') return 'imprimiendo'
  if (status === 'imprimiendo') return 'listo'
  if (status === 'listo') return 'entregado'
  return null
}

function getRowTone(status: StatusType) {
  if (status === 'pedido') return 'border-l-4 border-l-sky-400 bg-sky-50/40 hover:bg-sky-100/60 dark:border-l-sky-700 dark:bg-sky-950/15 dark:hover:bg-sky-950/25'
  if (status === 'imprimiendo') return 'border-l-4 border-l-violet-400 bg-violet-50/40 hover:bg-violet-100/60 dark:border-l-violet-700 dark:bg-violet-950/15 dark:hover:bg-violet-950/25'
  if (status === 'listo') return 'border-l-4 border-l-amber-400 bg-amber-50/40 hover:bg-amber-100/60 dark:border-l-amber-700 dark:bg-amber-950/15 dark:hover:bg-amber-950/25'
  if (status === 'entregado') return 'border-l-4 border-l-emerald-400 bg-emerald-50/40 hover:bg-emerald-100/60 dark:border-l-emerald-700 dark:bg-emerald-950/15 dark:hover:bg-emerald-950/25'
  return 'border-l-4 border-l-slate-300 bg-card hover:bg-muted/45 dark:border-l-slate-700'
}
