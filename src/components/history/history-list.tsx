import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DollarSign, HandCoins, RotateCcw, ShoppingBag, TrendingUp } from 'lucide-react'
import { useOrders, useUpdateOrder } from '@/hooks/use-orders'
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants'
import type { Order } from '@/types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { WorkspaceShell } from '@/components/layout/workspace-shell'

export function HistoryList() {
  const { data: orders = [], isLoading } = useOrders('history')
  const updateOrder = useUpdateOrder()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return orders.filter((order: Order) => {
      const deliveredDate = order.delivered_at?.slice(0, 10) ?? order.cancelled_at?.slice(0, 10) ?? order.updated_at.slice(0, 10)
      const matchesFrom = !from || deliveredDate >= from
      const matchesTo = !to || deliveredDate <= to
      const matchesSearch = !search.trim() || [order.product_name, order.contact_handle, order.customization_summary]
        .join(' ')
        .toLowerCase()
        .includes(search.trim().toLowerCase())

      return matchesFrom && matchesTo && matchesSearch
    })
  }, [from, orders, search, to])

  const delivered = useMemo(() => filtered.filter((o: Order) => o.status === 'entregado'), [filtered])

  const kpis = useMemo(() => {
    const totalSales = delivered.reduce((sum: number, o: Order) => sum + (o.sale_price || 0), 0)
    const totalDeposits = delivered.reduce((sum: number, o: Order) => sum + (o.deposit_amount || 0), 0)
    const totalBalance = delivered.reduce((sum: number, o: Order) => sum + (o.balance_amount || 0), 0)
    const avgTicket = delivered.length > 0 ? Math.round(totalSales / delivered.length) : 0
    const pctCollected = totalSales > 0 ? Math.round((totalDeposits / totalSales) * 100) : 0
    return { count: delivered.length, totalSales, totalDeposits, totalBalance, avgTicket, pctCollected }
  }, [delivered])

  return (
    <WorkspaceShell
      eyebrow="Histórico"
      title="Ventas entregadas y canceladas"
      description="Filtrá por rango de fechas y buscá rápido por producto o contacto."
      tone="history"
    >
      <div className="space-y-3 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <KpiCard icon={<ShoppingBag className="h-4 w-4" />} label="Entregados" value={kpis.count} accent="text-emerald-600 dark:text-emerald-400" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Venta total" value={formatCurrency(kpis.totalSales)} />
          <KpiCard
            icon={<HandCoins className="h-4 w-4" />}
            label="Cobrado"
            value={`${formatCurrency(kpis.totalDeposits)}`}
            accent="text-emerald-600 dark:text-emerald-400"
            subtitle={kpis.totalSales > 0 ? `${kpis.pctCollected}% cobrado` : undefined}
          />
          <KpiCard
            icon={<DollarSign className="h-4 w-4" />}
            label={kpis.totalBalance > 0 ? "Por cobrar" : "Por cobrar"}
            value={formatCurrency(kpis.totalBalance)}
            accent={kpis.totalBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}
          />
        </div>

        <div className="space-y-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">Desde</span>
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} onClick={(e) => (e.target as HTMLInputElement)?.showPicker?.()} className="h-9 rounded-2xl pl-11 text-sm" />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">Hasta</span>
              <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} onClick={(e) => (e.target as HTMLInputElement)?.showPicker?.()} className="h-9 rounded-2xl pl-11 text-sm" />
            </div>
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por producto o contacto"
            className="h-9 rounded-2xl text-sm"
          />
        </div>

        <section className="space-y-2">
          {isLoading && (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-muted-foreground">Cargando histórico...</CardContent>
            </Card>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-muted-foreground">No hay ventas en ese rango.</CardContent>
            </Card>
          )}

          {filtered.map((order: Order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Badge className={cn(ORDER_STATUS[order.status].color, 'text-[10px] px-2 py-0.5 shrink-0')}>{ORDER_STATUS[order.status].label}</Badge>
                <Badge className={cn(PAYMENT_STATUS[order.payment_status].color, 'text-[10px] px-2 py-0.5 shrink-0')}>{PAYMENT_STATUS[order.payment_status].label}</Badge>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold">{order.product_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{order.contact_handle} · #{order.order_number}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <HistoryMeta label="Total" value={formatCurrency(order.sale_price)} />
                <HistoryMeta label="Seña" value={formatCurrency(order.deposit_amount)} />
                <HistoryMeta label="Saldo" value={formatCurrency(order.balance_amount)} />
                <HistoryMeta label={order.delivered_at ? "Entregado" : "Actualizado"} value={formatDate(order.delivered_at ?? order.cancelled_at ?? order.updated_at)} />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl shrink-0 text-xs h-8"
                onClick={() => updateOrder.mutate(
                  { id: order.id, status: 'pedido', delivered_at: null, cancelled_at: null },
                  { onSuccess: () => toast.success('Pedido reactivado') }
                )}
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Reactivar
              </Button>
            </div>
          ))}
        </section>

        {kpis.totalBalance > 0 && (
          <p className="text-[10px] text-muted-foreground italic">* Hay entregados con saldo pendiente de cobro.</p>
        )}
      </div>
    </WorkspaceShell>
  )
}

function KpiCard({ icon, label, value, accent, subtitle }: { icon: React.ReactNode; label: string; value: string | number; accent?: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3.5 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tracking-tight', accent || 'text-foreground')}>{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] text-muted-foreground">{label}:</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  )
}
