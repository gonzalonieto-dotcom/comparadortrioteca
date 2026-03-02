export interface Vinculacion {
  nombre: string;
  descripcion: string;
  costeAnualEstimado?: number;
}

export interface Oferta {
  id: string;
  banco: string;
  logoColor: string;
  tipoOferta: "Fijo" | "Mixto" | "Variable";
  tinBonificado: number;
  tinSinBonificar: number;
  taeEstimada: number;
  cuotaMensual: number;
  vinculaciones: Vinculacion[];
  comisionAmortizacion: string;
  comisionAmortizacionDetalle: string;
  interesesTotales: number;
  costeVinculacionesAnual: number;
  costeTotalAproximado: number;
  ventajas: string[];
  puntosConsiderar: string[];
  esRecomendada?: boolean;
}

export interface DatosOperacion {
  nominal: number;
  precioVivienda: number;
  ltc: number;
  plazoAnios: number;
  plazoMeses: number;
}

export const datosOperacion: DatosOperacion = {
  nominal: 240000,
  precioVivienda: 320000,
  ltc: 75,
  plazoAnios: 25,
  plazoMeses: 300,
};

export const ofertas: Oferta[] = [
  {
    id: "a",
    banco: "Banco Santander",
    logoColor: "hsl(0, 80%, 50%)",
    tipoOferta: "Fijo",
    tinBonificado: 2.65,
    tinSinBonificar: 3.15,
    taeEstimada: 3.12,
    cuotaMensual: 1089,
    vinculaciones: [
      { nombre: "Nómina domiciliada", descripcion: "Domiciliar nómina de al menos 600 €/mes", costeAnualEstimado: 0 },
      { nombre: "Seguro hogar", descripcion: "Seguro de hogar contratado con la entidad", costeAnualEstimado: 420 },
      { nombre: "Seguro de vida", descripcion: "Seguro de vida vinculado al préstamo", costeAnualEstimado: 380 },
    ],
    comisionAmortizacion: "0 %",
    comisionAmortizacionDetalle: "Sin comisión por amortización anticipada total ni parcial.",
    interesesTotales: 86700,
    costeVinculacionesAnual: 800,
    costeTotalAproximado: 87500,
    ventajas: [
      "[Placeholder] Punto fuerte 1 de la oferta del Banco Santander.",
      "[Placeholder] Punto fuerte 2 de la oferta del Banco Santander.",
    ],
    puntosConsiderar: [
      "[Placeholder] Punto a considerar 1 del Banco Santander.",
      "[Placeholder] Punto a considerar 2 del Banco Santander.",
    ],
    esRecomendada: true,
  },
  {
    id: "b",
    banco: "CaixaBank",
    logoColor: "hsl(200, 70%, 40%)",
    tipoOferta: "Mixto",
    tinBonificado: 2.35,
    tinSinBonificar: 2.95,
    taeEstimada: 3.28,
    cuotaMensual: 1058,
    vinculaciones: [
      { nombre: "Nómina domiciliada", descripcion: "Domiciliar nómina de al menos 600 €/mes", costeAnualEstimado: 0 },
      { nombre: "Seguro hogar", descripcion: "Seguro de hogar contratado con la entidad", costeAnualEstimado: 480 },
      { nombre: "Seguro de vida", descripcion: "Seguro de vida vinculado al préstamo", costeAnualEstimado: 450 },
      { nombre: "Plan de pensiones", descripcion: "Aportación mínima de 600 €/año a plan de pensiones", costeAnualEstimado: 600 },
    ],
    comisionAmortizacion: "2 % (0-10a), 1,5 % (resto)",
    comisionAmortizacionDetalle: "Comisión del 2 % sobre el capital amortizado en los primeros 10 años, y del 1,5 % en el resto del plazo.",
    interesesTotales: 77400,
    costeVinculacionesAnual: 1530,
    costeTotalAproximado: 88800,
    ventajas: [
      "[Placeholder] Punto fuerte 1 de la oferta de CaixaBank.",
      "[Placeholder] Punto fuerte 2 de la oferta de CaixaBank.",
    ],
    puntosConsiderar: [
      "[Placeholder] Punto a considerar 1 de CaixaBank.",
      "[Placeholder] Punto a considerar 2 de CaixaBank.",
    ],
  },
  {
    id: "c",
    banco: "Bankinter",
    logoColor: "hsl(25, 90%, 50%)",
    tipoOferta: "Fijo",
    tinBonificado: 2.80,
    tinSinBonificar: 3.30,
    taeEstimada: 3.35,
    cuotaMensual: 1105,
    vinculaciones: [
      { nombre: "Nómina domiciliada", descripcion: "Domiciliar nómina de al menos 800 €/mes", costeAnualEstimado: 0 },
      { nombre: "Seguro hogar", descripcion: "Seguro de hogar contratado con la entidad", costeAnualEstimado: 390 },
    ],
    comisionAmortizacion: "0,5 % (0-5a), 0 % (resto)",
    comisionAmortizacionDetalle: "Comisión del 0,5 % en los primeros 5 años; sin comisión a partir del sexto año.",
    interesesTotales: 91500,
    costeVinculacionesAnual: 390,
    costeTotalAproximado: 91890,
    ventajas: [
      "[Placeholder] Punto fuerte 1 de la oferta de Bankinter.",
      "[Placeholder] Punto fuerte 2 de la oferta de Bankinter.",
    ],
    puntosConsiderar: [
      "[Placeholder] Punto a considerar 1 de Bankinter.",
      "[Placeholder] Punto a considerar 2 de Bankinter.",
    ],
  },
];

