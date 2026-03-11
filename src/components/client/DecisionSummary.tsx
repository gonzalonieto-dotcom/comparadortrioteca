import { ComputedOffer } from "@/lib/mortgageCalc";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/lib/bankLogos";

interface DecisionSummaryProps {
  computed: ComputedOffer;
  isCouple?: boolean;
  onAdvance?: (offerId: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const DecisionSummary = ({ computed, isCouple = false, onAdvance }: DecisionSummaryProps) => {
  const o = computed.offer;
  const activeLinkages = o.linkages.filter((l) => l.isActive);

  const bulletPoints = isCouple
    ? [
        "Esta es la oferta que más os conviene según la comparación",
        "Os mostramos por qué con datos claros",
        "Ya podéis avanzar con seguridad",
      ]
    : [
        "Esta es la oferta que más te conviene según la comparación",
        "Te mostramos por qué con datos claros",
        "Ya puedes avanzar con seguridad",
      ];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-primary/5 rounded-2xl border border-primary/20 p-6 md:p-10">
      <h2 className="text-lg font-semibold text-foreground mb-5">Resumen para decidir con claridad</h2>

      <div className="space-y-3 mb-8">
        {bulletPoints.map((bp, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">{bp}</p>
          </div>
        ))}
      </div>

      {/* Mini summary card */}
      <div className="bg-card rounded-xl border p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <BankLogo bankName={o.bankName} logoColor={o.logoColor} size="md" />
          <Badge variant="secondary" className="text-xs">{o.type}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cuota</p>
            <p className="text-lg font-bold text-foreground">{fmt(computed.monthlyPayment)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">TIN</p>
            <p className="text-lg font-bold text-primary">{computed.bonifiedTIN.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bonificación</p>
            <p className="text-lg font-bold text-foreground">{activeLinkages.length}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-lg">
        {isCouple
          ? "Si necesitáis revisarlo juntos, esta comparación tiene toda la información necesaria para decidir."
          : "Si necesitas revisarlo con alguien, esta comparación tiene toda la información necesaria para decidir."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="gap-2 flex-1 sm:flex-none font-semibold" onClick={() => onAdvance?.(o.id)}>
          Avanzar con esta oferta <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline" className="text-muted-foreground hover:text-foreground">
          Quiero revisar las demás opciones
        </Button>
      </div>
    </div>
  );
};

export default DecisionSummary;
