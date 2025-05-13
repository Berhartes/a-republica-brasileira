import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utilitário para mesclar classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}