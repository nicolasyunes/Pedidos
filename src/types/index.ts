export type OrderStatus = 'pedido' | 'imprimiendo' | 'listo' | 'entregado' | 'cancelado'
export type OrderChannel = 'whatsapp' | 'instagram' | 'facebook' | 'presencial' | 'otro'
export type OrderPriority = 'normal' | 'urgente'
export type PaymentStatus = 'sin_sena' | 'con_sena' | 'pagado'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'mercado_pago' | 'otro'
export type TemplateFieldType = 'text' | 'select' | 'color' | 'textarea' | 'boolean'

export interface TemplateField {
  id: string
  name: string
  type: TemplateFieldType
  required: boolean
  options: string[]
}

export interface Template {
  id: string
  name: string
  description: string
  suggested_price: number
  fields: TemplateField[]
  is_favorite: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrderCustomization {
  id: string
  field_name: string
  field_type: TemplateFieldType
  value_text: string | null
  value_json: unknown | null
  sort_order: number
}

export interface Order {
  id: string
  order_number: number
  channel: OrderChannel
  contact_handle: string
  product_name: string
  description: string
  customization_summary: string
  customizations: OrderCustomization[]
  template_id: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  priority: OrderPriority
  sale_price: number
  deposit_amount: number
  balance_amount: number
  final_payment_method: PaymentMethod | null
  due_date: string | null
  notified: boolean
  notified_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderEvent {
  id: string
  order_id: string
  event_type: string
  payload_json: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          suggested_price: number | null
          fields_json: TemplateField[]
          is_favorite: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          suggested_price?: number | null
          fields_json?: TemplateField[]
          is_favorite?: boolean
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          suggested_price?: number | null
          fields_json?: TemplateField[]
          is_favorite?: boolean
          is_active?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          order_number: number
          channel: OrderChannel
          contact_handle: string
          product_name: string
          description: string | null
          customization_summary: string | null
          customizations_json: OrderCustomization[]
          template_id: string | null
          status: OrderStatus
          payment_status: PaymentStatus
          priority: OrderPriority
          sale_price: number
          deposit_amount: number
          balance_amount: number
          final_payment_method: PaymentMethod | null
          due_date: string | null
          notified: boolean
          notified_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel: OrderChannel
          contact_handle: string
          product_name: string
          description?: string | null
          customization_summary?: string | null
          customizations_json?: OrderCustomization[]
          template_id?: string | null
          status?: OrderStatus
          payment_status?: PaymentStatus
          priority?: OrderPriority
          sale_price?: number
          deposit_amount?: number
          balance_amount?: number
          final_payment_method?: PaymentMethod | null
          due_date?: string | null
          notified?: boolean
          notified_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_events: {
        Row: OrderEvent
        Insert: Omit<OrderEvent, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
