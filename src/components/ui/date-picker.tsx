import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants, Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export function DatePicker({ value, onChange, placeholder = 'Elegir fecha' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = value ? parseISO(value) : null
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? new Date())

  const days = useMemo(() => {
    const start = startOfMonth(visibleMonth)
    const end = endOfMonth(visibleMonth)
    const startOffset = getDay(start)

    return {
      monthLabel: format(visibleMonth, 'MMMM yyyy', { locale: es }),
      leadingBlanks: Array.from({ length: startOffset }),
      days: eachDayOfInterval({ start, end }),
    }
  }, [visibleMonth])

  const label = selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : placeholder

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-11 w-full justify-between rounded-2xl px-3 font-normal'
        )}
      >
        <span className={cn(!selectedDate && 'text-muted-foreground')}>{label}</span>
        <CalendarDays className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl p-4">
        <DialogHeader className="pr-8">
          <DialogTitle>Fecha de entrega</DialogTitle>
          <DialogDescription>Hoy queda marcado y podés tocar el día directo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon" onClick={() => setVisibleMonth((current) => subMonths(current, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium capitalize">{days.monthLabel}</p>
            <Button type="button" variant="ghost" size="icon" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekDays.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
            {days.leadingBlanks.map((_, index) => (
              <div key={`blank-${index}`} />
            ))}
            {days.days.map((day) => {
              const isoValue = format(day, 'yyyy-MM-dd')
              const selected = selectedDate ? isSameDay(day, selectedDate) : false
              const today = isToday(day)

              return (
                <button
                  key={isoValue}
                  type="button"
                  onClick={() => {
                    onChange(isoValue)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-2xl text-sm transition-colors',
                    selected && 'bg-primary text-primary-foreground',
                    !selected && 'hover:bg-accent',
                    today && !selected && 'ring-1 ring-primary'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setVisibleMonth(new Date())}>
              Ir a hoy
            </Button>
            <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => onChange('')}>
              Limpiar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
