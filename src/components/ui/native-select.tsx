import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NativeSelectOption {
  value: string
  label: string
}

interface NativeSelectProps {
  value?: string
  onChange?: (event: { target: { value: string; name?: string } }) => void
  options: NativeSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
}

export const NativeSelect = React.forwardRef<HTMLButtonElement, NativeSelectProps>(
  ({ className, options, placeholder, value, onChange, disabled, name, ...props }, ref) => {
    const handleValueChange = (val: string) => {
      if (onChange) {
        const finalValue = val === "placeholder-empty-value" ? "" : val
        onChange({ target: { value: finalValue, name } })
      }
    }

    const activeValue = (value === "" || value === undefined || value === null) 
      ? (placeholder ? "placeholder-empty-value" : "") 
      : value

    return (
      <SelectPrimitive.Root
        value={activeValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex h-11 w-full items-center justify-between whitespace-nowrap rounded-[1.35rem] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition-all hover:border-primary/25 focus:border-primary/35 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 text-left',
            className
          )}
          {...props}
        >
          <SelectPrimitive.Value placeholder={placeholder || "Seleccionar..."} />
          <SelectPrimitive.Icon asChild>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-all">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-[1.4rem] border border-border bg-card text-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <SelectPrimitive.Viewport className="p-1.5">
              {placeholder && (
                <SelectPrimitive.Item
                  value="placeholder-empty-value"
                  className="relative flex w-full cursor-default select-none items-center rounded-xl py-2 px-3 text-sm text-muted-foreground outline-none focus:bg-muted focus:text-foreground"
                >
                  <SelectPrimitive.ItemText>{placeholder}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              )}
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex w-full cursor-default select-none items-center rounded-xl py-2.5 pl-3 pr-8 text-sm font-medium outline-none focus:bg-muted focus:text-foreground data-[state=checked]:text-primary"
                >
                  <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  }
)

NativeSelect.displayName = 'NativeSelect'
