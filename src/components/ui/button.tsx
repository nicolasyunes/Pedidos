import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_12px_28px_-20px_hsl(var(--button-shadow))] hover:-translate-y-0.5 hover:bg-primary/96 hover:shadow-[0_16px_30px_-20px_hsl(var(--button-shadow))] active:translate-y-0',
        destructive: 'bg-destructive text-destructive-foreground shadow-[0_14px_28px_-22px_rgba(220,38,38,0.55)] hover:-translate-y-0.5 hover:bg-destructive/94 active:translate-y-0',
        outline: 'border border-black/10 bg-background text-foreground shadow-[0_10px_24px_-24px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-primary/6 hover:text-primary active:translate-y-0 dark:border-white/10',
        secondary: 'bg-secondary text-secondary-foreground shadow-[0_10px_24px_-24px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 hover:bg-secondary/92 active:translate-y-0',
        ghost: 'hover:bg-primary/8 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
