import { ComputedOffer } from "@/lib/mortgageCalc";
import { TrendingDown, Shield, Zap, Award, Scale } from "lucide-react";
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

    const reasons: { icon: React.ReactNode; title: string; text: string }[] = [];

    reasons.push({
      icon: <TrendingDown className="h-5 w-5 text-accent flex-shrink-0" />,
      title: "Cuota mensual competitiva",
      text: "Es la opción con menor coste total entre las alternativas disponibles para tu perfil.",
    });

    if (savingsVsNext > 0) {
      reasons.push({
        icon: <Scale className="h-5 w-5 text-accent flex-shrink-0" />,
        title: "Diferencia significativa",
        text: `Supone aproximadamente ${fmt(savingsVsNext)} menos que la siguiente mejor opción a lo largo de la vida de la hipoteca.`,
      });
    }

    if (activeLinkages.length <= 2) {
      reasons.push({
        icon: <Shield className="h-5 w-5 text-accent flex-shrink-0" />,
        title: "Menor carga de vinculación",
        text: "Requiere menos productos vinculados, lo que significa menos compromisos adicionales.",
      });
    }

    if (o.amortizationFeePct === 0) {
      reasons.push({
        icon: <Zap className="h-5 w-5 text-accent flex-shrink-0" />,
        title: "Sin comisión por amortización",
        text: "Puedes reducir o cancelar tu hipoteca anticipadamente sin coste adicional.",
      });
    }

    reasons.push({
      icon: <Award className="h-5 w-5 text-accent flex-shrink-0" />,
      title: "Equilibrio global",
      text: isCouple
        ? "Es la opción más equilibrada para vuestro perfil según el conjunto de condiciones visibles en la comparación."
        : "Es la opción más equilibrada para tu perfil según el conjunto de condiciones visibles en la comparación.",
    });

    return (
      <div ref={ref} className="bg-card rounded-2xl border p-6 md:p-10">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold text-foreground">¿Por qué recomendamos esta oferta?</h2>
          <InfoTooltip text="No recomendamos una oferta solo por tener una cuota atractiva, sino por el equilibrio entre coste, condiciones y facilidad para avanzar." />
        </div>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl leading-relaxed">
          No se trata solo de elegir una cuota baja. Se trata de elegir la oferta que mejor encaja {isCouple ? "con vosotros" : "contigo"}.
        </p>

        <div className="space-y-5">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="mt-0.5">{r.icon}</div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">{r.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

WhyWeRecommend.displayName = "WhyWeRecommend";

export default WhyWeRecommend;
