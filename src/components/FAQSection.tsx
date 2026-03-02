import { faqItems } from "@/data/mockOffers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => (
  <div className="bg-card rounded-xl border p-6 md:p-8">
    <h2 className="text-lg font-semibold text-card-foreground mb-1">Preguntas frecuentes</h2>
    <p className="text-sm text-muted-foreground mb-6">
      Resolvemos las dudas más habituales sobre hipotecas
    </p>
    <Accordion type="single" collapsible className="space-y-2">
      {faqItems.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium text-card-foreground hover:no-underline py-4">
            {faq.pregunta}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
            {faq.respuesta}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export default FAQSection;
