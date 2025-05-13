// src/shared/components/ui/loading-spinner/index.tsx
import * as React from "react"
import { cn } from "@/shared/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

/**
 * Um spinner de carregamento animado com tamanhos configuráveis
 * @param props - Propriedades do componente
 * @param props.className - Classes CSS adicionais
 * @param props.size - Tamanho do spinner: "sm", "md" (padrão) ou "lg"
 */
export function LoadingSpinner({ 
  className, 
  size = "md", 
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <div
      role="status"
      className={cn(
        "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  )
}