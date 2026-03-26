import { ComputedOffer } from "@/lib/mortgageCalc";
import { Offer, operationDefaults } from "@/data/mortgageData";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info, Star, ArrowRight, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Switch } from "@/components/ui/switch";
import { BankLogo } from "@/lib/bankLogos";
import { OfferBadgesInline } from "@/components/client/OfferBadges";


interface OfferTableProps {
  computedOffers: ComputedOffer[];
  onToggleLinkage: (offerId: string, linkageId: string) => void;
  recommendedId?: string;
  onAdvance?: (offerId: string) => void;
  onDeleteOffer?: (offerId: string) => void;
  globalTermYears?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtDec = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const InsuranceBasis = () => (
  <div className="text-xs space-y-2 max-w-xs">
    <div className="flex items-center gap-1.5 font-medium text-card-foreground">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      Base de cálculo de bonificaciones
    </div>
    <p className="text-muted-foreground leading-relaxed">
      <strong>Seguro de vida:</strong> {fmtDec(operationDefaults.lifeInsuranceAnnualDefault)}/año, estimado para un perfil
      estándar (edad 30-45 años, no fumador) con un capital asegurado de {fmt(operationDefaults.loanAmount)}.
    </p>
    <p className="text-muted-foreground leading-relaxed">
      <strong>Seguro de hogar:</strong> {fmtDec(operationDefaults.homeInsuranceAnnualDefault)}/año, calculado para una vivienda
      con tasación de {fmt(operationDefaults.appraisalValue)}, acorde al préstamo solicitado.
    </p>
    <p className="text-muted-foreground/70 italic">
      Los importes son orientativos y pueden variar según las condiciones de la póliza.
    </p>
  </div>
);

const InlineLinkages = ({ offer, onToggle }: { offer: Offer; onToggle: (lid: string) => void }) => (
  <div className="space-y-1.5">
    {offer.linkages.map((l) => (
      <div key={l.id} className="flex items-center gap-2">
        <Switch
          checked={l.isActive}
          onCheckedChange={() => onToggle(l.id)}
          className="scale-[0.6]"
        />
        <span className={`text-xs ${l.isActive ? "text-card-foreground font-medium" : "text-muted-foreground line-through"}`}>
          {l.label}
        </span>
      </div>
    ))}
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-0.5">
          <Info className="h-3 w-3" /> Detalle costes
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <ul className="space-y-2 text-xs mb-3">
          {offer.linkages.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3">
              <div>
                <span className="font-medium">{l.label}</span>
                <span className="text-muted-foreground ml-1">
                  (peso: {l.discountWeightPct} pp
                  {l.annualCostEUR > 0 ? `, ${fmt(l.annualCostEUR)}/año` : ", sin coste"})
                </span>
              </div>
            </li>
          ))}
        </ul>
        <InsuranceBasis />
      </PopoverContent>
    </Popover>
  </div>
);

