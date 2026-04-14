import { ComputedOffer } from "@/lib/mortgageCalc";
import { Star, ArrowRight, ChevronDown, TrendingDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { BankLogo } from "@/lib/bankLogos";

interface EnhancedRecommendedCardProps {
  computed: ComputedOffer;
  savingsVsNext: number;
  isCouple?: boolean;
  onAdvance?: (offerId: string) => void;
  onScrollToWhy?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const EnhancedRecommendedCard = ({
  computed,
  savingsVsNext,
  isCouple = false,
  onAdvance,
  onScrollToWhy,
}: EnhancedRecommendedCardProps) => {
  const o = computed.offer;
  const activeLinkages = o.linkages.filter((l) => l.isActive);
  const hasPeriods = computed.periodBreakdown.length > 0;

  return (
    <div className="relative bg-card rounded-2xl border-2 border-primary shadow-lg shadow-primary/8 overflow-hidden">
      {/* Top banner */}
      <div className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-semibold tracking-tight">Nuestra recomendación</span>
        </div>
        <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px] font-medium">
          Mejor opción
        </Badge>
      </div>

      <div className="p-6 md:p-10">
        {/* Bank name & type */}
        <div className="flex items-center justify-between mb-6">
          <BankLogo bankName={o.bankName} logoColor={o.logoColor} size="lg" />
          <Badge variant="secondary" className="text-xs">{o.type}</Badge>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8 mb-8">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
              {hasPeriods ? "Cuota inicial" : "Cuota mensual"}
              <InfoTooltip text="Es lo que pagarías cada mes. Conviene verla junto con el resto de condiciones para tomar una buena decisión." />
            </p>
            <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{fmt(computed.monthlyPayment)}</p>
            {hasPeriods && computed.periodBreakdown.length >= 2 && (
              <div className="mt-1.5">
                <p className="text-xs text-muted-foreground">
                  A partir del año {computed.periodBreakdown[1].fromYear}:
                </p>
                <p className="text-lg font-semibold text-foreground">
                  ~{fmt(computed.periodBreakdown[1].avgMonthlyPayment)}/mes
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (Euríbor + {computed.periodBreakdown[1].rate.toFixed(2)}%)
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
              TIN bonificado
              <InfoTooltip text="TIN = Tipo de Interés Nominal. Es el porcentaje que el banco cobra sobre el dinero prestado. Este ya incluye el descuento de las bonificaciones activas." />
            </p>
            <p className="text-2xl font-bold text-primary">{computed.bonifiedTIN.toFixed(2)} %</p>
            {computed.variableRate !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Luego: {computed.variableRate.toFixed(2)}%
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
              Coste total
              <InfoTooltip text="No solo importa la cuota. El coste total te muestra cuánto acabarías pagando a lo largo de toda la vida de la hipoteca." />
            </p>
            <p className="text-xl font-semibold text-foreground">{fmt(computed.totalCost)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">TAE estimada</p>
            <p className="text-xl font-semibold text-foreground">{computed.taeEstimated.toFixed(2)} %</p>
          </div>
        </div>

        {/* Savings callout */}
        {savingsVsNext > 0 && (
          <div className="bg-accent/8 border border-accent/15 rounded-xl px-5 py-3.5 mb-8 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">~{fmt(savingsVsNext)} menos</span>{" "}
              que la siguiente opción a lo largo de la vida de la hipoteca.
            </p>
          </div>
        )}

        {/* Linkages summary */}
        {!o.isExternal && activeLinkages.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-2.5 flex items-center gap-1">
              Bonificación requerida ({activeLinkages.length})
              <InfoTooltip text="La bonificación son productos que el banco puede pedirte para mejorar las condiciones, como nómina, seguros o tarjetas." />
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeLinkages.map((v) => (
                <Badge key={v.id} variant="outline" className="text-xs font-normal">{v.label}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key advantage from bank */}
        {o.advantages && o.advantages.length > 0 && (
          <div className="mb-8 flex items-start gap-3.5 bg-primary/5 border border-primary/10 rounded-xl px-5 py-4">
            <Star className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{o.advantages[0]}</p>
            </div>
          </div>
        )}

        {/* Explanation */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-xl">
          {isCouple
            ? "Es la opción que mejor equilibra cuota, coste total y condiciones para vuestro perfil."
            : "Es la opción que mejor equilibra cuota, coste total y condiciones para tu perfil."}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="gap-2 flex-1 sm:flex-none font-semibold"
            onClick={() => onAdvance?.(o.id)}
          >
            Avanzar con esta oferta <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={onScrollToWhy}
          >
            Ver por qué la recomendamos <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRecommendedCard;
