import { useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Sparkles, Star, Trash2 } from 'lucide-react'
import { useCreateTemplate, useTemplates } from '@/hooks/use-templates'
import { templateFormSchema, type TemplateFormValues } from '@/lib/validations'
import type { Template } from '@/types'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TemplateList() {
  const { data: templates = [], isLoading } = useTemplates()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return templates.filter((template: Template) =>
      [template.name, template.description].join(' ').toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [search, templates])

  const favorites = filtered.filter((template: Template) => template.is_favorite)
  const others = filtered.filter((template: Template) => !template.is_favorite)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-6 pt-4">
      <section className="flex items-start justify-between gap-3 rounded-3xl border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Catálogo reutilizable</p>
          <h2 className="text-xl font-semibold">Plantillas livianas para acelerar carga</h2>
        </div>

        <TemplateDialog />
      </section>

      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar plantilla o idea viral" className="h-11 rounded-2xl" />

      {isLoading && (
        <Card className="rounded-3xl">
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando plantillas...</CardContent>
        </Card>
      )}

      {!isLoading && favorites.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Favoritas
          </div>
          {favorites.map((template: Template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </section>
      )}

      <section className="space-y-3">
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
          {template.fields.map((field: Template['fields'][number]) => (
            <span key={field.id} className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
              {field.name}
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
  const { control, handleSubmit, register, reset } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      suggested_price: 0,
      fields: [
        { id: crypto.randomUUID(), name: 'Color', type: 'color', required: false, options: ['Blanco', 'Negro'] },
      ],
      is_favorite: false,
      is_active: true,
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'fields' })

  const onSubmit = async (values: TemplateFormValues) => {
    await createTemplate.mutateAsync(values)
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
          <DialogDescription>Dejala simple: nombre, sugerencia de precio y campos utiles.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="suggested_price">Precio sugerido</Label>
              <Input id="suggested_price" type="number" {...register('suggested_price', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Favorita</Label>
              <Controller
                control={control}
                name="is_favorite"
                render={({ field }) => (
                  <Select value={field.value ? 'si' : 'no'} onValueChange={(value) => field.onChange(value === 'si')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Campos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: crypto.randomUUID(), name: '', type: 'text', required: false, options: [] })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Campo
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="rounded-2xl">
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input placeholder="Nombre del campo" {...register(`fields.${index}.name`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      control={control}
                      name={`fields.${index}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="select">Opciones</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                            <SelectItem value="textarea">Notas</SelectItem>
                            <SelectItem value="boolean">Sí / No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <Input placeholder="Opciones separadas por coma" {...register(`fields.${index}.options`, {
                      setValueAs: (value) => typeof value === 'string'
                        ? value.split(',').map((item) => item.trim()).filter(Boolean)
                        : value,
                    })} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTemplate.isPending}>Guardar plantilla</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
