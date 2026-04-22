import type { Offer, OperationDefaults, Linkage } from "@/data/mortgageData";

// ─── Bonified TIN ───
export function calcBonifiedTIN(offer: Offer): number {
  const totalDiscount = offer.linkages
    .filter((l) => l.isActive)
    .reduce((sum, l) => sum + l.discountWeightPct, 0);
  return Math.max(offer.baseTIN - totalDiscount, 0.01);
}

// ─── French payment ───
export function calcMonthlyPayment(loanAmount: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return loanAmount / termMonths;
  return (loanAmount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

// ─── Amortization schedule ───
export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

// ─── Get annual rate for a given month (supports mixed mortgages) ───
function getAnnualRateForMonth(offer: Offer, month: number, bonifiedTIN: number): number {
  if (!offer.mixedPeriods || offer.mixedPeriods.length === 0) {
    return bonifiedTIN;
  }
  const year = Math.ceil(month / 12);
  for (const period of offer.mixedPeriods) {
    if (year >= period.fromYear && year <= period.toYear) {
      if (period.fixedTIN !== undefined) {
        // fixedTIN is stored as the BONIFIED TIN already (consistent with the
        // way the manager inputs it via base_tin). Do NOT subtract linkage
        // discounts again here.
        return Math.max(period.fixedTIN, 0.01);
      }
      if (period.spreadOverEuribor !== undefined) {
        const euribor = offer.euriborRate ?? 2.45;
        return Math.max(euribor + period.spreadOverEuribor, 0.01);
      }
    }
  }
  return bonifiedTIN;
}

export function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  offer?: Offer
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = loanAmount;

  if (offer?.mixedPeriods && offer.mixedPeriods.length > 0) {
    const bonifiedTIN = calcBonifiedTIN(offer);
    let currentRate = -1;
    let payment = 0;

    for (let m = 1; m <= termMonths; m++) {
      const rate = getAnnualRateForMonth(offer, m, bonifiedTIN);
      const remainingMonths = termMonths - m + 1;

      if (rate !== currentRate) {
        currentRate = rate;
        payment = calcMonthlyPayment(balance, rate, remainingMonths);
      }

      const r = rate / 100 / 12;
      const interest = balance * r;
      const principal = payment - interest;
      balance = Math.max(balance - principal, 0);
      rows.push({ month: m, year: Math.ceil(m / 12), payment, interest, principal, remainingBalance: balance });
    }
  } else {
    const r = annualRate / 100 / 12;
    const payment = calcMonthlyPayment(loanAmount, annualRate, termMonths);

    for (let m = 1; m <= termMonths; m++) {
      const interest = balance * r;
      const principal = payment - interest;
      balance = Math.max(balance - principal, 0);
      rows.push({ month: m, year: Math.ceil(m / 12), payment, interest, principal, remainingBalance: balance });
    }
  }
  return rows;
}

// ─── Total interest ───
export function calcTotalInterest(schedule: AmortizationRow[]): number {
  return schedule.reduce((s, r) => s + r.interest, 0);
}

// ─── Total linkage cost (with optional inflation) ───
export function calcTotalLinkageCost(offer: Offer, termYears: number, inflationRate?: number): number {
  const inf = (inflationRate ?? 0) / 100;
  return offer.linkages
    .filter((l) => l.isActive)
    .reduce((s, l) => {
      if (l.label.toLowerCase().includes("1er año") || l.label.toLowerCase().includes("primer año")) {
        return s + l.annualCostEUR;
      }
      if (inf > 0) {
        // Compound inflation: sum of cost * (1+inf)^i for i=0..termYears-1
        let total = 0;
        for (let i = 0; i < termYears; i++) {
          total += l.annualCostEUR * Math.pow(1 + inf, i);
        }
        return s + total;
      }
      return s + l.annualCostEUR * termYears;
    }, 0);
}

// ─── Annual linkage cost ───
export function calcAnnualLinkageCost(offer: Offer): number {
  return offer.linkages.filter((l) => l.isActive).reduce((s, l) => s + l.annualCostEUR, 0);
}

// ─── Total cost approx ───
export function calcTotalCost(
  offer: Offer,
  defaults: OperationDefaults,
  schedule: AmortizationRow[],
  inflationRate?: number
): number {
  const totalInterest = calcTotalInterest(schedule);
  const totalLinkage = calcTotalLinkageCost(offer, defaults.termYears, inflationRate);
  const termMonths = defaults.termYears * 12;
  const totalAccountCost = offer.monthlyAccountCostEUR * termMonths;
  return totalInterest + totalLinkage + offer.upfrontCostsEUR + totalAccountCost + defaults.appraisalCostEUR;
}

// ─── Estimated TAE via IRR (bisection) ───
export function calcEstimatedTAE(
  offer: Offer,
  defaults: OperationDefaults,
  schedule: AmortizationRow[]
): number {
  const netReceived = defaults.loanAmount - offer.upfrontCostsEUR - defaults.appraisalCostEUR;

  const annualLinkageCost = calcAnnualLinkageCost(offer);
  const monthlyExtra = offer.monthlyAccountCostEUR + annualLinkageCost / 12;
  const cashflows = schedule.map((r) => r.payment + monthlyExtra);

  const npv = (monthlyRate: number): number => {
    if (monthlyRate <= 0) {
      return cashflows.reduce((s, cf) => s + cf, 0) - netReceived;
    }
    let pv = 0;
    for (let i = 0; i < cashflows.length; i++) {
      pv += cashflows[i] / Math.pow(1 + monthlyRate, i + 1);
    }
    return pv - netReceived;
  };

  let lo = 0.0001;
  let hi = 0.02;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  const irrMonthly = (lo + hi) / 2;
  return (Math.pow(1 + irrMonthly, 12) - 1) * 100;
}

// ─── Period breakdown for mixed mortgages ───
export interface PeriodBreakdown {
  label: string;
  fromYear: number;
  toYear: number;
  avgMonthlyPayment: number;
  totalInterest: number;
  rate: number;
  isVariable: boolean;
}

export function calcPeriodBreakdown(offer: Offer, schedule: AmortizationRow[]): PeriodBreakdown[] {
  if (!offer.mixedPeriods || offer.mixedPeriods.length === 0) return [];

  const totalDiscount = offer.linkages
    .filter((l) => l.isActive)
    .reduce((sum, l) => sum + l.discountWeightPct, 0);

  return offer.mixedPeriods.map((period) => {
    const rows = schedule.filter((r) => r.year >= period.fromYear && r.year <= period.toYear);
    const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
    const avgPayment = rows.length > 0 ? rows.reduce((s, r) => s + r.payment, 0) / rows.length : 0;
    const isVariable = period.spreadOverEuribor !== undefined;
    const rate = isVariable
      ? (offer.euriborRate ?? 2.45) + period.spreadOverEuribor!
      : Math.max((period.fixedTIN ?? 0) - totalDiscount, 0.01);

    return {
      label: isVariable
        ? `Años ${period.fromYear}-${period.toYear} (variable)`
        : `Años ${period.fromYear}-${period.toYear} (fijo)`,
      fromYear: period.fromYear,
      toYear: period.toYear,
      avgMonthlyPayment: avgPayment,
      totalInterest,
      rate,
      isVariable,
    };
  });
}

// ─── Computed offer summary ───
export interface ComputedOffer {
  offer: Offer;
  bonifiedTIN: number;
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalInterest: number;
  totalLinkageCost: number;
  totalCost: number;
  taeEstimated: number;
  annualLinkageCost: number;
  variableRate?: number;
  periodBreakdown: PeriodBreakdown[];
  insuranceCostWithInflation?: number;
}

export function computeOffer(offer: Offer, defaults: OperationDefaults, inflationRate?: number): ComputedOffer {
  const effectiveTermYears = offer.termYears ?? defaults.termYears;
  const effectiveDefaults = effectiveTermYears !== defaults.termYears
    ? { ...defaults, termYears: effectiveTermYears }
    : defaults;
  const termMonths = effectiveTermYears * 12;
  const bonifiedTIN = calcBonifiedTIN(offer);
  const schedule = generateAmortizationSchedule(effectiveDefaults.loanAmount, bonifiedTIN, termMonths, offer);
  const monthlyPayment = schedule[0]?.payment ?? 0;
  const totalInterest = calcTotalInterest(schedule);
  const totalLinkageCost = calcTotalLinkageCost(offer, effectiveTermYears, inflationRate);
  const totalCost = calcTotalCost(offer, effectiveDefaults, schedule, inflationRate);
  const taeEstimated = calcEstimatedTAE(offer, effectiveDefaults, schedule);
  const annualLinkageCost = calcAnnualLinkageCost(offer);
  const periodBreakdown = calcPeriodBreakdown(offer, schedule);

  let variableRate: number | undefined;
  if (offer.mixedPeriods) {
    const varPeriod = offer.mixedPeriods.find((p) => p.spreadOverEuribor !== undefined);
    if (varPeriod) {
      variableRate = (offer.euriborRate ?? 2.45) + varPeriod.spreadOverEuribor!;
    }
  }

  // Insurance cost with inflation = difference between inflated and non-inflated linkage cost
  let insuranceCostWithInflation: number | undefined;
  if (inflationRate && inflationRate > 0) {
    insuranceCostWithInflation = totalLinkageCost;
  }

  return {
    offer,
    bonifiedTIN,
    monthlyPayment,
    schedule,
    totalInterest,
    totalLinkageCost,
    totalCost,
    taeEstimated,
    annualLinkageCost,
    variableRate,
    periodBreakdown,
    insuranceCostWithInflation,
  };
}

// ─── Cumulative cost by year (for line chart) ───
export interface YearlyCumulativeCost {
  year: number;
  [bankId: string]: number;
}

export function calcCumulativeCostByYear(
  computedOffers: ComputedOffer[],
  defaults: OperationDefaults,
  inflationRate?: number
): YearlyCumulativeCost[] {
  const inf = (inflationRate ?? 0) / 100;
  const years: YearlyCumulativeCost[] = [];
  for (let y = 1; y <= defaults.termYears; y++) {
    const row: YearlyCumulativeCost = { year: y };
    for (const co of computedOffers) {
      const interestToYear = co.schedule
        .filter((r) => r.year <= y)
        .reduce((s, r) => s + r.interest, 0);
      // Compound inflation on annual linkage costs
      let linkageCostToYear = 0;
      for (let i = 0; i < y; i++) {
        linkageCostToYear += co.annualLinkageCost * Math.pow(1 + inf, i);
      }
      const otherCostsToYear =
        co.offer.upfrontCostsEUR +
        defaults.appraisalCostEUR +
        co.offer.monthlyAccountCostEUR * y * 12;
      row[co.offer.id] = interestToYear + linkageCostToYear + otherCostsToYear;
    }
    years.push(row);
  }
  return years;
}
