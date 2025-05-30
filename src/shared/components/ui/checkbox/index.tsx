// src/shared/components/ui/checkbox/index.tsx
import * as React from "react"
import { cn } from "@/shared/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border border-input bg-background text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
