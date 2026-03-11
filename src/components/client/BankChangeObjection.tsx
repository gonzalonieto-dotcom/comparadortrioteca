import { ShieldCheck, Heart, Scale, MessageCircle } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface BankChangeObjectionProps {
  isCouple?: boolean;
}

const BankChangeObjection = ({ isCouple = false }: BankChangeObjectionProps) => (
  <div className="bg-card rounded-2xl border p-5 md:p-8">
    <div className="flex items-center gap-2 mb-1">
      <h2 className="text-lg font-semibold text-foreground">
        {isCouple ? "¿Y si preferís seguir con vuestro banco?" : "¿Y si prefieres seguir con tu banco?"}
      </h2>
      <InfoTooltip text="Cambiar de banco solo tiene sentido si las condiciones mejoran de forma clara. La comparación te ayuda a verlo con más seguridad." />
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
      {isCouple
        ? "Es normal tener dudas antes de cambiar de banco. Por eso no os mostramos solo una oferta mejor: también os ayudamos a entender si el cambio realmente compensa."
        : "Es normal tener dudas antes de cambiar de banco. Por eso no te mostramos solo una oferta mejor: también te ayudamos a entender si el cambio realmente compensa."}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
        <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Honestidad ante todo</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Solo {isCouple ? "os recomendamos" : "te recomendamos"} cambiar si compensa de verdad. No cambiar por cambiar.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
        <Scale className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Comparación clara</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCouple
              ? "Vuestro banco actual no siempre es la mejor opción, pero tampoco hace falta cambiar si la diferencia no compensa."
              : "Tu banco actual no siempre es la mejor opción, pero tampoco hace falta cambiar si la diferencia no compensa."}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
        <Heart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Decidir con tranquilidad</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta comparación está pensada para que {isCouple ? "decidáis" : "decidas"} con claridad, sin prisas ni presión.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
        <MessageCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Fácil de explicar</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCouple
              ? "Si necesitáis consultarlo entre vosotros, esta comparación os da la información necesaria."
              : "Si necesitas consultarlo con alguien, esta comparación te da la información necesaria."}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default BankChangeObjection;
