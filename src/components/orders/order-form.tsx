import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CopyPlus, Sparkles, Wand2 } from 'lucide-react'
import { useCreateOrder, useOrder, useOrders, useUpdateOrder } from '@/hooks/use-orders'
import { useTemplates } from '@/hooks/use-templates'
import { ORDER_CHANNELS, ORDER_STATUS, PAYMENT_METHODS } from '@/lib/constants'
import { orderFormSchema, type OrderFormValues } from '@/lib/validations'
import type { Order, OrderCustomization, Template, TemplateField } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formModes = [
  { value: 'free', label: 'Pedido libre', icon: Wand2 },
  { value: 'template', label: 'Desde plantilla', icon: Sparkles },
  { value: 'duplicate', label: 'Duplicar', icon: CopyPlus },
] as const

export function OrderForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const duplicateId = searchParams.get('duplicate')
  const initialTemplateId = searchParams.get('template')
  const editing = Boolean(id)

  const { data: templates = [] } = useTemplates()
  const { data: allOrders = [] } = useOrders('all')
  const { data: currentOrder } = useOrder(id ?? '')
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()
  const [loading, setLoading] = useState(false)

  const duplicateSource = useMemo(
    () => allOrders.find((order: Order) => order.id === duplicateId) ?? null,
    [allOrders, duplicateId]
  )

  const { control, handleSubmit, register, watch, setValue, reset, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      mode: duplicateId ? 'duplicate' : initialTemplateId ? 'template' : 'free',
      channel: 'whatsapp',
      contact_handle: '',
      product_name: '',
      description: '',
      customization_summary: '',
      template_id: initialTemplateId,
      status: 'pedido',
      priority: 'normal',
      due_date: '',
      sale_price: 0,
      deposit_amount: 0,
      final_payment_method: null,
      notified: false,
      duplicate_order_id: duplicateId,
      customizations: [],
    },
  })

  const mode = watch('mode')
  const selectedTemplateId = watch('template_id')
  const salePrice = watch('sale_price')
  const depositAmount = watch('deposit_amount')
  const selectedTemplate = templates.find((template: Template) => template.id === selectedTemplateId) ?? null
  const balance = Math.max((salePrice || 0) - (depositAmount || 0), 0)

  useEffect(() => {
    if (editing && currentOrder) {
      reset({
        mode: currentOrder.template_id ? 'template' : 'free',
        channel: currentOrder.channel,
        contact_handle: currentOrder.contact_handle,
        product_name: currentOrder.product_name,
        description: currentOrder.description,
        customization_summary: currentOrder.customization_summary,
        template_id: currentOrder.template_id,
        status: currentOrder.status,
        priority: currentOrder.priority,
        due_date: currentOrder.due_date ?? '',
        sale_price: currentOrder.sale_price,
        deposit_amount: currentOrder.deposit_amount,
        final_payment_method: currentOrder.final_payment_method,
        notified: currentOrder.notified,
        duplicate_order_id: null,
        customizations: currentOrder.customizations,
      })
      return
    }

    if (!editing && duplicateSource) {
      reset({
        mode: 'duplicate',
        channel: duplicateSource.channel,
        contact_handle: duplicateSource.contact_handle,
        product_name: duplicateSource.product_name,
        description: duplicateSource.description,
        customization_summary: duplicateSource.customization_summary,
        template_id: duplicateSource.template_id,
        status: 'pedido',
        priority: duplicateSource.priority,
        due_date: duplicateSource.due_date ?? '',
        sale_price: duplicateSource.sale_price,
        deposit_amount: 0,
        final_payment_method: null,
        notified: false,
        duplicate_order_id: duplicateSource.id,
        customizations: duplicateSource.customizations.map((customization: OrderCustomization) => ({
          ...customization,
          id: crypto.randomUUID(),
        })),
      })
      return
    }

    if (!editing && selectedTemplate) {
      setValue('product_name', selectedTemplate.name, { shouldValidate: true })
      setValue('sale_price', selectedTemplate.suggested_price)
      setValue('customizations', buildCustomizations(selectedTemplate.fields))
      return
    }
  }, [currentOrder, duplicateSource, editing, reset, selectedTemplate, setValue])

  const onSubmit = async (data: OrderFormValues) => {
    setLoading(true)

    try {
      const payload = {
        channel: data.channel,
        contact_handle: data.contact_handle,
        product_name: data.product_name,
        description: data.description,
        customization_summary: data.customization_summary,
        customizations: data.customizations,
        template_id: data.template_id ?? null,
        status: data.status,
        priority: data.priority,
        sale_price: data.sale_price,
        deposit_amount: data.deposit_amount,
        final_payment_method: data.final_payment_method ?? null,
        due_date: data.due_date || null,
        notified: data.notified,
      }

      if (editing && id) {
        await updateOrder.mutateAsync({ id, ...payload })
      } else {
        await createOrder.mutateAsync(payload)
      }

      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-6 pt-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{editing ? 'Editar pedido' : 'Carga rápida'}</p>
        <h2 className="text-2xl font-semibold">{editing ? 'Ajustá sin perder tiempo' : 'Nuevo pedido operativo'}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!editing && (
          <div className="grid grid-cols-3 gap-2">
            {formModes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setValue('mode', item.value)}
                className={[
                  'rounded-3xl border p-3 text-left transition-colors',
                  mode === item.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
                ].join(' ')}
              >
                <item.icon className="mb-2 h-4 w-4" />
                <p className="text-sm font-medium">{item.label}</p>
              </button>
            ))}
          </div>
        )}

        {(mode === 'template' || editing) && (
          <Card className="rounded-3xl">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2">
                <Label>Plantilla</Label>
                <Controller
                  control={control}
                  name="template_id"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Elegir plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin plantilla</SelectItem>
                        {templates.map((template: Template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {selectedTemplate && (
                <div className="rounded-2xl bg-muted/60 p-3 text-sm">
                  <p className="font-medium">Precio sugerido: {formatCurrency(selectedTemplate.suggested_price)}</p>
                  {selectedTemplate.description && <p className="mt-1 text-muted-foreground">{selectedTemplate.description}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!editing && mode === 'duplicate' && (
          <Card className="rounded-3xl">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2">
                <Label>Duplicar desde</Label>
                <Controller
                  control={control}
                  name="duplicate_order_id"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(value) => navigate(value === 'none' ? '/new-order' : `/new-order?duplicate=${value}`)}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Elegir pedido" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Elegir después</SelectItem>
                        {allOrders.map((order: Order) => (
                          <SelectItem key={order.id} value={order.id}>
                            #{order.order_number} - {order.product_name} - {order.contact_handle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {duplicateSource && (
                <div className="rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  Se copia producto, personalización y precio. Estado y seña se reinician.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Controller
                  control={control}
                  name="channel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORDER_CHANNELS).map(([key, item]) => (
                          <SelectItem key={key} value={key}>{item.label}</SelectItem>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_handle">Usuario / contacto</Label>
              <Input id="contact_handle" className="h-11 rounded-2xl" placeholder="@cliente, nombre o WhatsApp" {...register('contact_handle')} />
              {errors.contact_handle && <p className="text-xs text-destructive">{errors.contact_handle.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Producto</Label>
              <Input id="product_name" className="h-11 rounded-2xl" placeholder="Caja mundial, mate, soporte..." {...register('product_name')} />
              {errors.product_name && <p className="text-xs text-destructive">{errors.product_name.message}</p>}
            </div>

            <TemplateFieldsEditor
              template={selectedTemplate}
              customizations={watch('customizations')}
              onChange={(customizations) => {
                setValue('customizations', customizations)
                setValue('customization_summary', summarizeCustomizations(customizations))
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="customization_summary">Resumen rápido</Label>
              <Input id="customization_summary" className="h-11 rounded-2xl" placeholder="Color, variante, nombre..." {...register('customization_summary')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notas</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Detalle adicional, retiro, observaciones..."
                className="min-h-24 w-full rounded-2xl border bg-transparent px-3 py-2 text-sm outline-none ring-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio de venta</Label>
                <Input id="sale_price" type="number" className="h-11 rounded-2xl" {...register('sale_price', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Seña</Label>
                <Input id="deposit_amount" type="number" className="h-11 rounded-2xl" {...register('deposit_amount', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="rounded-2xl bg-muted/60 p-3 text-sm">
              <p className="text-muted-foreground">Saldo pendiente</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(balance)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div className="space-y-2">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORDER_STATUS).map(([key, item]) => (
                          <SelectItem key={key} value={key}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pago final</Label>
              <Controller
                control={control}
                name="final_payment_method"
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Sin registrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin registrar</SelectItem>
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" className="h-12 rounded-2xl" disabled={loading}>
            {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar pedido'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function buildCustomizations(fields: TemplateField[]): OrderCustomization[] {
  return fields.map((field, index) => ({
    id: crypto.randomUUID(),
    field_name: field.name,
    field_type: field.type,
    value_text: field.type === 'boolean' ? 'false' : '',
    value_json: null,
    sort_order: index,
  }))
}

function summarizeCustomizations(customizations: OrderCustomization[]) {
  return customizations
    .map((customization) => customization.value_text ? `${customization.field_name}: ${customization.value_text}` : null)
    .filter(Boolean)
    .join(' · ')
}

function TemplateFieldsEditor({
  template,
  customizations,
  onChange,
}: {
  template: Template | null
  customizations: OrderCustomization[]
  onChange: (customizations: OrderCustomization[]) => void
}) {
  if (!template || template.fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 rounded-2xl bg-muted/50 p-3">
      <div>
        <p className="font-medium">Campos de plantilla</p>
        <p className="text-sm text-muted-foreground">Se completan rapido y alimentan el resumen.</p>
      </div>

      {template.fields.map((field, index) => {
        const current = customizations[index] ?? {
          id: field.id,
          field_name: field.name,
          field_type: field.type,
          value_text: '',
          value_json: null,
          sort_order: index,
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.name}</Label>
            {field.type === 'select' || field.type === 'color' ? (
              <Select
                value={current?.value_text ?? ''}
                onValueChange={(value) => onChange(updateCustomization(customizations, index, value))}
              >
                <SelectTrigger className="h-11 rounded-2xl bg-background">
                  <SelectValue placeholder={`Elegir ${field.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'boolean' ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={current?.value_text === 'true' ? 'default' : 'outline'}
                  className="rounded-2xl"
                  onClick={() => onChange(updateCustomization(customizations, index, 'true'))}
                >
                  Sí
                </Button>
                <Button
                  type="button"
                  variant={current?.value_text === 'false' ? 'default' : 'outline'}
                  className="rounded-2xl"
                  onClick={() => onChange(updateCustomization(customizations, index, 'false'))}
                >
                  No
                </Button>
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={current?.value_text ?? ''}
                onChange={(event) => onChange(updateCustomization(customizations, index, event.target.value))}
                className="min-h-20 w-full rounded-2xl border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <Input
                value={current?.value_text ?? ''}
                onChange={(event) => onChange(updateCustomization(customizations, index, event.target.value))}
                className="h-11 rounded-2xl bg-background"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function updateCustomization(customizations: OrderCustomization[], index: number, value: string) {
  return customizations.map((item, itemIndex) => {
    if (itemIndex !== index) return item
    return { ...item, value_text: value }
  })
}
