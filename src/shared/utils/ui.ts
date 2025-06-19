import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitário para mesclar classes Tailwind, resolvendo conflitos
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
