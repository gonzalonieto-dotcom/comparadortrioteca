import { Sparkles } from "lucide-react";

interface HeroBlockProps {
  isCouple?: boolean;
}

const HeroBlock = ({ isCouple = false }: HeroBlockProps) => (
  <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-6 md:p-10">
    <div className="absolute top-4 right-4 opacity-10">
      <Sparkles className="h-24 w-24 text-primary" />
    </div>
    <div className="relative z-10 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
        {isCouple
          ? "La mejor oferta para avanzar con vuestra hipoteca"
          : "La mejor oferta para avanzar con tu hipoteca"}
      </h1>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        {isCouple
          ? "Hemos comparado las ofertas que encajan con vuestro perfil y os mostramos cuál os conviene más según cuota, coste total, vinculación y facilidad para avanzar."
          : "Hemos comparado las ofertas que encajan con tu perfil y te mostramos cuál te conviene más según cuota, coste total, vinculación y facilidad para avanzar."}
      </p>
      <p className="mt-3 text-xs text-muted-foreground/80 italic">
        Comparar bien ahora puede evitar pagar de más durante años.
      </p>
    </div>
  </section>
);

export default HeroBlock;
