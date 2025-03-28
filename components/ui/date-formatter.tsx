"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";

interface DateDisplayProps {
  date: string | Date;
  showIcon?: boolean;
  className?: string;
}

export function DateDisplay({
  date,
  showIcon = true,
  className = "",
}: DateDisplayProps) {
  const dateObj = new Date(date);
  const isPast = dateObj < new Date();
  const formattedDate = format(dateObj, "MMM d, yyyy");

  return (
    <span
      className={`flex items-center ${
        isPast ? "text-red-500" : ""
      } ${className}`}
    >
      {showIcon && <Calendar className="mr-2 h-4 w-4" />}
      {formattedDate}
      {isPast && <span className="ml-2 text-xs">(Expired)</span>}
    </span>
  );
}
