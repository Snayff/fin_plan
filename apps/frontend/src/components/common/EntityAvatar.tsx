import { getInitials, getAvatarColor, getLogoUrl } from "@/utils/avatar";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-12 w-12 text-sm",
} as const;

interface EntityAvatarProps {
  name: string;
  /** Direct image URL (user-uploaded) — takes priority over logoKey */
  imageUrl?: string;
  /** Key into the curated logo library (e.g. "monzo") */
  logoKey?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function EntityAvatar({
  name,
  imageUrl,
  logoKey,
  size = "md",
  className,
}: EntityAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const base = cn(
    "rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold",
    sizeClass,
    className
  );

  const resolvedUrl = imageUrl ?? (logoKey ? getLogoUrl(logoKey) : undefined);

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt={name} className={cn(base, "object-cover")} />;
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