export const faqItems = [
  {
    pregunta: "¿Qué diferencia hay entre la cuota y la TAE?",
    respuesta: "La cuota es lo que pagas cada mes al banco. La TAE (Tasa Anual Equivalente) refleja el coste total del préstamo incluyendo intereses, comisiones y otros gastos. Una cuota más baja no siempre significa mejor hipoteca: si la TAE es más alta, el coste total será mayor a lo largo de los años.",
  },
  {
    pregunta: "¿Qué pasa si no cumplo con alguna vinculación?",
    respuesta: "Si dejas de cumplir una vinculación (por ejemplo, dejas de domiciliar la nómina), el banco puede aplicar el TIN sin bonificar, lo que sube tu cuota mensual. No pierdes la hipoteca, pero pagas más cada mes. Revisa bien qué vinculaciones puedes mantener a largo plazo.",
  },
  {
    pregunta: "¿Puedo amortizar anticipadamente? ¿Tiene coste?",
    respuesta: "Sí, puedes devolver parte o toda la hipoteca antes de tiempo. Algunos bancos cobran una comisión por amortización anticipada (un porcentaje sobre el capital que devuelves). Otras ofertas no tienen comisión, lo que te da más flexibilidad si recibes un ingreso extra o quieres reducir deuda.",
  },
  {
    pregunta: "¿El seguro de hogar es obligatorio? ¿Cuánto me cuesta?",
    respuesta: "El seguro de hogar es obligatorio por ley para cualquier hipoteca (debe cubrir al menos el valor de la estructura del inmueble). Lo que varía es si lo contratas con el banco (como vinculación) o con otra aseguradora. Contratarlo con el banco suele mejorar el tipo de interés, pero puede ser más caro que buscarlo por tu cuenta.",
  },
  {
    pregunta: "Hipoteca mixta vs fija: ¿cuál me conviene más?",
    respuesta: "La hipoteca fija te da estabilidad: tu cuota no cambia nunca. La mixta tiene un periodo inicial a tipo fijo y luego pasa a variable (ligado al Euríbor). Si priorizas previsibilidad y tranquilidad, la fija suele ser mejor opción. La mixta puede tener un TIN inicial más bajo, pero conlleva incertidumbre a medio plazo.",
  },
  {
    pregunta: "¿Trioteca es neutral? ¿Me recomendáis el banco que más os paga?",
    respuesta: "Trioteca es un bróker hipotecario independiente. Nuestro objetivo es encontrar la mejor oferta para ti, no empujar a un banco concreto. La recomendación se basa en criterios objetivos: coste total (TAE), comisiones, vinculaciones y estabilidad del tipo. Te explicamos todas las opciones para que tú decidas.",
  },
  {
    pregunta: "¿Los datos que veo aquí son definitivos?",
    respuesta: "Los datos mostrados son estimaciones basadas en las ofertas comerciales recibidas. La TAE es aproximada y puede variar ligeramente al formalizar. Los importes de vinculaciones y costes totales son orientativos para facilitar la comparación. Tu gestor te confirmará las condiciones exactas antes de firmar.",
  },
];
