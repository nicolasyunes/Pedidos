export type OrderStatus = 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled'
export type OrderChannel = 'whatsapp' | 'instagram' | 'facebook' | 'presencial'
export type OrderPriority = 'normal' | 'urgent'

export interface Template {
  id: string
  name: string
  base_price: number
  default_vars: Record<string, unknown>
  is_favorite: boolean
  is_seasonal: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_name: string
  quantity: number
  variant_notes: string
  stl_url: string | null
  image_url: string | null
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  channel: OrderChannel
  status: OrderStatus
  priority: OrderPriority
  delivery_date: string | null
  total_price: number
  deposit: number
  notes: string
  template_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

export interface OrderEvent {
  id: string
  order_id: string
  event_type: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_by: string
  created_at: string
}
