import { ComputedOffer } from "@/lib/mortgageCalc";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/InfoTooltip";

interface RecommendedOfferProps {
  computed: ComputedOffer;
  savingsVsNext: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const RecommendedOffer = ({ computed, savingsVsNext }: RecommendedOfferProps) => {
  const o = computed.offer;
  const activeLinkages = o.linkages.filter((l) => l.isActive);
  const amortText = o.amortizationFeePct === 0 ? "0 %" : `${o.amortizationFeePct} %`;

  return (
    <div className="relative bg-card rounded-xl border-2 border-primary p-6 md:p-8 overflow-hidden">
      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1.5 rounded-bl-xl text-xs font-semibold flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-current" />
        Recomendada
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">Oferta recomendada</h2>
        <p className="text-sm text-muted-foreground">Basada en el coste total, comisiones y nivel de bonificación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: o.logoColor }} />
              <span className="font-semibold text-lg text-card-foreground">{o.bankName}</span>
            </div>
            <Badge variant="secondary" className="text-xs">{o.type}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <p className="text-xs text-muted-foreground flex items-center gap-1">
                 TIN bonificado
                 <InfoTooltip text="TIN = Tipo de Interés Nominal. Es el porcentaje que el banco te cobra sobre el dinero prestado. Este ya incluye el descuento de las bonificaciones activas." />
               </p>
               <p className="text-3xl font-bold text-primary">{computed.bonifiedTIN.toFixed(2)} %</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cuota mensual</p>
              <p className="text-2xl font-semibold text-card-foreground">{fmt(computed.monthlyPayment)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Comisión amortización</p>
            <p className="text-sm font-medium text-accent">{amortText}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bonificaciones ({activeLinkages.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {activeLinkages.map((v) => (
                <Badge key={v.id} variant="outline" className="text-xs font-normal">{v.label}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Coste total aproximado</p>
            <p className="text-lg font-semibold text-card-foreground">{fmt(computed.totalCost)}</p>
            {savingsVsNext > 0 && (
              <p className="text-sm text-accent font-medium mt-0.5">~{fmt(savingsVsNext)} menos que la siguiente opción</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t">
        <h4 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
          💡 Tips del experto
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          {o.amortizationFeePct === 0 && (
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              Sin comisión por amortización anticipada: puedes reducir tu hipoteca cuando quieras sin penalización.
            </li>
          )}
          {computed.taeEstimated <= 3.5 && (
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              TAE competitiva: el coste total anual estimado está entre los más bajos del mercado.
            </li>
          )}
          {activeLinkages.length <= 2 && (
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              Pocas bonificaciones exigidas, lo que te da más flexibilidad.
            </li>
          )}
          {savingsVsNext > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">✓</span>
              Te ahorras ~{fmt(savingsVsNext)} respecto a la siguiente mejor opción a lo largo de la vida de la hipoteca.
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">✓</span>
            {o.type === "Fijo"
              ? "Tipo fijo: tu cuota no cambiará durante toda la vida del préstamo."
              : o.type === "Mixto"
                ? "Tipo mixto: cuota estable los primeros años, luego se ajusta al mercado."
                : "Tipo variable: cuota más baja al inicio, pero sujeta a cambios del Euríbor."}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecommendedOffer;