const MonthlyWithInsurance = ({ co }: { co: ComputedOffer }) => {
  const monthlyInsurance = co.annualLinkageCost / 12;
  const total = co.monthlyPayment + monthlyInsurance;

  return (
    <div className="text-right">
      <p className="font-medium text-card-foreground">{fmt(co.monthlyPayment)}</p>
      {monthlyInsurance > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors underline decoration-dashed underline-offset-2">
              + {fmt(Math.round(monthlyInsurance))} seguros ≈ {fmt(Math.round(total))}/mes
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <InsuranceBasis />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

/* ——— Desktop table ——— */
const DesktopTable = ({ computedOffers, onToggleLinkage, recommendedId, onAdvance, onDeleteOffer, globalTermYears }: OfferTableProps) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalCost - b.totalCost);

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Banco</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                <span className="flex items-center justify-end gap-1">
                  TIN bonificado
                  <InfoTooltip text="TIN = Tipo de Interés Nominal. Es el porcentaje que el banco te cobra sobre el dinero prestado. Cuanto más bajo, menos pagas cada mes." />
                </span>
              </th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                <span className="flex items-center justify-end gap-1">
                  TAE estimada
                  <InfoTooltip text="TAE = Tasa Anual Equivalente. Es el coste REAL de tu hipoteca porque incluye interés + seguros + comisiones. Compara siempre por TAE." />
                </span>
              </th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Cuota/mes</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Bonificaciones</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Com. amort.</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((co) => {
              const o = co.offer;
              return (
                <tr
                  key={o.id}
                  className={`border-b last:border-b-0 transition-colors hover:bg-muted/30 ${o.isExternal ? "bg-destructive/5" : o.id === recommendedId ? "bg-primary/[0.03]" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <BankLogo bankName={o.bankName} logoColor={o.logoColor} size="md" />
                      {o.id === recommendedId && <Star className="h-4 w-4 text-primary fill-primary" />}
                    </div>
                    <div className="mt-1">
                      <OfferBadgesInline co={co} allOffers={computedOffers} recommendedId={recommendedId} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary" className="text-xs">{o.type}</Badge>
                    {o.termYears && globalTermYears && o.termYears !== globalTermYears && (
                      <Badge variant="outline" className="text-[10px] ml-1">{o.termYears} años</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-lg font-bold text-card-foreground">{co.bonifiedTIN.toFixed(2)} %</span>
                    {co.variableRate !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Luego: {co.variableRate.toFixed(2)}% (Euríbor + diferencial)
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs text-muted-foreground">{co.taeEstimated.toFixed(2)} %</span>
                  </td>
                  <td className="px-5 py-4">
                    <MonthlyWithInsurance co={co} />
                  </td>
                  <td className="px-5 py-4">
                    {o.isExternal ? (
                      <div className="space-y-1">
                        {o.linkages.map((l) => (
                          <div key={l.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                            <span>{l.label}</span>
                            <span className="text-[10px]">({l.discountWeightPct} pp{l.annualCostEUR > 0 ? `, ${fmt(l.annualCostEUR)}/año` : ""})</span>
                          </div>
                        ))}
                        {o.linkages.length === 0 && <span className="text-xs text-muted-foreground italic">Sin bonificaciones</span>}
                      </div>
                    ) : (
                      <InlineLinkages offer={o} onToggle={(lid) => onToggleLinkage(o.id, lid)} />
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-card-foreground">
                    {o.amortizationFeePct === 0 ? "0 %" : `${o.amortizationFeePct} %`}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {o.isExternal ? (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteOffer?.(o.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onAdvance?.(o.id)}>
                          Avanzar <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ——— Mobile cards (show ALL data by default) ——— */
const MobileCards = ({ computedOffers, onToggleLinkage, recommendedId, onAdvance, onDeleteOffer, globalTermYears }: OfferTableProps) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalCost - b.totalCost);

  return (
    <div className="space-y-4">
      {sorted.map((co) => {
        const o = co.offer;
        const monthlyInsurance = co.annualLinkageCost / 12;
        const totalMonthly = co.monthlyPayment + monthlyInsurance;

        return (
          <div
            key={o.id}
            className={`rounded-xl border overflow-hidden ${o.isExternal ? "bg-destructive/5 border-destructive/20" : "bg-card"} ${o.id === recommendedId ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BankLogo bankName={o.bankName} logoColor={o.logoColor} size="sm" />
                  {o.id === recommendedId && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                </div>
                <Badge variant="secondary" className="text-xs">{o.type}</Badge>
              </div>
              <div className="mt-1.5">
                <OfferBadgesInline co={co} allOffers={computedOffers} recommendedId={recommendedId} />
              </div>
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-3 divide-x divide-border border-b">
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TIN</p>
                <p className="text-lg font-bold text-card-foreground">{co.bonifiedTIN.toFixed(2)}%</p>
                {co.variableRate !== undefined && (
                  <p className="text-[10px] text-muted-foreground">Luego {co.variableRate.toFixed(2)}%</p>
                )}
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TAE</p>
                <p className="text-lg font-bold text-card-foreground">{co.taeEstimated.toFixed(2)}%</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cuota</p>
                <p className="text-lg font-bold text-card-foreground">{fmt(co.monthlyPayment)}</p>
                {monthlyInsurance > 0 && (
                  <p className="text-[10px] text-muted-foreground">Total ≈ {fmt(Math.round(totalMonthly))}</p>
                )}
              </div>
            </div>

            {/* Bonificaciones */}
            <div className="px-4 py-3 border-b">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Bonificaciones</p>
              {o.isExternal ? (
                <div className="space-y-1.5">
                  {o.linkages.map((l) => (
                    <div key={l.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                      <span>{l.label}</span>
                      <span className="text-[10px]">({l.discountWeightPct} pp{l.annualCostEUR > 0 ? `, ${fmt(l.annualCostEUR)}/año` : ""})</span>
                    </div>
                  ))}
                  {o.linkages.length === 0 && <span className="text-xs text-muted-foreground italic">Sin bonificaciones</span>}
                </div>
              ) : (
                <div className="space-y-2">
                  {o.linkages.map((l) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={l.isActive}
                          onCheckedChange={() => onToggleLinkage(o.id, l.id)}
                          className="scale-[0.65]"
                        />
                        <span className={`text-xs ${l.isActive ? "text-card-foreground font-medium" : "text-muted-foreground line-through"}`}>
                          {l.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {l.discountWeightPct} pp {l.annualCostEUR > 0 ? `· ${fmt(l.annualCostEUR)}/año` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amortización + acciones */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Com. amort. anticipada</p>
                <p className="text-sm font-medium text-card-foreground">
                  {o.amortizationFeePct === 0 ? "Sin comisión" : `${o.amortizationFeePct} %`}
                </p>
              </div>
              <div className="flex gap-2">
                {o.isExternal ? (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDeleteOffer?.(o.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => onAdvance?.(o.id)}>
                    Avanzar <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OfferTable = ({ computedOffers, onToggleLinkage, recommendedId, onAdvance, onDeleteOffer }: OfferTableProps) => {
  const isMobile = useIsMobile();
  return isMobile
    ? <MobileCards computedOffers={computedOffers} onToggleLinkage={onToggleLinkage} recommendedId={recommendedId} onAdvance={onAdvance} onDeleteOffer={onDeleteOffer} />
    : <DesktopTable computedOffers={computedOffers} onToggleLinkage={onToggleLinkage} recommendedId={recommendedId} onAdvance={onAdvance} onDeleteOffer={onDeleteOffer} />;
};

export default OfferTable;
