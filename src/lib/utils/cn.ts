import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes (shadcn/ui compatible helper). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
