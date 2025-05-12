"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function ChatSkeletonLoader() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 4 }).map((_, i) => {
        const isUser = i % 2 === 0
        return (
          <div
            key={i}
            className={cn(
              "max-w-[70%] p-3 rounded-xl",
              isUser ? "bg-primary text-white self-end" : "bg-muted text-black self-start"
            )}
          >
            <Skeleton className="h-4 w-[90%] mb-2" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        )
      })}
    </div>
  )
}
