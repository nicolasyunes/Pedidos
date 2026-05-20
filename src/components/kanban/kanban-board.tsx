import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useOrders } from '@/hooks/use-orders'
import { useOrdersRealtime } from '@/hooks/use-realtime'
import { KanbanColumn } from './kanban-column'
import { ORDER_STATUS, type OrderStatus } from '@/lib/constants'
import { Button } from '@/components/ui/button'

const columns: { id: OrderStatus; title: string }[] = [
  { id: 'new', title: ORDER_STATUS.new.label },
  { id: 'processing', title: ORDER_STATUS.processing.label },
  { id: 'ready', title: ORDER_STATUS.ready.label },
  { id: 'delivered', title: ORDER_STATUS.delivered.label },
]

export function KanbanBoard() {
  useOrdersRealtime()
  const { data: orders, isLoading } = useOrders()
  const navigate = useNavigate()
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex h-[calc(100svh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Tablero</h2>
        <Button
          size="sm"
          onClick={() => navigate('/new-order')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            orders={orders?.filter((o) => o.status === column.id) || []}
            draggedOrder={draggedOrder}
            onDragStart={setDraggedOrder}
          />
        ))}
      </div>
    </div>
  )
}
