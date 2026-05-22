import { useNavigate, useParams } from 'react-router-dom'
import { Bell, Copy, Pencil, Trash2 } from 'lucide-react'
import { useDeleteOrder, useOrder, useUpdateOrder } from '@/hooks/use-orders'
import { ORDER_CHANNELS, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, isUrgent } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkspaceShell } from '@/components/layout/workspace-shell'

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(id || '')
  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()

  if (isLoading) {
    return (
      <div className="flex h-[calc(100svh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-[calc(100svh-7rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Button onClick={() => navigate('/')}>Volver</Button>
      </div>
    )
  }

  const urgent = isUrgent(order.due_date)
  const nextStatus = order.status === 'pedido'
    ? 'imprimiendo'
    : order.status === 'imprimiendo'
      ? 'listo'
      : order.status === 'listo'
        ? 'entregado'
        : null

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      await deleteOrder.mutateAsync(order.id)
      navigate('/')
    }
  }

  return (
    <WorkspaceShell
      eyebrow={`#${order.order_number} · ${ORDER_CHANNELS[order.channel].label}`}
      title={order.product_name}
      description={order.contact_handle}
      tone="orders"
    >
      <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Badge>
          <Badge className={PAYMENT_STATUS[order.payment_status].color}>{PAYMENT_STATUS[order.payment_status].label}</Badge>
          {order.priority === 'urgente' && <Badge variant="destructive">Urgente</Badge>}
          {order.notified && <Badge className="bg-emerald-100 text-emerald-700">Avisado</Badge>}
          {urgent && order.status !== 'entregado' && <Badge variant="destructive">Vence pronto</Badge>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Detalle del pedido</p>

          {order.customization_summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Personalización</p>
              <p className="mt-0.5 text-sm">{order.customization_summary}</p>
            </div>
          )}

          {order.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notas</p>
              <p className="mt-0.5 text-sm">{order.description}</p>
            </div>
          )}

          {order.customizations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Campos</p>
              <div className="flex flex-wrap gap-2">
                {order.customizations
                  .filter((c) => c.value_text?.trim() && !(c.field_type === 'boolean' && c.value_text === 'false'))
                  .map((c) => (
                    <Badge key={c.id} variant="outline" className="rounded-full border-border/60 bg-background/80 px-3 py-1">
                      {c.field_type === 'boolean' ? c.field_name : `${c.field_name}: ${formatCustomizationValue(c.value_text ?? '', c.field_type)}`}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Información financiera</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card px-3 py-2 border border-border/50">
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-base font-bold">{formatCurrency(order.sale_price)}</p>
            </div>
            <div className="rounded-xl bg-card px-3 py-2 border border-border/50">
              <p className="text-[10px] text-muted-foreground">Seña</p>
              <p className="text-base font-bold">{formatCurrency(order.deposit_amount)}</p>
            </div>
            <div className="rounded-xl bg-card px-3 py-2 border border-border/50">
              <p className="text-[10px] text-muted-foreground">Saldo</p>
              <p className="text-base font-bold">{formatCurrency(order.balance_amount)}</p>
            </div>
            <div className="rounded-xl bg-card px-3 py-2 border border-border/50">
              <p className="text-[10px] text-muted-foreground">Pago final</p>
              <p className="text-base font-bold">{order.final_payment_method ? PAYMENT_METHODS[order.final_payment_method] : '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">Entrega:</span>
            <span className={urgent && order.status !== 'entregado' ? 'font-semibold text-destructive' : 'font-medium'}>
              {formatDate(order.due_date)}
            </span>
            <span className="text-muted-foreground">Creado:</span>
            <span className="font-medium">{formatDate(order.created_at)}</span>
            {order.delivered_at && (
              <>
                <span className="text-muted-foreground">Entregado:</span>
                <span className="font-medium">{formatDate(order.delivered_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 p-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acciones</p>
        <div className="grid grid-cols-2 gap-2">
          {nextStatus && (
            <Button className="w-full col-span-2" onClick={() => updateOrder.mutate({ id: order.id, status: nextStatus })}>
              Mover a {ORDER_STATUS[nextStatus].label}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => updateOrder.mutate({ id: order.id, notified: !order.notified })}>
            <Bell className="mr-2 h-4 w-4" />
            {order.notified ? 'Quitar aviso' : 'Avisar'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(`/new-order?duplicate=${order.id}`)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(`/order/${order.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {order.status === 'pedido' && (
            <Button variant="destructive" className="w-full col-span-2" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar pedido
            </Button>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}

function formatCustomizationValue(value: string, fieldType: string) {
  if (fieldType === 'boolean') return value === 'true' ? 'Sí' : value === 'false' ? 'No' : value
  return value
}
