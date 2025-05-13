// src/shared/components/ui/switch/index.tsx
import * as React from "react"
import { cn } from "@/shared/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full", className)}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            "absolute inset-0 rounded-full transition",
            checked ? "bg-primary" : "bg-input"
          )}
        />
        <span
          className={cn(
            "absolute inset-y-0 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-background transition-all",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
