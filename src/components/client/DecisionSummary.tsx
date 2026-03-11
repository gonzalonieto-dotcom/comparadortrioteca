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
        "Esta es la oferta que más os conviene",
        "Os mostramos por qué",
        "Ya podéis avanzar con seguridad",
      ]
    : [
        "Esta es la oferta que más te conviene",
        "Te mostramos por qué",
        "Ya puedes avanzar con seguridad",
      ];

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-primary/5 rounded-2xl border border-primary/20 p-5 md:p-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Resumen para decidir con claridad</h2>

      <div className="space-y-2 mb-6">
        {bulletPoints.map((bp, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">{bp}</p>
          </div>
        ))}
      </div>

      {/* Mini summary card */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <BankLogo bankName={o.bankName} logoColor={o.logoColor} size="md" />
          <Badge variant="secondary" className="text-xs">{o.type}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cuota</p>
            <p className="text-lg font-bold text-foreground">{fmt(computed.monthlyPayment)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TIN</p>
            <p className="text-lg font-bold text-primary">{computed.bonifiedTIN.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vinculación</p>
            <p className="text-lg font-bold text-foreground">{activeLinkages.length}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        {isCouple
          ? "Te ayudamos a entender cuál os conviene más. Si necesitáis revisarlo juntos, esta comparación tiene todo lo necesario."
          : "Te ayudamos a entender cuál te conviene más. Si necesitas revisarlo con alguien, esta comparación tiene todo lo necesario."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="gap-2 flex-1 sm:flex-none" onClick={() => onAdvance?.(o.id)}>
          Avanzar con esta oferta <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline" className="text-muted-foreground">
          Quiero revisar las demás opciones
        </Button>
      </div>
    </div>
  );
};

export default DecisionSummary;
