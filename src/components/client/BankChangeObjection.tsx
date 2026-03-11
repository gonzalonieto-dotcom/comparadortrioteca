import { ShieldCheck, Heart, Scale, Eye } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface BankChangeObjectionProps {
  isCouple?: boolean;
}

const BankChangeObjection = ({ isCouple = false }: BankChangeObjectionProps) => (
  <div className="bg-card rounded-2xl border p-6 md:p-10">
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-lg font-semibold text-foreground">
        {isCouple
          ? "¿Y si ya estáis valorando otra opción?"
          : "¿Y si ya estás valorando otra opción?"}
      </h2>
      <InfoTooltip text="Cambiar solo tiene sentido si las condiciones mejoran de forma clara. Esta comparación te ayuda a verlo con más seguridad." />
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
      {isCouple
        ? "Es normal sentir más confianza con una opción que ya conocéis. Por eso no os mostramos solo una alternativa destacada: también os ayudamos a entender si realmente compensa frente a otras opciones que estéis valorando."
        : "Es normal sentir más confianza con una opción que ya conoces. Por eso no te mostramos solo una alternativa destacada: también te ayudamos a entender si realmente compensa frente a otras opciones que estés valorando."}
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="flex items-start gap-3.5 bg-muted/30 rounded-xl p-4">
        <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Honestidad ante todo</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Solo {isCouple ? "os recomendamos" : "te recomendamos"} una alternativa si realmente compensa. No cambiar por cambiar.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3.5 bg-muted/30 rounded-xl p-4">
        <Scale className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Comparación objetiva</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCouple
              ? "La opción que ya conocéis no siempre es la mejor, pero tampoco hace falta cambiar si la diferencia no compensa."
              : "La opción que ya conoces no siempre es la mejor, pero tampoco hace falta cambiar si la diferencia no compensa."}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3.5 bg-muted/30 rounded-xl p-4">
        <Heart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Decidir con tranquilidad</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta comparación está pensada para que {isCouple ? "decidáis" : "decidas"} con claridad, sin prisas ni presión.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3.5 bg-muted/30 rounded-xl p-4">
        <Eye className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-0.5">Fácil de compartir</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isCouple
              ? "Si necesitáis consultarlo entre vosotros, esta comparación os da toda la información necesaria."
              : "Si necesitas revisarlo con alguien, esta comparación tiene toda la información necesaria."}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default BankChangeObjection;
