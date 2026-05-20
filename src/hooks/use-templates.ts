import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Template } from '@/types'
import { createTemplate, listTemplates, updateTemplate } from '@/lib/data-store'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      const currentTemplate: Template = {
        id,
        name: updates.name ?? '',
        description: updates.description ?? '',
        suggested_price: updates.suggested_price ?? 0,
        fields: updates.fields ?? [],
        is_favorite: updates.is_favorite ?? false,
        is_active: updates.is_active ?? true,
        created_at: '',
        updated_at: '',
      }

      return updateTemplate(id, {
        name: currentTemplate.name,
        description: currentTemplate.description,
        suggested_price: currentTemplate.suggested_price,
        fields: currentTemplate.fields,
        is_favorite: currentTemplate.is_favorite,
        is_active: currentTemplate.is_active,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
