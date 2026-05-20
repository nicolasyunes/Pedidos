import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Camera, Globe, Store, Trash2 } from 'lucide-react'
import { useOrder, useUpdateOrder, useDeleteOrder } from '@/hooks/use-orders'
import { ORDER_CHANNELS, ORDER_STATUS } from '@/lib/constants'
import { formatCurrency, formatDate, isUrgent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const channelIcons = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: Globe,
  presencial: Store,
}

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

  const ChannelIcon = channelIcons[order.channel]
  const statusConfig = ORDER_STATUS[order.status]
  const urgent = isUrgent(order.delivery_date)

  const nextStatus: Record<string, string> = {
    new: 'processing',
    processing: 'ready',
    ready: 'delivered',
  }

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
        <h2 className="text-lg font-semibold truncate">{order.customer_name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          {order.priority === 'urgent' && (
            <Badge variant="destructive">Urgente</Badge>
          )}
          {urgent && order.status !== 'delivered' && (
            <Badge variant="destructive">Vence pronto</Badge>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">{item.product_name} {item.quantity > 1 && `x${item.quantity}`}</p>
                {item.variant_notes && (
                  <p className="text-sm text-muted-foreground">{item.variant_notes}</p>
                )}
              </div>
            )) || <p className="text-sm text-muted-foreground">Sin items</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Canal</span>
              <div className="flex items-center gap-1">
                <ChannelIcon className="h-4 w-4" />
                <span className="text-sm">{ORDER_CHANNELS[order.channel].label}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Entrega</span>
              <span className={`text-sm font-medium ${urgent ? 'text-destructive' : ''}`}>
                {formatDate(order.delivery_date)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold">{formatCurrency(order.total_price)}</span>
            </div>

            {order.deposit > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seña</span>
                <span className="text-sm">{formatCurrency(order.deposit)}</span>
              </div>
            )}

            {order.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          {nextStatus[order.status] && (
            <Button
              className="w-full"
              onClick={() => handleStatusChange(nextStatus[order.status])}
            >
              Mover a {ORDER_STATUS[nextStatus[order.status] as keyof typeof ORDER_STATUS].label}
            </Button>
          )}

          {order.status === 'new' && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
