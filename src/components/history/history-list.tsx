import { useMemo, useState } from 'react'
import { useOrders } from '@/hooks/use-orders'
import { ORDER_STATUS } from '@/lib/constants'
import type { Order } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function HistoryList() {
  const { data: orders = [], isLoading } = useOrders('history')
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-6 pt-4">
      <section className="rounded-3xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Histórico de ventas</p>
        <h2 className="text-xl font-semibold">Filtrá por fecha de entrega y revisá rápido</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>

        <div className="mt-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por producto o contacto" />
        </div>
      </section>

      <section className="space-y-3">
        {isLoading && (
          <Card className="rounded-3xl">
            <CardContent className="p-6 text-sm text-muted-foreground">Cargando histórico...</CardContent>
          </Card>
        )}

        {!isLoading && filtered.length === 0 && (
          <Card className="rounded-3xl">
            <CardContent className="p-6 text-sm text-muted-foreground">No hay ventas en ese rango.</CardContent>
          </Card>
        )}

        {filtered.map((order: Order) => (
          <Card key={order.id} className="rounded-3xl shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pedido #{order.order_number}</p>
                  <h3 className="font-semibold">{order.product_name}</h3>
                  <p className="text-sm text-muted-foreground">{order.contact_handle}</p>
                </div>

                <Badge className={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Badge>
              </div>

              {order.customization_summary && (
                <p className="text-sm text-foreground/80">{order.customization_summary}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <HistoryMeta label="Total" value={formatCurrency(order.sale_price)} />
                <HistoryMeta label="Seña" value={formatCurrency(order.deposit_amount)} />
                <HistoryMeta label="Saldo" value={formatCurrency(order.balance_amount)} />
                <HistoryMeta label="Entrega" value={formatDate(order.delivered_at ?? order.cancelled_at ?? order.updated_at)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
