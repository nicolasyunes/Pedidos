import { z } from 'zod'

export const orderItemSchema = z.object({
  product_name: z.string().min(1, 'Producto requerido'),
  quantity: z.coerce.number().min(1).default(1),
  variant_notes: z.string().default(''),
  stl_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
})

export const orderFormSchema = z.object({
  customer_name: z.string().min(1, 'Nombre del cliente requerido'),
  channel: z.enum(['whatsapp', 'instagram', 'facebook', 'presencial']),
  status: z.enum(['new', 'processing', 'ready', 'delivered', 'cancelled']).default('new'),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  delivery_date: z.string().optional().or(z.literal('')),
  total_price: z.coerce.number().min(0).default(0),
  deposit: z.coerce.number().min(0).default(0),
  notes: z.string().default(''),
  template_id: z.string().uuid().optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Al menos un item es requerido'),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>

export const templateFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  base_price: z.coerce.number().min(0).default(0),
  default_vars: z.record(z.string(), z.any()).default({}),
  is_favorite: z.boolean().default(false),
  is_seasonal: z.boolean().default(false),
})

export type TemplateFormValues = z.infer<typeof templateFormSchema>
