import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronRight, CopyPlus, Plus, Sparkles, Wand2, X } from 'lucide-react'
import { useCreateOrder, useOrder, useOrders, useUpdateOrder } from '@/hooks/use-orders'
import { useTemplates } from '@/hooks/use-templates'
import { ORDER_CHANNELS, ORDER_STATUS, PAYMENT_METHODS } from '@/lib/constants'
import { orderFormSchema, type OrderFormValues } from '@/lib/validations'
import type { Order, OrderCustomization, Template, TemplateField } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { WorkspaceShell } from '@/components/layout/workspace-shell'

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
  const [savedContact, setSavedContact] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  const duplicateSource = useMemo(
    () => allOrders.find((order: Order) => order.id === duplicateId) ?? null,
    [allOrders, duplicateId]
  )

  const { control, handleSubmit, register, watch, setValue, reset, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      mode: duplicateId ? 'duplicate' : 'template',
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

  const contactValue = watch('contact_handle')

  const contactSuggestions = useMemo(() => {
    if (!contactValue || editing) return []
    const trimmed = contactValue.toLowerCase().trim()
    const seen = new Set<string>()
    const all: { contact: string; channel: string; count: number }[] = []
    for (const order of allOrders) {
      const c = order.contact_handle?.trim()
      if (!c || seen.has(c)) continue
      if (c.toLowerCase().includes(trimmed)) {
        seen.add(c)
        all.push({ contact: c, channel: order.channel, count: 0 })
      }
    }
    return all.sort((a, b) => a.contact.localeCompare(b.contact)).slice(0, 8)
  }, [allOrders, contactValue, editing])

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
    }
  }, [currentOrder, duplicateSource, editing, reset, selectedTemplate, setValue])

  useEffect(() => {
    if (editing) return
    const contactParam = searchParams.get('contact')
    const channelParam = searchParams.get('channel')
    if (contactParam) {
      setValue('contact_handle', contactParam)
      if (channelParam && (Object.keys(ORDER_CHANNELS) as string[]).includes(channelParam)) {
        setValue('channel', channelParam as Order['channel'])
      }
    }
  }, [editing, searchParams, setValue])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectContact = (contact: string, channel: string) => {
    setValue('contact_handle', contact)
    setValue('channel', channel as Order['channel'])
    setShowSuggestions(false)
  }

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
        navigate('/')
      } else {
        await createOrder.mutateAsync(payload)
        setSavedContact(data.contact_handle)
        reset(undefined, { keepValues: false })
        setTimeout(() => setValue('contact_handle', data.contact_handle), 0)
        setValue('channel', data.channel)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkspaceShell
      eyebrow={editing ? 'Editar pedido' : 'Carga rápida'}
      title={editing ? 'Ajustá sin perder tiempo' : 'Nuevo pedido operativo'}
      description="Mismo entorno visual que pedidos para que no parezca otra app. En desktop, los datos clave quedan visibles sin tanto scroll."
      tone="new"
      className="max-w-7xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)] xl:items-start">
        <div className="space-y-4">
        {!editing && (
          <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 p-2">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de carga</p>
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
          </div>
        )}

        {(mode === 'template' || editing) && (
          <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plantilla base</p>
            <div className="space-y-2">
              <Label>Plantilla</Label>
              <Controller
                control={control}
                name="template_id"
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    placeholder="Sin plantilla"
                    options={templates.map((template: Template) => ({ value: template.id, label: template.name }))}
                  />
                )}
              />
            </div>

            {selectedTemplate && (
              <div className="rounded-2xl bg-violet-100/60 dark:bg-violet-900/30 p-3 text-sm">
                <p className="font-medium">Precio sugerido: {formatCurrency(selectedTemplate.suggested_price)}</p>
                {selectedTemplate.description && <p className="mt-1 text-muted-foreground">{selectedTemplate.description}</p>}
              </div>
            )}
          </div>
        )}

        {!editing && mode === 'duplicate' && (
          <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duplicar pedido</p>
            <div className="space-y-2">
              <Label>Duplicar desde</Label>
              <div className="grid gap-2">
                {allOrders.slice(0, 6).map((order: Order) => {
                  const active = duplicateId === order.id

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => navigate(`/new-order?duplicate=${order.id}`)}
                      className={cn(
                        'w-full rounded-2xl border px-3 py-3 text-left text-sm transition-colors',
                        active ? 'border-primary bg-primary/10' : 'bg-card hover:bg-accent'
                      )}
                    >
                      <p className="font-medium">#{order.order_number} · {order.product_name}</p>
                      <p className="text-xs text-muted-foreground">{order.contact_handle}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {duplicateSource && (
              <div className="rounded-2xl bg-violet-100/60 dark:bg-violet-900/30 p-3 text-sm text-muted-foreground">
                Se copia producto, personalización y precio. Estado y seña se reinician.
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Datos del cliente</p>
          <div className="space-y-2" ref={contactRef}>
            <Label htmlFor="contact_handle">Usuario / contacto</Label>
            <div className="relative">
              <Input id="contact_handle" className="h-11 rounded-2xl" placeholder="@cliente, nombre o WhatsApp" {...register('contact_handle')} onFocus={() => setShowSuggestions(true)} autoComplete="off" />
              {showSuggestions && contactSuggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  {contactSuggestions.map((s) => (
                    <button
                      key={s.contact}
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between"
                      onClick={() => selectContact(s.contact, s.channel)}
                    >
                      <span className="font-medium">{s.contact}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{s.channel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.contact_handle && <p className="text-xs text-destructive">{errors.contact_handle.message}</p>}
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Producto</Label>
              <Input id="product_name" className="h-11 rounded-2xl" placeholder="Caja mundial, mate, soporte..." {...register('product_name')} />
              {errors.product_name && <p className="text-xs text-destructive">{errors.product_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Controller
                  control={control}
                  name="channel"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      options={Object.entries(ORDER_CHANNELS).map(([key, item]) => ({ value: key, label: item.label }))}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'urgente', label: 'Urgente' },
                      ]}
                    />
                  )}
                />
              </div>
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
        </div>

        <div className="space-y-4 xl:sticky xl:top-32">
        <Card className="rounded-3xl border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Cierre rápido</p>
              <h3 className="mt-1 text-lg font-semibold">Precio, fecha y estado siempre a la vista</h3>
            </div>

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
                <Label htmlFor="due_date">Fecha entrega</Label>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <Input type="date" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} onClick={(e) => (e.target as HTMLInputElement)?.showPicker?.()} className="h-11 rounded-2xl" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      options={Object.entries(ORDER_STATUS).map(([key, item]) => ({ value: key, label: item.label }))}
                    />
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
                    <NativeSelect
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value || null)}
                      placeholder="Sin registrar"
                      options={Object.entries(PAYMENT_METHODS).map(([key, label]) => ({ value: key, label }))}
                    />
                  )}
                />
            </div>
          </CardContent>
        </Card>

        {savedContact && !editing && (
          <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">✅ Pedido guardado</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-8 text-xs shrink-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              onClick={() => {
                navigate(`/new-order?contact=${encodeURIComponent(savedContact)}&channel=${watch('channel')}`)
              }}
            >
              Otro para {savedContact}
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border-border/70 bg-background/90 text-foreground hover:border-foreground/10 hover:bg-muted/70"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-12 rounded-2xl shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20"
            disabled={loading}
          >
            {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar pedido'}
          </Button>
        </div>
        </div>
      </form>
    </WorkspaceShell>
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
    .map((customization) => {
      if (customization.field_type === 'boolean') {
        return customization.value_text === 'true'
          ? customization.field_name
          : customization.value_text === 'false'
            ? null
            : null
      }

      return customization.value_text?.trim() ? `${customization.field_name}: ${customization.value_text}` : null
    })
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
  if (!template || template.fields.length === 0) return null

  return (
    <div className="space-y-3 rounded-2xl bg-muted/50 p-3">
      <div>
        <p className="font-medium">Campos de plantilla</p>
        <p className="text-sm text-muted-foreground">Se completan rápido y alimentan el resumen.</p>
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

            {isCustomNameField(field) ? (
              <OptionalNameInput
                value={current.value_text ?? ''}
                onChange={(value) => onChange(updateCustomization(customizations, index, field, value))}
              />
            ) : field.type === 'color' ? (
              <ColorFieldEditor
                field={field}
                value={current.value_text ?? ''}
                valueJson={current.value_json}
                onChange={(value, valueJson) => onChange(updateCustomization(customizations, index, field, value, valueJson))}
              />
            ) : field.type === 'select' ? (
              <NativeSelect
                value={current.value_text ?? ''}
                onChange={(event) => onChange(updateCustomization(customizations, index, field, event.target.value))}
                placeholder={`Elegir ${field.name.toLowerCase()}`}
                options={field.options.map((option) => ({ value: option, label: option }))}
                className="bg-background"
              />
            ) : field.type === 'boolean' ? (
              <div className="flex gap-2">
                <Button type="button" variant={current.value_text === 'true' ? 'default' : 'outline'} className="rounded-2xl" onClick={() => onChange(updateCustomization(customizations, index, field, 'true'))}>
                  Sí
                </Button>
                <Button type="button" variant={current.value_text === 'false' ? 'default' : 'outline'} className="rounded-2xl" onClick={() => onChange(updateCustomization(customizations, index, field, 'false'))}>
                  No
                </Button>
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                value={current.value_text ?? ''}
                onChange={(event) => onChange(updateCustomization(customizations, index, field, event.target.value))}
                className="min-h-20 w-full rounded-2xl border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <Input
                value={current.value_text ?? ''}
                onChange={(event) => onChange(updateCustomization(customizations, index, field, event.target.value))}
                className="h-11 rounded-2xl bg-background"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OptionalNameInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [enabled, setEnabled] = useState(() => value.trim().length > 0)

  useEffect(() => {
    if (value.trim().length > 0) {
      setEnabled(true)
    }
  }, [value])

  const toggle = () => {
    if (enabled) {
      setEnabled(false)
      onChange('')
      return
    }

    setEnabled(true)
  }

  return (
    <div className="space-y-3 rounded-3xl border border-border/40 bg-card/50 p-4 shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all',
          enabled
            ? 'border-primary/25 bg-primary/5 shadow-sm'
            : 'border-border/60 bg-background/70 hover:border-primary/20 hover:bg-muted/60'
        )}
      >
        <div>
          <p className="text-sm font-medium text-foreground">Nombre personalizado</p>
          <p className="text-xs text-muted-foreground">Marcá esto para que el nombre quede reflejado en el resumen.</p>
        </div>
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
            enabled ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-transparent'
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </button>

      {enabled && (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Escribí el nombre personalizado"
          className="h-11 rounded-2xl bg-background"
        />
      )}
    </div>
  )
}

function ColorFieldEditor({
  field,
  value,
  valueJson,
  onChange,
}: {
  field: TemplateField
  value: string
  valueJson: unknown
  onChange: (value: string, valueJson: unknown) => void
}) {
  const palette = Array.from(new Set([...(field.options.length > 0 ? field.options : ['Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo']), 'Pintado']))
  const parsedParts = parseColorParts(value, valueJson)
  const currentParts = parsedParts.length === 0 ? [''] : parsedParts

  const commit = (nextParts: string[]) => {
    const trimmedParts = nextParts.map((part) => part.trim())
    const meaningfulParts = trimmedParts.filter(Boolean)
    const shouldPersistParts = trimmedParts.length > 1 || meaningfulParts.length > 0

    onChange(
      formatColorSummary(meaningfulParts),
      shouldPersistParts ? { parts: trimmedParts } : null,
    )
  }

  const updateAt = (index: number, nextValue: string) => {
    const nextParts = [...currentParts]
    nextParts[index] = nextValue
    commit(nextParts)
  }

  const addPart = () => {
    commit([...(currentParts.length === 1 && !currentParts[0] ? [''] : currentParts), ''])
  }

  const removePart = (index: number) => {
    commit(currentParts.filter((_, partIndex) => partIndex !== index))
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border/40 bg-card/50 p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">Paleta del producto</p>
        <p className="text-xs text-muted-foreground">Elegí un color principal y sumá uno o varios secundarios. También podés marcar pintado.</p>
      </div>

      {currentParts.map((part, index) => (
        <div key={`${field.id}-${index}`} className="space-y-3 rounded-[1.4rem] border border-border/50 bg-background/80 p-3.5 transition-all hover:border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              )}>
                {index === 0 ? 'Principal' : `Secundario ${index}`}
              </span>
            </div>
            {currentParts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-transparent text-muted-foreground hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => removePart(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {palette.map((colorOption) => {
              const isSelected = part === colorOption
              return (
                <button
                  key={`${field.id}-${index}-${colorOption}`}
                  type="button"
                  onClick={() => updateAt(index, colorOption)}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-primary/30 bg-primary/8 text-foreground shadow-sm ring-1 ring-primary/10'
                      : 'border-border/40 bg-muted/40 text-muted-foreground hover:border-primary/15 hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full border border-white/70 transition-transform',
                      isSelected && 'scale-110'
                    )}
                    style={{
                      background: getColorSwatch(colorOption),
                      boxShadow: isSelected ? '0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent)' : 'none',
                    }}
                  />
                  <span className="font-medium">{colorOption}</span>
                </button>
              )
            })}
          </div>

          <Input
            value={part}
            onChange={(event) => updateAt(index, event.target.value)}
            placeholder={index === 0 ? 'Color principal o acabado' : 'Color secundario o acabado'}
            className="h-11 rounded-2xl border-border/50 bg-background/70 focus:border-primary/30"
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-2xl border-dashed border-border/70 bg-background/80 text-muted-foreground transition-all hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
        onClick={addPart}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar color secundario
      </Button>
    </div>
  )
}

function isCustomNameField(field: TemplateField) {
  return field.type === 'text' && field.name.toLowerCase().includes('nombre')
}

function getColorSwatch(color: string) {
  const normalized = color.trim().toLowerCase()
  const colorMap: Record<string, string> = {
    blanco: '#f8fafc',
    negro: '#0f172a',
    rojo: '#dc2626',
    azul: '#2563eb',
    verde: '#16a34a',
    amarillo: '#eab308',
    gris: '#6b7280',
    celeste: '#38bdf8',
    naranja: '#f97316',
    violeta: '#8b5cf6',
    rosa: '#ec4899',
    dorado: '#ca8a04',
    plateado: '#94a3b8',
    marron: '#854d0e',
    beige: '#fef3c7',
    bordó: '#9f1239',
    lila: '#c084fc',
    turquesa: '#06b6d4',
    coral: '#fb7185',
    pintado: 'linear-gradient(135deg, #334155 0%, #e2e8f0 100%)',
  }

  return colorMap[normalized] ?? '#cbd5e1'
}

function parseColorParts(value: string, valueJson: unknown) {
  if (
    valueJson &&
    typeof valueJson === 'object' &&
    'parts' in valueJson &&
    Array.isArray((valueJson as { parts?: unknown }).parts)
  ) {
    return (valueJson as { parts: unknown[] }).parts.map((part) => (typeof part === 'string' ? part : ''))
  }

  const trimmed = value.trim()
  if (!trimmed) return []

  if (trimmed.includes(' + ')) {
    return trimmed.split(' + ').map((part) => part.trim()).filter(Boolean)
  }

  if (/principal/i.test(trimmed)) {
    const primaryMatch = trimmed.match(/Principal\s+([^·]+)/i)
    const secondaryMatch = trimmed.match(/Secundarios\s+(.+)$/i)
    return [
      primaryMatch?.[1]?.trim(),
      ...(secondaryMatch?.[1]?.split(',').map((part) => part.trim()) ?? []),
    ].filter(Boolean) as string[]
  }

  return [trimmed]
}

function formatColorSummary(parts: string[]) {
  if (parts.length === 0) return ''

  const [primary, ...secondary] = parts
  return [
    primary ? `Principal ${primary}` : null,
    secondary.length > 0 ? `Secundarios ${secondary.join(', ')}` : null,
  ].filter(Boolean).join(' · ')
}

function updateCustomization(customizations: OrderCustomization[], index: number, field: TemplateField, value: string, valueJson?: unknown) {
  const next = [...customizations]
  next[index] = {
    id: next[index]?.id ?? crypto.randomUUID(),
    field_name: field.name,
    field_type: field.type,
    value_text: value,
    value_json: valueJson === undefined ? next[index]?.value_json ?? null : valueJson,
    sort_order: index,
  }
  return next
}
