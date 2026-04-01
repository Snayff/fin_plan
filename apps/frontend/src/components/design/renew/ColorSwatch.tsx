interface ColorSwatchProps {
  name: string;
  cssVar: string;
  tailwindClass: string;
  hex: string;
  description?: string;
}

export function ColorSwatch({ name, cssVar, tailwindClass, hex, description }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-12 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(${cssVar}))` }}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{tailwindClass}</p>
        <p className="text-xs text-muted-foreground font-mono">{hex}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
