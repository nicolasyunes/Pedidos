import { z } from 'zod'

export const templateFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nombre de campo requerido'),
  type: z.enum(['text', 'select', 'color', 'textarea', 'boolean']),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
})

export const orderFormSchema = z.object({
  mode: z.enum(['free', 'template', 'duplicate']).default('free'),
  channel: z.enum(['whatsapp', 'instagram', 'facebook', 'presencial', 'otro']),
  contact_handle: z.string().min(1, 'Canal y usuario/contacto requerido'),
  product_name: z.string().min(1, 'Producto requerido'),
  description: z.string().default(''),
  customization_summary: z.string().default(''),
  template_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pedido', 'imprimiendo', 'listo', 'entregado', 'cancelado']).default('pedido'),
  priority: z.enum(['normal', 'urgente']).default('normal'),
  due_date: z.string().optional().or(z.literal('')),
  sale_price: z.coerce.number().min(0).default(0),
  deposit_amount: z.coerce.number().min(0).default(0),
  final_payment_method: z.enum(['efectivo', 'transferencia', 'mercado_pago', 'otro']).nullable().optional(),
  notified: z.boolean().default(false),
  duplicate_order_id: z.string().uuid().optional().nullable(),
  customizations: z.array(z.object({
    id: z.string(),
    field_name: z.string(),
    field_type: z.enum(['text', 'select', 'color', 'textarea', 'boolean']),
    value_text: z.string().nullable(),
    value_json: z.unknown().nullable(),
    sort_order: z.number(),
  })).default([]),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

export const templateFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  suggested_price: z.coerce.number().min(0).default(0),
  fields: z.array(templateFieldSchema).default([]),
  is_favorite: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>
