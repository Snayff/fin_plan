import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type Props = {
  text: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function InfoTip({ text, children, side = "top" }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-current">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-64">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
