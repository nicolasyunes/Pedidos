import type {
  Database,
  Order,
  OrderCustomization,
  OrderPriority,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Template,
  TemplateField,
} from '@/types'
import { hasSupabaseConfig, supabase } from '@/lib/supabase/client'

const ORDERS_KEY = 'pedidos3d_orders_v2'
const TEMPLATES_KEY = 'pedidos3d_templates_v2'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type TemplateRow = Database['public']['Tables']['templates']['Row']
type TemplateInsert = Database['public']['Tables']['templates']['Insert']

function nowIso() {
  return new Date().toISOString()
}

function makeId() {
  return crypto.randomUUID()
}

function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Number(value))
}

function derivePaymentStatus(salePrice: number, depositAmount: number): PaymentStatus {
  const balance = Math.max(salePrice - depositAmount, 0)

  if (salePrice === 0 && depositAmount === 0) return 'sin_sena'
  if (balance === 0) return 'pagado'
  if (depositAmount > 0) return 'con_sena'
  return 'sin_sena'
}

function toTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    suggested_price: Number(row.suggested_price ?? 0),
    fields: Array.isArray(row.fields_json) ? row.fields_json : [],
    is_favorite: row.is_favorite,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toTemplateInsert(template: TemplateInput): TemplateInsert {
  return {
    name: template.name,
    description: template.description,
    suggested_price: template.suggested_price,
    fields_json: template.fields,
    is_favorite: template.is_favorite,
    is_active: template.is_active,
  }
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    channel: row.channel,
    contact_handle: row.contact_handle,
    product_name: row.product_name,
    description: row.description ?? '',
    customization_summary: row.customization_summary ?? '',
    customizations: Array.isArray(row.customizations_json) ? row.customizations_json : [],
    template_id: row.template_id,
    status: row.status,
    payment_status: row.payment_status,
    priority: row.priority,
    sale_price: Number(row.sale_price),
    deposit_amount: Number(row.deposit_amount),
    balance_amount: Number(row.balance_amount),
    final_payment_method: row.final_payment_method,
    due_date: row.due_date,
    notified: row.notified,
    notified_at: row.notified_at,
    delivered_at: row.delivered_at,
    cancelled_at: row.cancelled_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toOrderInsert(input: OrderInput): OrderInsert {
  const salePrice = normalizeMoney(input.sale_price)
  const depositAmount = normalizeMoney(input.deposit_amount)
  const balanceAmount = Math.max(salePrice - depositAmount, 0)

  return {
    channel: input.channel,
    contact_handle: input.contact_handle.trim(),
    product_name: input.product_name.trim(),
    description: input.description.trim(),
    customization_summary: input.customization_summary.trim(),
    customizations_json: input.customizations,
    template_id: input.template_id,
    status: input.status,
    payment_status: derivePaymentStatus(salePrice, depositAmount),
    priority: input.priority,
    sale_price: salePrice,
    deposit_amount: depositAmount,
    balance_amount: balanceAmount,
    final_payment_method: input.final_payment_method,
    due_date: input.due_date,
    notified: input.notified,
    notified_at: input.notified ? input.notified_at ?? nowIso() : null,
    delivered_at: input.status === 'entregado' ? input.delivered_at ?? nowIso() : null,
    cancelled_at: input.status === 'cancelado' ? input.cancelled_at ?? nowIso() : null,
  }
}

function readLocal<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getSeedTemplates(): Template[] {
  const commonColorField = (name: string): TemplateField => ({
    id: makeId(),
    name,
    type: 'color',
    required: false,
    options: ['Blanco', 'Negro', 'Rojo', 'Azul', 'Amarillo', 'Verde'],
  })

  return [
    {
      id: makeId(),
      name: 'Caja Figuritas Mundial',
      description: 'Plantilla para cajas virales con variante y nombre opcional.',
      suggested_price: 18000,
      is_favorite: true,
      is_active: true,
      fields: [
        { id: makeId(), name: 'Variante', type: 'select', required: true, options: ['100 figus', '200 figus'] },
        commonColorField('Color primario'),
        commonColorField('Color secundario'),
        { id: makeId(), name: 'Nombre', type: 'text', required: false, options: [] },
        { id: makeId(), name: 'Notas', type: 'textarea', required: false, options: [] },
      ],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: makeId(),
      name: 'Mate personalizado',
      description: 'Color, nombre y detalle rápido para venta repetitiva.',
      suggested_price: 12000,
      is_favorite: true,
      is_active: true,
      fields: [
        commonColorField('Color'),
        { id: makeId(), name: 'Nombre', type: 'text', required: false, options: [] },
      ],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ]
}

function getSeedOrders(templates: Template[]): Order[] {
  const caja = templates.find((template) => template.name === 'Caja Figuritas Mundial')
  const mate = templates.find((template) => template.name === 'Mate personalizado')

  return [
    {
      id: makeId(),
      order_number: 101,
      channel: 'whatsapp',
      contact_handle: '@tomi.figus',
      product_name: 'Caja Figuritas Mundial',
      description: 'Cliente confirmado, quiere retiro el jueves.',
      customization_summary: '100 figus, celeste/blanco, nombre Tomi',
      customizations: [
        { id: makeId(), field_name: 'Variante', field_type: 'select', value_text: '100 figus', value_json: null, sort_order: 0 },
        { id: makeId(), field_name: 'Color primario', field_type: 'color', value_text: 'Celeste', value_json: null, sort_order: 1 },
        { id: makeId(), field_name: 'Color secundario', field_type: 'color', value_text: 'Blanco', value_json: null, sort_order: 2 },
        { id: makeId(), field_name: 'Nombre', field_type: 'text', value_text: 'Tomi', value_json: null, sort_order: 3 },
      ],
      template_id: caja?.id ?? null,
      status: 'pedido',
      payment_status: 'con_sena',
      priority: 'urgente',
      sale_price: 18000,
      deposit_amount: 7000,
      balance_amount: 11000,
      final_payment_method: null,
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      notified: false,
      notified_at: null,
      delivered_at: null,
      cancelled_at: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: nowIso(),
    },
    {
      id: makeId(),
      order_number: 102,
      channel: 'instagram',
      contact_handle: '@sofi.prints',
      product_name: 'Mate personalizado',
      description: 'Duplicado de pedido anterior, solo cambia color.',
      customization_summary: 'Negro con nombre Sofi',
      customizations: [
        { id: makeId(), field_name: 'Color', field_type: 'color', value_text: 'Negro', value_json: null, sort_order: 0 },
        { id: makeId(), field_name: 'Nombre', field_type: 'text', value_text: 'Sofi', value_json: null, sort_order: 1 },
      ],
      template_id: mate?.id ?? null,
      status: 'imprimiendo',
      payment_status: 'sin_sena',
      priority: 'normal',
      sale_price: 12000,
      deposit_amount: 0,
      balance_amount: 12000,
      final_payment_method: null,
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      notified: false,
      notified_at: null,
      delivered_at: null,
      cancelled_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: nowIso(),
    },
    {
      id: makeId(),
      order_number: 100,
      channel: 'presencial',
      contact_handle: 'Lucas local',
      product_name: 'Soporte PS5',
      description: 'Retirado en el local.',
      customization_summary: 'Blanco, entrega cumplida',
      customizations: [],
      template_id: null,
      status: 'entregado',
      payment_status: 'pagado',
      priority: 'normal',
      sale_price: 9500,
      deposit_amount: 9500,
      balance_amount: 0,
      final_payment_method: 'efectivo',
      due_date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
      notified: true,
      notified_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      delivered_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      cancelled_at: null,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: nowIso(),
    },
  ]
}

function ensureLocalSeed() {
  const templates = readLocal<Template[]>(TEMPLATES_KEY, [])
  if (templates.length === 0) {
    const seededTemplates = getSeedTemplates()
    writeLocal(TEMPLATES_KEY, seededTemplates)
    writeLocal(ORDERS_KEY, getSeedOrders(seededTemplates))
    return
  }

  const orders = readLocal<Order[]>(ORDERS_KEY, [])
  if (orders.length === 0) {
    writeLocal(ORDERS_KEY, getSeedOrders(templates))
  }
}

export interface OrdersFilters {
  scope?: 'active' | 'history' | 'all'
}

export interface OrderInput {
  channel: Order['channel']
  contact_handle: string
  product_name: string
  description: string
  customization_summary: string
  customizations: OrderCustomization[]
  template_id: string | null
  status: OrderStatus
  priority: OrderPriority
  sale_price: number
  deposit_amount: number
  final_payment_method: PaymentMethod | null
  due_date: string | null
  notified: boolean
  notified_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
}

export type OrderUpdate = Partial<OrderInput> & { id: string }

export interface TemplateInput {
  name: string
  description: string
  suggested_price: number
  fields: TemplateField[]
  is_favorite: boolean
  is_active: boolean
}

function sortOrders(orders: Order[], scope: OrdersFilters['scope']) {
  if (scope === 'history') {
    return [...orders].sort((a, b) => {
      const aDate = a.delivered_at ?? a.cancelled_at ?? a.updated_at
      const bDate = b.delivered_at ?? b.cancelled_at ?? b.updated_at
      return bDate.localeCompare(aDate)
    })
  }

  return [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

async function listOrdersLocal(filters: OrdersFilters = {}) {
  ensureLocalSeed()
  const orders = readLocal<Order[]>(ORDERS_KEY, [])
  const scope = filters.scope ?? 'active'
  const filtered = orders.filter((order) => {
    if (scope === 'active') return order.status !== 'entregado' && order.status !== 'cancelado'
    if (scope === 'history') return order.status === 'entregado' || order.status === 'cancelado'
    return true
  })
  return sortOrders(filtered, scope)
}

async function listOrdersRemote(filters: OrdersFilters = {}) {
  if (!supabase) return listOrdersLocal(filters)

  const client = supabase as any

  let query = client.from('orders').select('*')
  const scope = filters.scope ?? 'active'

  if (scope === 'active') {
    query = query.not('status', 'in', '(entregado,cancelado)')
  }

  if (scope === 'history') {
    query = query.in('status', ['entregado', 'cancelado'])
  }

  query = scope === 'history'
    ? query.order('delivered_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false })
    : query.order('created_at', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toOrder)
}

export async function listOrders(filters: OrdersFilters = {}) {
  return hasSupabaseConfig ? listOrdersRemote(filters) : listOrdersLocal(filters)
}

async function getOrderLocal(id: string) {
  ensureLocalSeed()
  return readLocal<Order[]>(ORDERS_KEY, []).find((order) => order.id === id) ?? null
}

async function getOrderRemote(id: string) {
  if (!supabase) return getOrderLocal(id)

  const { data, error } = await (supabase as any).from('orders').select('*').eq('id', id).single()
  if (error) throw error
  return toOrder(data)
}

export async function getOrder(id: string) {
  return hasSupabaseConfig ? getOrderRemote(id) : getOrderLocal(id)
}

async function createOrderLocal(input: OrderInput) {
  ensureLocalSeed()
  const orders = readLocal<Order[]>(ORDERS_KEY, [])
  const nextNumber = orders.reduce((max, order) => Math.max(max, order.order_number), 100) + 1
  const normalized = toOrder({
    id: makeId(),
    order_number: nextNumber,
    ...toOrderInsert(input),
    created_at: nowIso(),
    updated_at: nowIso(),
  } as OrderRow)
  writeLocal(ORDERS_KEY, [...orders, normalized])
  return normalized
}

async function createOrderRemote(input: OrderInput) {
  if (!supabase) return createOrderLocal(input)
  const { data, error } = await (supabase as any).from('orders').insert(toOrderInsert(input)).select('*').single()
  if (error) throw error
  return toOrder(data)
}

export async function createOrder(input: OrderInput) {
  return hasSupabaseConfig ? createOrderRemote(input) : createOrderLocal(input)
}

async function updateOrderLocal(update: OrderUpdate) {
  ensureLocalSeed()
  const orders = readLocal<Order[]>(ORDERS_KEY, [])
  const current = orders.find((order) => order.id === update.id)
  if (!current) throw new Error('Pedido no encontrado')

  const normalized = toOrder({
    id: current.id,
    order_number: current.order_number,
    ...toOrderInsert({
      channel: update.channel ?? current.channel,
      contact_handle: update.contact_handle ?? current.contact_handle,
      product_name: update.product_name ?? current.product_name,
      description: update.description ?? current.description,
      customization_summary: update.customization_summary ?? current.customization_summary,
      customizations: update.customizations ?? current.customizations,
      template_id: update.template_id ?? current.template_id,
      status: update.status ?? current.status,
      priority: update.priority ?? current.priority,
      sale_price: update.sale_price ?? current.sale_price,
      deposit_amount: update.deposit_amount ?? current.deposit_amount,
      final_payment_method: update.final_payment_method ?? current.final_payment_method,
      due_date: update.due_date ?? current.due_date,
      notified: update.notified ?? current.notified,
      notified_at: update.notified_at ?? current.notified_at,
      delivered_at: update.delivered_at ?? current.delivered_at,
      cancelled_at: update.cancelled_at ?? current.cancelled_at,
    }),
    created_at: current.created_at,
    updated_at: nowIso(),
  } as OrderRow)

  writeLocal(ORDERS_KEY, orders.map((order) => (order.id === update.id ? normalized : order)))
  return normalized
}

async function updateOrderRemote(update: OrderUpdate) {
  if (!supabase) return updateOrderLocal(update)
  const current = await getOrderRemote(update.id)
  if (!current) throw new Error('Pedido no encontrado')

  const payload = toOrderInsert({
    channel: update.channel ?? current.channel,
    contact_handle: update.contact_handle ?? current.contact_handle,
    product_name: update.product_name ?? current.product_name,
    description: update.description ?? current.description,
    customization_summary: update.customization_summary ?? current.customization_summary,
    customizations: update.customizations ?? current.customizations,
    template_id: update.template_id ?? current.template_id,
    status: update.status ?? current.status,
    priority: update.priority ?? current.priority,
    sale_price: update.sale_price ?? current.sale_price,
    deposit_amount: update.deposit_amount ?? current.deposit_amount,
    final_payment_method: update.final_payment_method ?? current.final_payment_method,
    due_date: update.due_date ?? current.due_date,
    notified: update.notified ?? current.notified,
    notified_at: update.notified_at ?? current.notified_at,
    delivered_at: update.delivered_at ?? current.delivered_at,
    cancelled_at: update.cancelled_at ?? current.cancelled_at,
  })

  const { data, error } = await (supabase as any).from('orders').update(payload).eq('id', update.id).select('*').single()
  if (error) throw error
  return toOrder(data)
}

export async function updateOrder(update: OrderUpdate) {
  return hasSupabaseConfig ? updateOrderRemote(update) : updateOrderLocal(update)
}

async function deleteOrderLocal(id: string) {
  ensureLocalSeed()
  const orders = readLocal<Order[]>(ORDERS_KEY, [])
  writeLocal(ORDERS_KEY, orders.filter((order) => order.id !== id))
}

async function deleteOrderRemote(id: string) {
  if (!supabase) return deleteOrderLocal(id)
  const { error } = await (supabase as any).from('orders').delete().eq('id', id)
  if (error) throw error
}

export async function deleteOrder(id: string) {
  return hasSupabaseConfig ? deleteOrderRemote(id) : deleteOrderLocal(id)
}

async function listTemplatesLocal() {
  ensureLocalSeed()
  const templates = readLocal<Template[]>(TEMPLATES_KEY, [])
  return [...templates].sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || a.name.localeCompare(b.name))
}

async function listTemplatesRemote() {
  if (!supabase) return listTemplatesLocal()
  const { data, error } = await (supabase as any).from('templates').select('*').order('is_favorite', { ascending: false }).order('name')
  if (error) throw error
  return (data ?? []).map(toTemplate)
}

export async function listTemplates() {
  return hasSupabaseConfig ? listTemplatesRemote() : listTemplatesLocal()
}

async function createTemplateLocal(input: TemplateInput) {
  ensureLocalSeed()
  const templates = readLocal<Template[]>(TEMPLATES_KEY, [])
  const created: Template = {
    id: makeId(),
    name: input.name.trim(),
    description: input.description.trim(),
    suggested_price: normalizeMoney(input.suggested_price),
    fields: input.fields,
    is_favorite: input.is_favorite,
    is_active: input.is_active,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  writeLocal(TEMPLATES_KEY, [...templates, created])
  return created
}

async function createTemplateRemote(input: TemplateInput) {
  if (!supabase) return createTemplateLocal(input)
  const { data, error } = await (supabase as any).from('templates').insert(toTemplateInsert(input)).select('*').single()
  if (error) throw error
  return toTemplate(data)
}

export async function createTemplate(input: TemplateInput) {
  return hasSupabaseConfig ? createTemplateRemote(input) : createTemplateLocal(input)
}

async function updateTemplateLocal(id: string, input: TemplateInput) {
  ensureLocalSeed()
  const templates = readLocal<Template[]>(TEMPLATES_KEY, [])
  const current = templates.find((template) => template.id === id)
  if (!current) throw new Error('Plantilla no encontrada')

  const updated: Template = {
    ...current,
    ...input,
    name: input.name.trim(),
    description: input.description.trim(),
    suggested_price: normalizeMoney(input.suggested_price),
    updated_at: nowIso(),
  }
  writeLocal(TEMPLATES_KEY, templates.map((template) => (template.id === id ? updated : template)))
  return updated
}

async function updateTemplateRemote(id: string, input: TemplateInput) {
  if (!supabase) return updateTemplateLocal(id, input)
  const { data, error } = await (supabase as any).from('templates').update(toTemplateInsert(input)).eq('id', id).select('*').single()
  if (error) throw error
  return toTemplate(data)
}

export async function updateTemplate(id: string, input: TemplateInput) {
  return hasSupabaseConfig ? updateTemplateRemote(id, input) : updateTemplateLocal(id, input)
}

async function deleteTemplateLocal(id: string) {
  const templates = readLocal<Template[]>(TEMPLATES_KEY, [])
  writeLocal(TEMPLATES_KEY, templates.filter((t) => t.id !== id))
}

async function deleteTemplateRemote(id: string) {
  if (!supabase) return deleteTemplateLocal(id)
  const { error } = await (supabase as any).from('templates').delete().eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string) {
  return hasSupabaseConfig ? deleteTemplateRemote(id) : deleteTemplateLocal(id)
}
