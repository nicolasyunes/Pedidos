import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useCreateOrder } from '@/hooks/use-orders'
import { orderFormSchema } from '@/lib/validations'
import { ORDER_CHANNELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface OrderFormValues {
  customer_name: string
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'presencial'
  status: 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled'
  priority: 'normal' | 'urgent'
  delivery_date: string
  total_price: number
  deposit: number
  notes: string
  template_id: string | null
  items: {
    product_name: string
    quantity: number
    variant_notes: string
  }[]
}

export function OrderForm() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, register, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      customer_name: '',
      channel: 'whatsapp',
      status: 'new',
      priority: 'normal',
      delivery_date: '',
      total_price: 0,
      deposit: 0,
      notes: '',
      template_id: null,
      items: [{ product_name: '', quantity: 1, variant_notes: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const onSubmit = async (data: OrderFormValues) => {
    setLoading(true)
    try {
      await createOrder.mutateAsync({
        customer_name: data.customer_name,
        channel: data.channel,
        status: data.status,
        priority: data.priority,
        delivery_date: data.delivery_date || null,
        total_price: data.total_price,
        deposit: data.deposit,
        notes: data.notes,
        template_id: data.template_id || null,
      })
      navigate('/')
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Error al guardar: ' + (error.message || 'Revisá la consola'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Nuevo Pedido</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Cliente *</Label>
          <Input
            id="customer_name"
            {...register('customer_name')}
            placeholder="Nombre del cliente"
          />
          {errors.customer_name && (
            <p className="text-xs text-destructive">{errors.customer_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Canal</Label>
            <Controller
              control={control}
              name="channel"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_CHANNELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_date">Fecha de entrega</Label>
          <Input
            id="delivery_date"
            type="date"
            {...register('delivery_date')}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground">
            Tocá el campo para abrir el calendario
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_name: '', quantity: 1, variant_notes: '' })}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Producto"
                  {...register(`items.${index}.product_name`)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  <Input
                    placeholder="Notas (color, nombre, etc)"
                    {...register(`items.${index}.variant_notes`)}
                  />
                </div>

                {errors.items?.[index]?.product_name && (
                  <p className="text-xs text-destructive">
                    {errors.items[index].product_name.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_price">Precio total</Label>
            <Input
              id="total_price"
              type="number"
              step="0.01"
              {...register('total_price', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit">Seña</Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              {...register('deposit', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas / Detalles</Label>
          <textarea
            id="notes"
            {...register('notes')}
            placeholder="Detalles de personalización, instrucciones especiales..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/')}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Pedido'}
          </Button>
        </div>
      </form>
    </div>
  )
}
