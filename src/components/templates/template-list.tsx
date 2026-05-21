import { useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Sparkles, Star, Trash2 } from 'lucide-react'
import { useCreateTemplate, useTemplates } from '@/hooks/use-templates'
import { templateFormSchema, type TemplateFormValues } from '@/lib/validations'
import type { Template, TemplateField, TemplateFieldType } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { WorkspaceShell } from '@/components/layout/workspace-shell'

const commonColorOptions = ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Rosa', 'Violeta', 'Pintado']

const fieldTypeOptions: Array<{ value: TemplateFieldType; label: string }> = [
  { value: 'text', label: 'Texto corto' },
  { value: 'select', label: 'Lista de opciones' },
  { value: 'color', label: 'Colores' },
  { value: 'textarea', label: 'Texto largo / notas' },
  { value: 'boolean', label: 'Si / no' },
]

const templateFieldPresets: Array<{ label: string; description: string; create: () => TemplateField }> = [
  {
    label: 'Colores',
    description: 'Uno o varios colores del producto',
    create: () => ({ id: crypto.randomUUID(), name: 'Colores', type: 'color', required: false, options: commonColorOptions }),
  },
  {
    label: 'Nombre',
    description: 'Nombre personalizado del cliente',
    create: () => ({ id: crypto.randomUUID(), name: 'Nombre', type: 'text', required: false, options: [] }),
  },
  {
    label: 'Frase',
    description: 'Texto breve personalizado',
    create: () => ({ id: crypto.randomUUID(), name: 'Frase', type: 'text', required: false, options: [] }),
  },
  {
    label: 'Logo',
    description: 'Logo, escudo o diseño a replicar',
    create: () => ({ id: crypto.randomUUID(), name: 'Logo personalizado', type: 'text', required: false, options: [] }),
  },
  {
    label: 'Variante',
    description: 'Versiones del mismo producto',
    create: () => ({ id: crypto.randomUUID(), name: 'Variante', type: 'select', required: false, options: ['Opcion 1', 'Opcion 2'] }),
  },
  {
    label: 'Pintado',
    description: 'Marca si lleva trabajo de pintura',
    create: () => ({ id: crypto.randomUUID(), name: 'Pintado', type: 'boolean', required: false, options: [] }),
  },
  {
    label: 'Notas',
    description: 'Observaciones puntuales del producto',
    create: () => ({ id: crypto.randomUUID(), name: 'Notas del producto', type: 'textarea', required: false, options: [] }),
  },
]

function createEmptyTemplateField(): TemplateField {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'text',
    required: false,
    options: [],
  }
}

function getDefaultTemplateValues(): TemplateFormValues {
  return {
    name: '',
    description: '',
    suggested_price: 0,
    fields: [templateFieldPresets[0].create()],
    is_favorite: false,
    is_active: true,
  }
}

function sanitizeTemplateFields(fields: TemplateField[]) {
  return fields.map((field) => ({
    ...field,
    name: field.name.trim(),
    options: field.type === 'select' || field.type === 'color'
      ? field.options.map((option) => option.trim()).filter(Boolean)
      : [],
  }))
}

function fieldTypeLabel(type: TemplateFieldType) {
  return fieldTypeOptions.find((option) => option.value === type)?.label ?? type
}

