// src/shared/components/ui/alert/index.tsx
import * as React from "react"
import { cn } from "@/shared/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning"
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  const variantClasses = {
    default: "bg-background text-foreground",
    destructive: "bg-destructive/15 text-destructive dark:border-destructive",
    warning: "bg-warning/15 text-warning-foreground dark:border-warning"
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}