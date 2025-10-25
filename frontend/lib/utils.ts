import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getGradeColor(grade: string): string {
  const gradeMap: Record<string, string> = {
    'A+': 'text-green-600',
    'A': 'text-green-500',
    'A-': 'text-green-400',
    'B+': 'text-blue-500',
    'B': 'text-blue-400',
    'B-': 'text-yellow-500',
    'C+': 'text-yellow-400',
    'C': 'text-orange-400',
    'C-': 'text-orange-500',
    'D': 'text-red-400',
    'F': 'text-red-600',
  };
  return gradeMap[grade] || 'text-gray-500';
}

export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}
