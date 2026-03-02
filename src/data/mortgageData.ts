// ─── Global Operation Defaults ───
export interface OperationDefaults {
  purchasePrice: number;
  appraisalValue: number;
  loanAmount: number;
  termYears: number;
  homeInsuranceAnnualDefault: number;
  lifeInsuranceAnnualDefault: number;
  appraisalCostEUR: number;
}

export const operationDefaults: OperationDefaults = {
  purchasePrice: 250000,
  appraisalValue: 260000,
  loanAmount: 200000,
  termYears: 30,
  homeInsuranceAnnualDefault: 223.86,
  lifeInsuranceAnnualDefault: 180,
  appraisalCostEUR: 400,
};

// ─── Linkage ───
export interface Linkage {
  id: string;
  label: string;
  isActive: boolean;
  discountWeightPct: number;
  annualCostEUR: number;
}

// ─── Mixed rate period ───
export interface MixedRatePeriod {
  fromYear: number;
  toYear: number;
  fixedTIN?: number;           // if set, this period uses fixed rate
  spreadOverEuribor?: number;  // if set, this period uses Euribor + spread
}

// ─── Offer (bank) ───
export interface Offer {
  id: string;
  bankName: string;
  logoColor: string;
  type: "Fijo" | "Mixto" | "Variable";
  baseTIN: number;
  amortizationFeePct: number;
  upfrontCostsEUR: number;
  monthlyAccountCostEUR: number;
  linkages: Linkage[];
  advantages: string[];
  considerations: string[];
  isExternal?: boolean;
  // Mixed mortgage periods
  mixedPeriods?: MixedRatePeriod[];
  // Current Euribor for mixed/variable calcs
  euriborRate?: number;
}

