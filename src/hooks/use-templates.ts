import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Template } from '@/types'
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from '@/lib/data-store'

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

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      return updateTemplate(id, {
        name: updates.name ?? '',
        description: updates.description ?? '',
        suggested_price: updates.suggested_price ?? 0,
        fields: updates.fields ?? [],
        is_favorite: updates.is_favorite ?? false,
        is_active: updates.is_active ?? true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
