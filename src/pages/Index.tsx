import { useState, useMemo, useCallback } from "react";
import { operationDefaults, defaultOffers, Offer } from "@/data/mortgageData";
import { computeOffer, ComputedOffer } from "@/lib/mortgageCalc";
import LoanHeader from "@/components/LoanHeader";
import RecommendedOffer from "@/components/RecommendedOffer";
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
import triotecaLogo from "@/assets/trioteca-logo.svg";

export interface PartialPayment {
  year: number;
  amount: number;
}

const Index = () => {
  const [offers, setOffers] = useState<Offer[]>(defaultOffers);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceOfferId, setAdvanceOfferId] = useState<string | null>(null);
  const [amortOpen, setAmortOpen] = useState(false);
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const defaults = operationDefaults;

  const handleToggleLinkage = useCallback((offerId: string, linkageId: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              linkages: o.linkages.map((l) =>
                l.id === linkageId ? { ...l, isActive: !l.isActive } : l
              ),
            }
          : o
      )
    );
  }, []);

  const handleAddOffer = useCallback((offer: Offer) => {
    setOffers((prev) => [...prev, offer]);
  }, []);

  const handleDeleteOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  }, []);

  const computedOffers: ComputedOffer[] = useMemo(
    () => offers.map((o) => computeOffer(o, defaults)),
    [offers, defaults]
  );

  const sortedByCost = useMemo(
    () => [...computedOffers].sort((a, b) => a.totalCost - b.totalCost),
    [computedOffers]
  );

  const recommended = sortedByCost[0];
  const savings = sortedByCost.length > 1 ? sortedByCost[1].totalCost - sortedByCost[0].totalCost : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
            <p className="text-xs text-muted-foreground hidden sm:block">Comparador de ofertas hipotecarias</p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          {/* Intro for beginners */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-5 md:p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">📊 Tu comparador hipotecario</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este comparador toma las ofertas que, de momento, los bancos tienen para ti. Cada una tiene un <strong>tipo de interés</strong> (lo que pagas por el dinero prestado) y unas <strong>bonificaciones</strong> (productos que reducen ese interés). Puedes activar o desactivar bonificaciones para ver cómo cambia tu cuota. Si tienes dudas, usa el <strong>asistente hipotecario</strong> de abajo.
            </p>
          </section>

          <LoanHeader defaults={defaults} />

          <section>
            <RecommendedOffer computed={recommended} savingsVsNext={savings} />
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Comparativa de ofertas</h2>
              <p className="text-sm text-muted-foreground">
                Activa o desactiva bonificaciones para ver cómo cambia el <strong>TIN</strong> (tipo de interés), la <strong>cuota mensual</strong> y la <strong>TAE</strong> (coste total real). La oferta con ⭐ es la que menos te costará en total.
              </p>
            </div>
            <OfferTable
              computedOffers={computedOffers}
              onToggleLinkage={handleToggleLinkage}
              recommendedId={recommended?.offer.id}
              onAdvance={(offerId) => { setAdvanceOfferId(offerId); setAdvanceOpen(true); }}
              onDeleteOffer={handleDeleteOffer}
            />
          </section>

          <section>
            <ExternalOfferForm onAddOffer={handleAddOffer} />
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Coste total aproximado a vida de la hipoteca</h2>
              <p className="text-sm text-muted-foreground">
                Esto es lo que pagarás en total durante los {defaults.termYears} años: intereses al banco + coste de bonificaciones + otros gastos. Cuanto menor, mejor para ti.
              </p>
            </div>
            <CostBreakdown computedOffers={computedOffers} />
            <div className="mt-4">
              <InterestBarChart computedOffers={computedOffers} recommendedId={recommended?.offer.id} defaults={defaults} partialPayments={partialPayments} onPartialPaymentsChange={setPartialPayments} />
            </div>
          </section>

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

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Puntos clave por banco</h2>
              <p className="text-sm text-muted-foreground">Resumen rápido de ventajas y puntos a considerar.</p>
            </div>
            <ConsiderationCards offers={offers} />
          </section>

          <section>
            <FAQCopilot />
          </section>

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

export default Index;