// ─── Default offers ───
export const defaultOffers: Offer[] = [
  {
    id: "santander",
    bankName: "Banco Santander",
    logoColor: "hsl(0, 80%, 50%)",
    type: "Fijo",
    baseTIN: 3.00,
    amortizationFeePct: 1.5,
    upfrontCostsEUR: 0,
    monthlyAccountCostEUR: 0,
    linkages: [
      { id: "san-nomina", label: "Nómina", isActive: true, discountWeightPct: 0.35, annualCostEUR: 0 },
      { id: "san-hogar", label: "Seguro Hogar", isActive: true, discountWeightPct: 0.40, annualCostEUR: operationDefaults.homeInsuranceAnnualDefault },
      { id: "san-vida", label: "Seguro Vida", isActive: true, discountWeightPct: 0.20, annualCostEUR: operationDefaults.lifeInsuranceAnnualDefault },
    ],
    advantages: [
      "Proceso ágil: suele tardar 5-7 días en asignar gestor, pero una vez contactado el proceso es fluido.",
      "Si ya eres cliente, puedes reconfirmar tu solicitud desde la app y agilizar los trámites.",
      "Una de las mayores redes de oficinas de España, con banca digital robusta.",
    ],
    considerations: [
      "Comisión por amortización anticipada del 1,5%, lo que penaliza pagos extra.",
      "Requiere contratar seguro de hogar y vida para obtener el TIN bonificado.",
      "Es necesario que el banco sancione riesgos antes de validar la tasación, lo que puede alargar plazos.",
    ],
  },
  {
    id: "caixabank",
    bankName: "CaixaBank",
    logoColor: "hsl(200, 70%, 40%)",
    type: "Fijo",
    baseTIN: 2.80,
    amortizationFeePct: 0,
    upfrontCostsEUR: 0,
    monthlyAccountCostEUR: 0,
    linkages: [
      { id: "caixa-nomina", label: "Domiciliación de nómina", isActive: true, discountWeightPct: 0.70, annualCostEUR: 0 },
    ],
    advantages: [
      "Oferta recibida en menos de 48h: una de las entidades más ágiles en enviar propuesta inicial.",
      "Menos bonificaciones: solo requiere nómina domiciliada (-0,75% TIN), sin seguros obligatorios.",
      "Proceso estructurado y fluido desde el envío del expediente hasta la firma.",
      "Oferta personalizada con capacidad de negociación para perfiles específicos (ej. funcionarios).",
    ],
    considerations: [
      "Primer filtro estricto: si el banco detecta falta de interés real, no avanza con la operación.",
      "Amplia red de oficinas puede hacer que el cliente ya tenga oferta previa directamente en sucursal.",
      "Algunas operaciones (autopromoción, nominales < 70.000€) solo se gestionan en oficina directamente.",
    ],
  },
  {
    id: "bankinter",
    bankName: "Bankinter",
    logoColor: "hsl(25, 90%, 50%)",
    type: "Fijo",
    baseTIN: 3.20,
    amortizationFeePct: 2.0,
    upfrontCostsEUR: 0,
    monthlyAccountCostEUR: 0,
    linkages: [
      { id: "bk-nomina", label: "Nómina", isActive: true, discountWeightPct: 0.40, annualCostEUR: 0 },
      { id: "bk-hogar", label: "Seguro Hogar", isActive: true, discountWeightPct: 0.50, annualCostEUR: operationDefaults.homeInsuranceAnnualDefault },
    ],
    advantages: [
      "Oferta inicial rápida gracias a su sistema apificado y digitalizado.",
      "Gran diversidad de tipología de operaciones: desde autopromoción hasta casos poco convencionales.",
      "Servicio 100% digital: seguimiento expedito con cambios automáticos de estado.",
      "Amplia capacidad operativa tras la fusión con EVO Banco.",
    ],
    considerations: [
      "Oferta a tipo fijo y mixto menos competitiva que otras entidades del comparador.",
      "Comisión por amortización anticipada del 2%, la más alta de la comparativa.",
      "Bonificaciones con seguros obligatorios que elevan el coste real de la oferta.",
      "No permite financiación al 90% a través de bróker, aunque sí en oficina directa.",
    ],
  },
  {
    id: "ibercaja",
    bankName: "Ibercaja",
    logoColor: "hsl(340, 75%, 45%)",
    type: "Mixto",
    baseTIN: 1.50,  // TIN del periodo fijo
    amortizationFeePct: 0.5,
    upfrontCostsEUR: 0,
    monthlyAccountCostEUR: 0,
    euriborRate: 2.45,  // Euríbor actual estimado
    mixedPeriods: [
      { fromYear: 1, toYear: 10, fixedTIN: 1.50 },
      { fromYear: 11, toYear: 30, spreadOverEuribor: 0.90 },
    ],
    linkages: [
      { id: "iber-hogar", label: "Seguro Hogar", isActive: true, discountWeightPct: 0.30, annualCostEUR: operationDefaults.homeInsuranceAnnualDefault },
      { id: "iber-vida", label: "Seguro Vida (1er año)", isActive: true, discountWeightPct: 0.20, annualCostEUR: operationDefaults.lifeInsuranceAnnualDefault },
    ],
    advantages: [
      "Tipo fijo muy bajo (1,50%) los primeros 10 años: ideal si piensas amortizar pronto.",
      "Cuota inicial significativamente menor que las opciones a tipo fijo.",
      "Permite aprovechar bajadas del Euríbor a partir del año 11.",
      "Buena opción para quienes planean mejora de condiciones o cancelación antes de los 10 años.",
    ],
    considerations: [
      "A partir del año 11, la cuota depende del Euríbor: si sube mucho, la cuota se encarece.",
      "El coste total a 30 años puede superar al fijo si el Euríbor se mantiene alto.",
      "Seguro de vida solo bonificado el primer año; a partir del segundo año se puede cancelar sin perder bonificación.",
      "Requiere planificación: si no amortizas pronto, pierdes la ventaja del mixto.",
    ],
  },
];

// ─── FAQ ───
export { faqItems } from "@/data/mockOffers";
