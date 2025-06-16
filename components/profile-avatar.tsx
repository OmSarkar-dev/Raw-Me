import { cn } from "@/lib/utils"

interface ProfileAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProfileAvatar({ name, size = "md", className }: ProfileAvatarProps) {
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(" ")
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-20 w-20 text-2xl",
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
