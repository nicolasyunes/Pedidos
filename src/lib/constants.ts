export const ORDER_STATUS = {
  new: { label: 'Nuevos', color: 'bg-blue-500', textColor: 'text-blue-500', icon: '' },
  processing: { label: 'En Proceso', color: 'bg-orange-500', textColor: 'text-orange-500', icon: '' },
  ready: { label: 'Listo para Entregar', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: '' },
  delivered: { label: 'Entregado', color: 'bg-green-500', textColor: 'text-green-500', icon: '' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', textColor: 'text-gray-500', icon: '' },
} as const

export const ORDER_CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: '' },
  instagram: { label: 'Instagram', icon: '' },
  facebook: { label: 'Facebook', icon: '' },
  presencial: { label: 'Presencial', icon: '' },
} as const

export const ORDER_PRIORITY = {
  normal: { label: 'Normal', color: 'bg-gray-200 text-gray-700' },
  urgent: { label: 'Urgente', color: 'bg-red-500 text-white' },
} as const

export type OrderStatus = keyof typeof ORDER_STATUS
export type OrderChannel = keyof typeof ORDER_CHANNELS
export type OrderPriority = keyof typeof ORDER_PRIORITY
