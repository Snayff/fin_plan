import { getInitials, getAvatarColor } from "@/utils/avatar";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-12 w-12 text-sm",
} as const;

interface EntityAvatarProps {
  name: string;
  imageUrl?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function EntityAvatar({ name, imageUrl, size = "md", className }: EntityAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const base = cn(
    "rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold",
    sizeClass,
    className
  );

  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={cn(base, "object-cover")} />;
  }

  return (
    <div
      className={base}
      style={{ backgroundColor: getAvatarColor(name), color: "#fff" }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
