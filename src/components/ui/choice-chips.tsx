import { cn } from '@/lib/utils'

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Array<{ value: T; label: string; tone?: string }>
  value: T | null
  onChange: (value: T) => void
  columns?: 1 | 2 | 3 | 4
}) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns]

  return (
    <div className={cn('grid gap-2', gridColumns)}>
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'cursor-pointer rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-all',
              active
                ? option.tone ?? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-foreground hover:border-primary/20 hover:bg-accent'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
