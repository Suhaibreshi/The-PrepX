import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSafeErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  const errorObj = error as { message?: string; code?: string; details?: string };
  const errorMessage = errorObj.message || String(error);
  
  if (!errorMessage || errorMessage === 'null' || errorMessage === 'undefined') {
    return 'An unknown error occurred';
  }
  
  // Return validation errors directly (these are user-friendly)
  if (errorMessage.includes('is required') || errorMessage.includes('must be')) {
    return errorMessage;
  }
  
  if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
    return 'You do not have permission to perform this action';
  }
  
  if (errorMessage.includes('authentication') || errorMessage.includes('JWT')) {
    return 'Session expired. Please log in again';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection';
  }
  
  if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
    return 'This record already exists';
  }
  
  if (errorMessage.includes('violates check constraint') || errorMessage.includes('check constraint')) {
    return 'Invalid data provided. Please check your input';
  }
  
  // For other errors, return the message if it's short enough
  if (errorMessage.length <= 100) {
    return errorMessage;
  }
  
  return 'An error occurred. Please try again';
}
