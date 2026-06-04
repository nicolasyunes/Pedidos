import { cn } from '@/lib/utils'
import { hasSupabaseConfig } from '@/lib/supabase/client'

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  tone = 'default',
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'orders' | 'new' | 'templates' | 'history'
}) {
  const toneStyles = {
    default: 'bg-card border-border',
    orders: 'bg-card border-sky-200 dark:border-sky-900',
    new: 'bg-card border-violet-200 dark:border-violet-900',
    templates: 'bg-card border-amber-200 dark:border-amber-900',
    history: 'bg-card border-emerald-200 dark:border-emerald-900',
  } as const

  return (
    <div className={cn('mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-6 pt-4 md:px-6 xl:px-8', className)}>
      <section className={cn(
        'flex flex-col gap-3 rounded-[24px] border p-4 sm:flex-row sm:items-center sm:justify-between',
        toneStyles[tone]
      )}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>}
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none',
              hasSupabaseConfig ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            )}>
              {hasSupabaseConfig ? '☁️ Cloud' : '💻 Local'}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          {description && <p className="max-w-xl text-sm text-muted-foreground">{description}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </section>

      {children}
    </div>
  )
}
