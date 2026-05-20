import { useNavigate } from 'react-router-dom'
import { MessageCircle, Camera, Globe, Store } from 'lucide-react'
import { formatCurrency, formatDateShort, isUrgent, daysUntilDelivery } from '@/lib/utils'
import type { OrderWithItems } from '@/types'
import { cn } from '@/lib/utils'

const channelIcons = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: Globe,
  presencial: Store,
}

interface KanbanCardProps {
  order: OrderWithItems
  onDragStart: () => void
  onDragEnd: () => void
}

export function KanbanCard({ order, onDragStart, onDragEnd }: KanbanCardProps) {
  const navigate = useNavigate()
  const urgent = isUrgent(order.delivery_date)
  const days = daysUntilDelivery(order.delivery_date)
  const ChannelIcon = channelIcons[order.channel]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/order/${order.id}`)}
      className={cn(
        'cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md',
        urgent && 'border-urgent border-l-4',
        order.priority === 'urgent' && 'border-urgent border-l-4'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-sm">{order.customer_name}</p>
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {order.items?.map((item) => `${item.product_name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ') || 'Sin detalles'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {order.priority === 'urgent' && (
            <span className="rounded-full bg-urgent px-1.5 py-0.5 text-[10px] font-medium text-white">
              !
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {order.delivery_date && (
            <span className={cn(
              'text-xs font-medium',
              urgent ? 'text-urgent' : 'text-muted-foreground'
            )}>
              {formatDateShort(order.delivery_date)}
              {days !== null && days < 0 && ' (vencido)'}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold">
          {formatCurrency(order.total_price)}
        </span>
      </div>

      {order.deposit > 0 && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Seña: {formatCurrency(order.deposit)}
        </div>
      )}
    </div>
  )
}
