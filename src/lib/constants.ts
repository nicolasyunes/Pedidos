export const ORDER_STATUS = {
  pedido: { label: 'Pedido', color: 'bg-sky-500 text-white', textColor: 'text-sky-600', icon: '' },
  imprimiendo: { label: 'Imprimiendo', color: 'bg-violet-500 text-white', textColor: 'text-violet-600', icon: '' },
  listo: { label: 'Listo', color: 'bg-amber-400 text-slate-900', textColor: 'text-amber-600', icon: '' },
  entregado: { label: 'Entregado', color: 'bg-emerald-500 text-white', textColor: 'text-emerald-600', icon: '' },
  cancelado: { label: 'Cancelado', color: 'bg-slate-500 text-white', textColor: 'text-slate-600', icon: '' },
} as const

export const ORDER_CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: '' },
  instagram: { label: 'Instagram', icon: '' },
  facebook: { label: 'Facebook', icon: '' },
  presencial: { label: 'Presencial', icon: '' },
  otro: { label: 'Otro', icon: '' },
} as const

export const ORDER_PRIORITY = {
  normal: { label: 'Normal', color: 'bg-gray-200 text-gray-700' },
  urgente: { label: 'Urgente', color: 'bg-red-500 text-white' },
} as const

export const PAYMENT_STATUS = {
  sin_sena: { label: 'Sin seña', color: 'bg-slate-100 text-slate-700' },
  con_sena: { label: 'Con seña', color: 'bg-cyan-100 text-cyan-700' },
  pagado: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
} as const

export const PAYMENT_METHODS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercado_pago: 'Mercado Pago',
  otro: 'Otro',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS
export type OrderChannel = keyof typeof ORDER_CHANNELS
export type OrderPriority = keyof typeof ORDER_PRIORITY
