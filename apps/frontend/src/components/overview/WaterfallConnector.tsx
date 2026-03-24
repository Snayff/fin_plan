interface WaterfallConnectorProps {
  text: string;
  className?: string;
}

export function WaterfallConnector({ text, className }: WaterfallConnectorProps) {
  return (
    <div className={`flex items-center gap-2.5 py-2 px-3 ${className ?? ""}`}>
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10.5px] font-numeric font-medium text-muted-foreground tracking-wide whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}