export function TemplateList() {
  const { data: templates = [], isLoading } = useTemplates()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return templates.filter((template: Template) => [template.name, template.description].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
  }, [search, templates])

  const favorites = filtered.filter((template: Template) => template.is_favorite)
  const others = filtered.filter((template: Template) => !template.is_favorite)

  return (
    <WorkspaceShell
      eyebrow="Catálogo reutilizable"
      title="Plantillas dinámicas"
      description="Favoritos, campos simples y sugerencias de precio para acelerar la carga sin rigidizar el catálogo."
      tone="templates"
      actions={<TemplateDialog />}
      className="max-w-6xl"
    >
      <div className="space-y-4 w-full">
        <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-3 py-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar plantilla o idea viral" className="h-11 rounded-2xl" />
        </div>

        {isLoading && (
          <Card className="rounded-3xl">
            <CardContent className="p-6 text-sm text-muted-foreground">Cargando plantillas...</CardContent>
          </Card>
        )}

        {!isLoading && favorites.length > 0 && (
          <section className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-3 py-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Favoritas
            </div>
            {favorites.map((template: Template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </section>
        )}

        <section className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-3 py-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Todas
          </div>
          {others.map((template: Template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <Card className="rounded-3xl">
              <CardContent className="p-6 text-sm text-muted-foreground">Todavía no hay plantillas con ese filtro.</CardContent>
            </Card>
          )}
        </section>
      </div>
    </WorkspaceShell>
  )
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{template.name}</h3>
              {template.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
            </div>
            {template.description && <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>}
          </div>

          <div className="rounded-2xl bg-muted px-3 py-2 text-sm font-medium">
            {formatCurrency(template.suggested_price)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {template.fields.map((field) => (
            <span key={field.id} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
              {field.name} · {fieldTypeLabel(field.type)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TemplateDialog() {
  const createTemplate = useCreateTemplate()
  const [open, setOpen] = useState(false)
  const { control, handleSubmit, register, reset, watch } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema) as any,
    defaultValues: getDefaultTemplateValues(),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'fields', keyName: 'formKey' })

  const onSubmit = async (values: TemplateFormValues) => {
    await createTemplate.mutateAsync({
      ...values,
      fields: sanitizeTemplateFields(values.fields),
    })
    reset(getDefaultTemplateValues())
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      reset(getDefaultTemplateValues())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88svh] max-w-3xl overflow-y-auto rounded-[2rem] border border-border bg-card p-0 shadow-xl">
        <DialogHeader className="space-y-2 border-b border-border bg-card px-6 pb-4 pt-6 pr-14">
          <DialogTitle>Nueva plantilla</DialogTitle>
          <DialogDescription>
            Definí solo los campos que usa ese producto. Podés mezclar colores, nombre, frase, logo, variantes y notas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.8fr)]">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" className="h-11 rounded-2xl" placeholder="Mate futbolero, lapicero con logo, caja viral..." {...register('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggested_price">Precio sugerido</Label>
              <Input id="suggested_price" type="number" className="h-11 rounded-2xl" {...register('suggested_price', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.8fr)]">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" className="h-11 rounded-2xl" placeholder="Cuándo conviene usarla o qué producto resuelve" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label>Favorita</Label>
              <Controller
                control={control}
                name="is_favorite"
                render={({ field }) => (
                  <NativeSelect
                    value={field.value ? 'si' : 'no'}
                    onChange={(event) => field.onChange(event.target.value === 'si')}
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'si', label: 'Si' },
                    ]}
                  />
                )}
              />
            </div>
          </div>

          <section className="space-y-4 rounded-[1.75rem] border border-border bg-muted/35 p-4 shadow-sm">
            <div className="space-y-1">
              <Label>Campos de personalización</Label>
              <p className="text-sm text-muted-foreground">
                Agregá solo lo que ese producto necesita. Para colores ya queda preparado para uno o varios tonos dentro del pedido.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {templateFieldPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => append(preset.create())}
                  className="rounded-[1.35rem] border border-border bg-card p-3 text-left transition-colors hover:border-primary/25 hover:bg-muted"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Plus className="h-4 w-4 text-primary" />
                    {preset.label}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-start">
              <Button type="button" variant="secondary" className="rounded-full px-4" onClick={() => append(createEmptyTemplateField())}>
                <Plus className="mr-2 h-4 w-4" />
                Campo manual
              </Button>
            </div>

            {fields.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
                Todavía no agregaste campos. Empezá por un preset comun o armá uno manual.
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const currentType = watch(`fields.${index}.type`)
                const supportsOptions = currentType === 'select' || currentType === 'color'

                return (
                  <Card key={field.formKey} className="rounded-[1.4rem] border-border bg-card shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <input type="hidden" {...register(`fields.${index}.id`)} />

                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-sm font-medium">Campo</Label>
                          <Button type="button" variant="outline" className="rounded-full px-3 text-destructive hover:text-destructive" onClick={() => remove(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar campo
                          </Button>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <Label>Nombre del campo</Label>
                          <Input
                            className="h-11 rounded-2xl"
                            placeholder="Ej: Colores, Nombre, Frase, Logo personalizado"
                            {...register(`fields.${index}.name`)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Controller
                            control={control}
                            name={`fields.${index}.type`}
                            render={({ field }) => (
                              <NativeSelect
                                value={field.value}
                                onChange={(event) => field.onChange(event.target.value)}
                                options={fieldTypeOptions}
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Obligatorio</Label>
                          <Controller
                            control={control}
                            name={`fields.${index}.required`}
                            render={({ field }) => (
                              <NativeSelect
                                value={field.value ? 'si' : 'no'}
                                onChange={(event) => field.onChange(event.target.value === 'si')}
                                options={[
                                  { value: 'no', label: 'Opcional' },
                                  { value: 'si', label: 'Obligatorio' },
                                ]}
                              />
                            )}
                          />
                        </div>
                      </div>

                      {supportsOptions && (
                        <div className="space-y-2">
                          <Label>{currentType === 'color' ? 'Colores sugeridos' : 'Opciones visibles'}</Label>
                          <Controller
                            control={control}
                            name={`fields.${index}.options`}
                            render={({ field }) => (
                              <Input
                                className="h-11 rounded-2xl"
                                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                onChange={(event) => field.onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                                placeholder={currentType === 'color' ? 'Blanco, Negro, Rojo, Pintado' : 'Grande, Chico, Con tapa, Sin tapa'}
                              />
                            )}
                          />
                          <p className="text-xs text-muted-foreground">
                            {currentType === 'color'
                              ? 'En el pedido se podrán sumar varios colores y esta lista funciona como sugerencia rápida.'
                              : 'Separá cada variante por coma para que aparezca como lista.'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 rounded-2xl" disabled={createTemplate.isPending}>
              {createTemplate.isPending ? 'Guardando...' : 'Guardar plantilla'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
