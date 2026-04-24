import { ComputedOffer } from "@/lib/mortgageCalc";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp } from "lucide-react";

interface CostBreakdownProps {
  computedOffers: ComputedOffer[];
  inflationRate?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const CostBreakdown = ({ computedOffers, inflationRate }: CostBreakdownProps) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalCost - b.totalCost);
  const inf = (inflationRate ?? 0) / 100;
  const showInflation = inf > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sorted.map((co, i) => {
        const hasPeriods = co.periodBreakdown.length > 0;
        const termYears = co.offer.termYears ?? 30;
        const termMonths = termYears * 12;
        const activeInflatedLinkages = co.offer.linkages.filter(
          (l) =>
            l.isActive &&
            l.annualCostEUR > 0 &&
            !l.label.toLowerCase().includes("1er año") &&
            !l.label.toLowerCase().includes("primer año")
        );
        // Pick milestone years (1, 10, 20, term) capped to term length, deduped & sorted
        const milestoneYears = Array.from(
          new Set([1, 10, 20, termYears].filter((y) => y <= termYears))
        ).sort((a, b) => a - b);

        return (
          <div
            key={co.offer.id}
            className={`bg-card rounded-xl border p-5 ${i === 0 ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-card-foreground text-sm">{co.offer.bankName}</span>
              {i === 0 && <span className="ml-auto text-xs font-medium text-accent">Menor coste</span>}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intereses totales</span>
                <span className="font-medium text-card-foreground">{fmt(co.totalInterest)}</span>
              </div>

              {/* Period breakdown for mixed offers */}
              {hasPeriods && co.periodBreakdown.map((pb, pi) => (
                <div key={pi} className="flex justify-between text-xs pl-3 border-l-2 border-muted">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    {pb.label}
                    {pb.isVariable && <Badge variant="outline" className="text-[9px] py-0 px-1">Variable</Badge>}
                  </span>
                  <span className="text-card-foreground">{fmt(pb.totalInterest)}</span>
                </div>
              ))}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Bonificaciones ({co.offer.linkages.filter(l => l.isActive).length} activas)
                  {showInflation && (
                    <span className="text-[10px] block text-muted-foreground/70">
                      con inflación {inflationRate}%
                    </span>
                  )}
                </span>
                <span className="font-medium text-card-foreground">{fmt(co.totalLinkageCost)}</span>
              </div>

              {/* Inflation evolution mini-table */}
              {showInflation && activeInflatedLinkages.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-[11px] text-primary hover:underline py-1"
                    >
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Ver evolución por inflación
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="bg-muted/40 rounded-md p-2 text-[10px] overflow-x-auto">
                      <p className="text-muted-foreground mb-2 leading-snug">
                        Cada año, el coste anual sube un {inflationRate?.toFixed(1)}% por inflación.
                      </p>
                      <table className="w-full">
                        <thead>
                          <tr className="text-muted-foreground border-b">
                            <th className="text-left font-normal py-1 pr-2">Concepto</th>
                            {milestoneYears.map((y) => (
                              <th key={y} className="text-right font-normal py-1 pl-1">
                                Año {y}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeInflatedLinkages.map((l, li) => (
                            <tr key={li} className="border-b border-muted/60 last:border-0">
                              <td className="py-1 pr-2 text-card-foreground truncate max-w-[80px]">
                                {l.label}
                              </td>
                              {milestoneYears.map((y) => (
                                <td key={y} className="text-right py-1 pl-1 text-card-foreground tabular-nums">
                                  {fmt(l.annualCostEUR * Math.pow(1 + inf, y - 1))}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td className="py-1 pr-2 text-muted-foreground">Acum.</td>
                            {milestoneYears.map((y) => {
                              let acum = 0;
                              for (let k = 0; k < y; k++) {
                                acum += activeInflatedLinkages.reduce(
                                  (s, l) => s + l.annualCostEUR * Math.pow(1 + inf, k),
                                  0
                                );
                              }
                              return (
                                <td
                                  key={y}
                                  className="text-right py-1 pl-1 text-card-foreground tabular-nums"
                                >
                                  {fmt(acum)}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Otros costes</span>
                <span className="font-medium text-card-foreground">{fmt(co.offer.upfrontCostsEUR + co.offer.monthlyAccountCostEUR * termMonths)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-medium text-card-foreground">Coste total aprox.</span>
                <span className="text-lg font-bold text-card-foreground">{fmt(co.totalCost)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CostBreakdown;
