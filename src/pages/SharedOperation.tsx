import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Offer, OperationDefaults } from "@/data/mortgageData";
import { computeOffer, ComputedOffer } from "@/lib/mortgageCalc";
import LoanHeader from "@/components/LoanHeader";
import OfferTable from "@/components/OfferTable";
import CostBreakdown from "@/components/CostBreakdown";
import InterestBarChart from "@/components/InterestBarChart";
import ConsiderationCards from "@/components/ConsiderationCards";
import FAQCopilot from "@/components/FAQCopilot";
import AmortizationTable from "@/components/AmortizationTable";
import AdvanceModal from "@/components/AdvanceModal";
import ExternalOfferForm from "@/components/ExternalOfferForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";
import type { PartialPayment } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";

// New UX components
import HeroBlock from "@/components/client/HeroBlock";
import EnhancedRecommendedCard from "@/components/client/EnhancedRecommendedCard";
import WhyWeRecommend from "@/components/client/WhyWeRecommend";
import BankChangeObjection from "@/components/client/BankChangeObjection";
import DecisionSummary from "@/components/client/DecisionSummary";

const SharedOperation = () => {
  const { token } = useParams<{ token: string }>();
  const [defaults, setDefaults] = useState<OperationDefaults | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inflationRate, setInflationRate] = useState<number>(3.0);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceOfferId, setAdvanceOfferId] = useState<string | null>(null);
  const [amortOpen, setAmortOpen] = useState(false);
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const whyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    supabase.functions.invoke("get-comparison", { body: { token } })
      .then(({ data, error: fnErr }) => {
        if (fnErr || !data || data.error) {
          setError(data?.error || fnErr?.message || "Comparativa no encontrada");
          return;
        }
        const op = data.operation;
        setDefaults({
          purchasePrice: op.purchase_price,
          appraisalValue: op.appraisal_value,
          loanAmount: op.loan_amount,
          termYears: op.term_years,
          homeInsuranceAnnualDefault: op.home_insurance_annual,
          lifeInsuranceAnnualDefault: op.life_insurance_annual,
          appraisalCostEUR: op.appraisal_cost,
        });
        setInflationRate(op.inflation_rate ?? 3.0);
        const linkages = data.linkages || [];
        const mixedPeriods = data.mixedPeriods || [];
        setOffers((data.offers || []).map((o: any) => ({
          id: o.id,
          bankName: o.bank_name,
          logoColor: o.logo_color,
          type: o.type as Offer["type"],
          baseTIN: o.base_tin,
          amortizationFeePct: o.amortization_fee_pct,
          upfrontCostsEUR: o.upfront_costs,
          monthlyAccountCostEUR: o.monthly_account_cost,
          euriborRate: o.euribor_rate ?? undefined,
          termYears: o.term_years ?? undefined,
          advantages: o.advantages || [],
          considerations: o.considerations || [],
          linkages: linkages
            .filter((l: any) => l.offer_id === o.id && l.is_active_default)
            .map((l: any) => ({
              id: l.id,
              label: l.label,
              isActive: true,
              discountWeightPct: l.discount_weight_pct,
              annualCostEUR: l.annual_cost,
            })),
          mixedPeriods: mixedPeriods
            .filter((m: any) => m.offer_id === o.id)
            .map((m: any) => ({
              fromYear: m.from_year,
              toYear: m.to_year,
              fixedTIN: m.fixed_tin ?? undefined,
              spreadOverEuribor: m.spread_over_euribor ?? undefined,
            })),
        })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleToggleLinkage = useCallback((offerId: string, linkageId: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, linkages: o.linkages.map((l) => l.id === linkageId ? { ...l, isActive: !l.isActive } : l) }
          : o
      )
    );
  }, []);

  const handleAddOffer = useCallback((offer: Offer) => setOffers((prev) => [...prev, offer]), []);
  const handleDeleteOffer = useCallback((offerId: string) => setOffers((prev) => prev.filter((o) => o.id !== offerId)), []);
  const handleAdvance = useCallback((offerId: string) => { setAdvanceOfferId(offerId); setAdvanceOpen(true); }, []);

  const computedOffers: ComputedOffer[] = useMemo(
    () => defaults ? offers.map((o) => computeOffer(o, defaults, inflationRate)) : [],
    [offers, defaults, inflationRate]
  );

  const sortedByCost = useMemo(() => [...computedOffers].sort((a, b) => a.totalCost - b.totalCost), [computedOffers]);
  const recommended = sortedByCost[0];
  const savings = sortedByCost.length > 1 ? sortedByCost[1].totalCost - sortedByCost[0].totalCost : 0;

  const scrollToWhy = useCallback(() => {
    whyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando operación...</div>;
  if (error || !defaults) return <div className="min-h-screen flex items-center justify-center text-destructive">{error || "Operación no encontrada"}</div>;
  if (offers.length === 0) return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
            <p className="text-xs text-muted-foreground hidden sm:block">Comparador de ofertas hipotecarias</p>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Tu comparativa está en preparación</h2>
          <p className="text-sm text-muted-foreground">Tu gestor aún no ha añadido ofertas a esta comparativa. Vuelve a consultar más tarde.</p>
        </main>
      </div>
    </TooltipProvider>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
            <p className="text-xs text-muted-foreground hidden sm:block">Comparador de ofertas hipotecarias</p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* 1. Hero */}
          <HeroBlock />

          {/* 2. Loan details */}
          <LoanHeader defaults={defaults} />

          {/* 3. Enhanced recommended card */}
          {recommended && (
            <section>
              <EnhancedRecommendedCard
                computed={recommended}
                savingsVsNext={savings}
                onAdvance={handleAdvance}
                onScrollToWhy={scrollToWhy}
              />
            </section>
          )}

          {/* 4. Why we recommend */}
          {recommended && (
            <section>
              <WhyWeRecommend
                ref={whyRef}
                computed={recommended}
                savingsVsNext={savings}
                allOffers={computedOffers}
              />
            </section>
          )}

          {/* 5. Bank change objection */}
          <section>
            <BankChangeObjection />
          </section>

          {/* 6. Offer table */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Comparativa de ofertas</h2>
              <p className="text-sm text-muted-foreground">Activa o desactiva bonificaciones para ver cómo cambia el TIN, la cuota y la TAE.</p>
            </div>
            <OfferTable
              computedOffers={computedOffers}
              onToggleLinkage={handleToggleLinkage}
              recommendedId={recommended?.offer.id}
              onAdvance={handleAdvance}
              onDeleteOffer={handleDeleteOffer}
              globalTermYears={defaults.termYears}
            />
          </section>

          <section><ExternalOfferForm onAddOffer={handleAddOffer} /></section>

          {/* 7. Cost breakdown */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Coste total aproximado</h2>
              <p className="text-sm text-muted-foreground">Lo que pagarás en total durante los {defaults.termYears} años.</p>
            </div>
            <CostBreakdown computedOffers={computedOffers} inflationRate={inflationRate} />
            <div className="mt-4">
              <InterestBarChart computedOffers={computedOffers} recommendedId={recommended?.offer.id} defaults={defaults} partialPayments={partialPayments} onPartialPaymentsChange={setPartialPayments} />
            </div>
          </section>

          {/* 8. Amortization */}
          <section>
            <Collapsible open={amortOpen} onOpenChange={setAmortOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full bg-card rounded-xl border px-6 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cuadro de amortización</h3>
                  <p className="text-xs text-muted-foreground">Detalle mensual por banco y año</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${amortOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3">
                  <AmortizationTable computedOffers={computedOffers} termYears={defaults.termYears} partialPayments={partialPayments} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </section>

          {/* 9. Consideration cards */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Puntos clave por banco</h2>
              <p className="text-sm text-muted-foreground">Resumen rápido de ventajas y puntos a considerar.</p>
            </div>
            <ConsiderationCards offers={offers} />
          </section>

          {/* 10. Decision summary + final CTA */}
          {recommended && (
            <section>
              <DecisionSummary computed={recommended} onAdvance={handleAdvance} />
            </section>
          )}

          {/* 11. FAQ */}
          <section><FAQCopilot /></section>

          {(() => {
            const advOffer = offers.find((o) => o.id === advanceOfferId);
            return (
              <AdvanceModal
                open={advanceOpen}
                onOpenChange={setAdvanceOpen}
                bankName={advOffer?.bankName}
                bankColor={advOffer?.logoColor}
                isExternal={advOffer?.isExternal}
              />
            );
          })()}
        </main>

        <footer className="border-t bg-card mt-12">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
            Los datos mostrados son estimaciones orientativas. Consulta con tu gestor para confirmar las condiciones definitivas.
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default SharedOperation;
