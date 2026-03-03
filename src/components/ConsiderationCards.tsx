import { Offer } from "@/data/mortgageData";
import { ThumbsUp } from "lucide-react";


interface ConsiderationCardsProps {
  offers: Offer[];
}

const ConsiderationCards = ({ offers }: ConsiderationCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {offers.map((o) => (
      <div key={o.id} className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-card-foreground text-sm">{o.bankName}</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <ThumbsUp className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">A favor</span>
          </div>
          <ul className="space-y-1">
            {o.advantages.slice(0, 3).map((v, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-snug">• {v}</li>
            ))}
          </ul>
        </div>
      </div>
    ))}
  </div>
);

export default ConsiderationCards;
