import { KanbanCard } from './kanban-card'
import { useUpdateOrder } from '@/hooks/use-orders'
import { ORDER_STATUS, type OrderStatus } from '@/lib/constants'
import type { OrderWithItems } from '@/types'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  column: { id: OrderStatus; title: string }
  orders: OrderWithItems[]
  draggedOrder: string | null
  onDragStart: (id: string | null) => void
}

export function KanbanColumn({ column, orders, draggedOrder, onDragStart }: KanbanColumnProps) {
  const updateOrder = useUpdateOrder()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const orderId = e.dataTransfer.getData('orderId')
    if (orderId && orderId !== draggedOrder) {
      await updateOrder.mutateAsync({ id: orderId, status: column.id })
    }
    onDragStart(null)
  }

  const statusConfig = ORDER_STATUS[column.id]

  return (
    <div
      className={cn(
        'flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-lg border',
        draggedOrder && 'bg-muted/50'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={cn('flex items-center justify-between rounded-t-lg px-3 py-2', statusConfig.color)}>
        <h3 className="font-semibold text-white">{column.title}</h3>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
          {orders.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {orders.map((order) => (
          <KanbanCard
            key={order.id}
            order={order}
            onDragStart={() => onDragStart(order.id)}
            onDragEnd={() => onDragStart(null)}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            Sin pedidos
          </div>
        )}
      </div>
    </div>
  )
}
