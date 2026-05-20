import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, Calendar } from 'lucide-react'
import { useTemplates } from '@/hooks/use-templates'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function TemplateList() {
  const navigate = useNavigate()
  const { data: templates, isLoading } = useTemplates()
  const [search, setSearch] = useState('')

  if (isLoading) {
    return (
      <div className="flex h-[calc(100svh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const favorites = templates?.filter((t) => t.is_favorite) || []
  const seasonal = templates?.filter((t) => t.is_seasonal) || []
  const all = templates || []

  const filtered = (list: typeof templates) =>
    list?.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())) || []

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Plantillas</h2>
        <Button size="sm" onClick={() => navigate('/new-template')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      <div className="border-b px-4 py-2">
        <Input
          placeholder="Buscar plantilla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="flex-1 overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="all">Todas ({all.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos ({favorites.length})</TabsTrigger>
          <TabsTrigger value="seasonal">Estacionales ({seasonal.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered(all).map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
          {filtered(all).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay plantillas</p>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered(favorites).map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
          {filtered(favorites).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay favoritos</p>
          )}
        </TabsContent>

        <TabsContent value="seasonal" className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered(seasonal).map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
          {filtered(seasonal).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay estacionales</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplateCard({ template }: { template: { id: string; name: string; base_price: number; is_favorite: boolean; is_seasonal: boolean } }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {template.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
            {template.is_seasonal && <Calendar className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div>
            <p className="font-medium text-sm">{template.name}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(template.base_price)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
