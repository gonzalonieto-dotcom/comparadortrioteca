import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="inline-flex items-center">
        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="max-w-xs text-xs p-3 w-auto">
      {text}
    </PopoverContent>
  </Popover>
);
