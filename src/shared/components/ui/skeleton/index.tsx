// src/shared/components/ui/skeleton/index.tsx
import * as React from "react";
import { cn } from "@/shared/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SkeletonCard({ className, ...props }: SkeletonCardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-md p-4", 
        className
      )}
      {...props}
    >
      <div className="flex flex-col md:flex-row items-center">
        <Skeleton className="w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-0 md:mr-4 rounded-full" />
        <div className="flex-1 w-full">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-4" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div 
      className={cn("w-full overflow-x-auto", className)}
      {...props}
    >
      <div className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Cabeçalho */}
        <div className="bg-gray-100 dark:bg-gray-700 flex">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`header-${i}`}
              className="h-10 flex-1 m-2 rounded-md"
            />
          ))}
        </div>
        
        {/* Linhas */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex border-t border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-8 flex-1 m-2 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 