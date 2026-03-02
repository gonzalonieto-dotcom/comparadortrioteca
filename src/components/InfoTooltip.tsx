import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex items-center">
        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs">
      {text}
    </TooltipContent>
  </Tooltip>
);
