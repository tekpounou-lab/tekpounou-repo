import * as React from "react"

export function Avatar({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full" {...props}>{children}</div>
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className="aspect-square h-full w-full" {...props} />
}

export function AvatarFallback({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className="flex h-full w-full items-center justify-center rounded-full bg-muted" {...props}>{children}</span>
}
