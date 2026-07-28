import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E0E0E0] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#111827] text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-[#1F2937] border border-[#111827]",
        destructive:
          "bg-rose-600 text-white shadow-2xs hover:bg-rose-700",
        outline:
          "border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#F4F5F7] hover:text-[#111827]",
        secondary:
          "bg-[#F4F5F7] text-[#111827] hover:bg-[#E5E7EB] border border-[#E5E7EB]",
        ghost: "text-[#6B7280] hover:bg-[#F4F5F7] hover:text-[#111827]",
        link: "text-[#111827] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-lg px-3 text-xs font-medium",
        lg: "h-12 rounded-xl px-6 text-sm font-semibold",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
