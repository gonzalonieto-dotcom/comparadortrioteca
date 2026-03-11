import { ComputedOffer } from "@/lib/mortgageCalc";
import { CheckCircle2, TrendingDown, Shield, Zap, Award, Scale } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { forwardRef } from "react";

interface WhyWeRecommendProps {
  computed: ComputedOffer;
  savingsVsNext: number;
  allOffers: ComputedOffer[];
  isCouple?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const WhyWeRecommend = forwardRef<HTMLDivElement, WhyWeRecommendProps>(
  ({ computed, savingsVsNext, allOffers, isCouple = false }, ref) => {
    const o = computed.offer;
    const activeLinkages = o.linkages.filter((l) => l.isActive);

    // Build interpretive reasons from existing data
    const reasons: { icon: React.ReactNode; text: string }[] = [];

    // Lowest cost
    reasons.push({
      icon: <TrendingDown className="h-5 w-5 text-accent flex-shrink-0" />,
      text: "Cuota mensual competitiva: es la opción con menor coste total entre las disponibles.",
    });

    // Savings
    if (savingsVsNext > 0) {
      reasons.push({
        icon: <Scale className="h-5 w-5 text-accent flex-shrink-0" />,
        text: `Buen equilibrio entre coste y condiciones: ~${fmt(savingsVsNext)} menos que la siguiente mejor opción.`,
      });
    }

    // Low linkages
    if (activeLinkages.length <= 2) {
      reasons.push({
        icon: <Shield className="h-5 w-5 text-accent flex-shrink-0" />,
        text: "Menor carga de productos vinculados: menos compromisos adicionales con el banco.",
      });
    }

    // Amortization
    if (o.amortizationFeePct === 0) {
      reasons.push({
        icon: <Zap className="h-5 w-5 text-accent flex-shrink-0" />,
        text: "Sin comisión por amortización anticipada: puedes reducir tu hipoteca cuando quieras.",
      });
    }

    // Type advantage
    reasons.push({
      icon: <Award className="h-5 w-5 text-accent flex-shrink-0" />,
      text: isCouple
        ? "Opción más equilibrada para vuestro perfil según las condiciones visibles en la comparación."
        : "Opción más equilibrada para tu perfil según las condiciones visibles en la comparación.",
    });

    return (
      <div ref={ref} className="bg-card rounded-2xl border p-5 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-foreground">¿Por qué recomendamos esta oferta?</h2>
          <InfoTooltip text="No recomendamos una oferta solo por tener una cuota atractiva, sino por el equilibrio entre coste, condiciones y facilidad para avanzar." />
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          No se trata solo de elegir una cuota baja. Se trata de elegir la oferta que mejor encaja {isCouple ? "con vosotros" : "contigo"}.
        </p>

        <div className="space-y-4">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              {r.icon}
              <p className="text-sm text-foreground leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

WhyWeRecommend.displayName = "WhyWeRecommend";

export default WhyWeRecommend;
