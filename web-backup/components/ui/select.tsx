"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children?: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  selectedLabel?: string
  setSelectedLabel?: (label: string) => void
}>({
  open: false,
  setOpen: () => {},
})

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState<string>()

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value, selectedLabel } = React.useContext(SelectContext)
  
  return (
    <span className="block truncate">
      {selectedLabel || value || placeholder || "Select..."}
    </span>
  )
}

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const { open, setOpen } = React.useContext(SelectContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SelectItem({ value, className, children, ...props }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  const isSelected = context.value === value

  const handleClick = () => {
    context.onValueChange?.(value)
    context.setSelectedLabel?.(children?.toString() || value)
    context.setOpen(false)
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}