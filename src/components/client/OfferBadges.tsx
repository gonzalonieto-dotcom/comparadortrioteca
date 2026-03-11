import { ComputedOffer } from "@/lib/mortgageCalc";
import { Badge } from "@/components/ui/badge";

/**
 * Returns interpretive badges for each offer based on comparison with others.
 * Pure front-end logic — no backend scoring.
 */
export function getOfferBadges(
  co: ComputedOffer,
  allOffers: ComputedOffer[],
  recommendedId?: string
): { label: string; variant: "default" | "secondary" | "outline" }[] {
  const badges: { label: string; variant: "default" | "secondary" | "outline" }[] = [];
  const sorted = [...allOffers].sort((a, b) => a.totalCost - b.totalCost);

  if (co.offer.id === recommendedId) {
    badges.push({ label: "Mejor para avanzar", variant: "default" });
    return badges; // Don't clutter the recommended one
  }

  // Second best = good alternative
  if (sorted[1] && co.offer.id === sorted[1].offer.id) {
    badges.push({ label: "Buena alternativa", variant: "secondary" });
  }

  // Fewest linkages
  const minLinkages = Math.min(...allOffers.map((o) => o.offer.linkages.filter((l) => l.isActive).length));
  const activeLinkages = co.offer.linkages.filter((l) => l.isActive).length;
  if (activeLinkages === minLinkages && activeLinkages <= 2 && co.offer.id !== recommendedId) {
    badges.push({ label: "Menor vinculación", variant: "outline" });
  }

  // Conservative option (highest TIN but stable)
  if (co.offer.type === "Fijo" && sorted.length > 2 && co.offer.id === sorted[sorted.length - 1].offer.id) {
    badges.push({ label: "Opción conservadora", variant: "outline" });
  }

  // If no badges yet, give a generic one
  if (badges.length === 0) {
    badges.push({ label: "Opción para comparar", variant: "outline" });
  }

  return badges;
}

interface OfferBadgesInlineProps {
  co: ComputedOffer;
  allOffers: ComputedOffer[];
  recommendedId?: string;
}

export const OfferBadgesInline = ({ co, allOffers, recommendedId }: OfferBadgesInlineProps) => {
  const badges = getOfferBadges(co, allOffers, recommendedId);
  
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b, i) => (
        <Badge key={i} variant={b.variant} className="text-[10px] font-medium">
          {b.label}
        </Badge>
      ))}
    </div>
  );
};
