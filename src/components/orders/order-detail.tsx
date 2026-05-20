import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Copy, Pencil, Trash2 } from 'lucide-react'
import { useOrder, useUpdateOrder, useDeleteOrder } from '@/hooks/use-orders'
import { ORDER_CHANNELS, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, isUrgent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  const statusConfig = ORDER_STATUS[order.status]
  const urgent = isUrgent(order.due_date)
  const nextStatus = order.status === 'pedido'
    ? 'imprimiendo'
    : order.status === 'imprimiendo'
      ? 'listo'
      : order.status === 'listo'
        ? 'entregado'
        : null

  const handleStatusChange = async (newStatus: string) => {
    await updateOrder.mutateAsync({ id: order.id, status: newStatus as any })
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      await deleteOrder.mutateAsync(order.id)
      navigate('/')
    }
  }

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{order.product_name}</h2>
          <p className="truncate text-sm text-muted-foreground">{order.contact_handle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          {order.priority === 'urgente' && (
            <Badge variant="destructive">Urgente</Badge>
          )}
          <Badge className={PAYMENT_STATUS[order.payment_status].color}>{PAYMENT_STATUS[order.payment_status].label}</Badge>
          {order.notified && <Badge className="bg-emerald-100 text-emerald-700">Avisado</Badge>}
          {urgent && order.status !== 'entregado' && (
            <Badge variant="destructive">Vence pronto</Badge>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Producto</p>
              <p className="mt-1 font-medium">{order.product_name}</p>
            </div>

            {order.customization_summary && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Personalización</p>
                <p className="mt-1 text-sm">{order.customization_summary}</p>
              </div>
            )}

            {order.description && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notas</p>
                <p className="mt-1 text-sm">{order.description}</p>
              </div>
            )}

            {order.customizations.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Campos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {order.customizations.map((customization) => (
                    <Badge key={customization.id} variant="outline">
                      {customization.field_name}: {customization.value_text ?? 'Sí'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Canal</span>
              <span className="text-sm">{ORDER_CHANNELS[order.channel].label}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contacto</span>
              <span className="text-sm font-medium">{order.contact_handle}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Entrega</span>
              <span className={`text-sm font-medium ${urgent ? 'text-destructive' : ''}`}>
                {formatDate(order.due_date)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold">{formatCurrency(order.sale_price)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seña</span>
              <span className="text-sm">{formatCurrency(order.deposit_amount)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo</span>
              <span className="text-sm font-medium">{formatCurrency(order.balance_amount)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pago final</span>
              <span className="text-sm">{order.final_payment_method ? PAYMENT_METHODS[order.final_payment_method] : 'Sin registrar'}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {nextStatus && (
            <Button
              className="w-full"
              onClick={() => handleStatusChange(nextStatus)}
            >
              Mover a {ORDER_STATUS[nextStatus].label}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => updateOrder.mutate({ id: order.id, notified: !order.notified })}
          >
            <Bell className="mr-2 h-4 w-4" />
            {order.notified ? 'Quitar aviso' : 'Marcar avisado'}
          </Button>

          <Button variant="outline" className="w-full" onClick={() => navigate(`/new-order?duplicate=${order.id}`)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar pedido
          </Button>

          <Button variant="outline" className="w-full" onClick={() => navigate(`/order/${order.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar pedido
          </Button>

          {order.status === 'pedido' && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
