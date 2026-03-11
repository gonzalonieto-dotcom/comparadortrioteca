import { Sparkles } from "lucide-react";

interface HeroBlockProps {
  isCouple?: boolean;
}

const HeroBlock = ({ isCouple = false }: HeroBlockProps) => (
  <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-8 md:p-12">
    <div className="absolute top-6 right-6 opacity-[0.07]">
      <Sparkles className="h-28 w-28 text-primary" />
    </div>
    <div className="relative z-10 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
        {isCouple
          ? "La mejor oferta para avanzar con vuestra hipoteca"
          : "La mejor oferta para avanzar con tu hipoteca"}
      </h1>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        {isCouple
          ? "Hemos analizado las ofertas que encajan con vuestro perfil y os mostramos cuál os conviene más según cuota, coste total, vinculación y condiciones para avanzar."
          : "Hemos analizado las ofertas que encajan con tu perfil y te mostramos cuál te conviene más según cuota, coste total, vinculación y condiciones para avanzar."}
      </p>
      <p className="mt-4 text-xs text-muted-foreground/70">
        Comparar bien ahora puede evitar pagar de más durante años.
      </p>
    </div>
  </section>
);

export default HeroBlock;
