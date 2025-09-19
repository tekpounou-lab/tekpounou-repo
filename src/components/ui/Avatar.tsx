// src/components/ui/Avatar.tsx
import React from "react";
import { cn } from "@/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className, ...props }) => {
  return (
    <div
      className={cn("h-10 w-10 rounded-full overflow-hidden bg-gray-200", className)}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-gray-500">
          ?
        </span>
      )}
    </div>
  );
};
