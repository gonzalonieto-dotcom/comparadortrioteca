import { useState, useMemo } from "react";
import { ComputedOffer, calcCumulativeCostByYear, calcBonifiedTIN } from "@/lib/mortgageCalc";
import { OperationDefaults } from "@/data/mortgageData";
import { PartialPayment } from "@/pages/Index";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";


interface InterestBarChartProps {
  computedOffers: ComputedOffer[];
  recommendedId?: string;
  defaults: OperationDefaults;
  partialPayments: PartialPayment[];
  onPartialPaymentsChange: (payments: PartialPayment[]) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/* ——— Tab 1: Stacked bar ——— */
const StackedBarTab = ({ computedOffers, recommendedId }: { computedOffers: ComputedOffer[]; recommendedId?: string }) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalInterest - b.totalInterest);
  const data = sorted.map((co) => ({
    name: co.offer.bankName.split(" ").pop(),
    fullName: co.offer.bankName,
    interest: co.totalInterest,
    bonifications: co.totalLinkageCost,
    color: co.offer.id === recommendedId ? "hsl(var(--primary))" : co.offer.logoColor,
  }));

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        Barra oscura = intereses · Barra clara = coste de bonificaciones
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--card-foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
            <RTooltip
              formatter={(value: number, name: string) => [fmt(value), name === "Intereses" ? "Intereses totales" : "Coste de bonificaciones"]}
              labelFormatter={(l) => data.find((d) => d.name === l)?.fullName ?? l}
              contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "0.8rem" }}
            />
            <Bar dataKey="interest" stackId="a" radius={[0, 0, 0, 0]} barSize={24} name="Intereses">
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Bar>
            <Bar dataKey="bonifications" stackId="a" radius={[0, 6, 6, 0]} barSize={24} name="Bonificaciones">
              {data.map((entry, index) => <Cell key={index} fill={entry.color} fillOpacity={0.3} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

/* ——— Tab 2: Breakeven (supports partial payments) ——— */
const BreakevenTab = ({ computedOffers, defaults, partialPayments }: { computedOffers: ComputedOffer[]; defaults: OperationDefaults; partialPayments: PartialPayment[] }) => {
  const hasPayments = partialPayments.length > 0 && partialPayments.some(p => p.amount > 0);
  const hasMixed = computedOffers.some((co) => co.offer.type === "Mixto");

  const data = useMemo(() => {
    if (!hasPayments) {
      return calcCumulativeCostByYear(computedOffers, defaults);
    }

    // Recalculate with partial payments — simulate full term once per offer,
    // then populate year rows (null after payoff so the line stops).
    const payoffYear: Record<string, number> = {};
    const finalCost: Record<string, number[]> = {};

    for (const co of computedOffers) {
      const offer = co.offer;
      const termMonths = defaults.termYears * 12;
      const bonifiedTIN = calcBonifiedTIN(offer);
      let balance = defaults.loanAmount;
      let totalCost = offer.upfrontCostsEUR + defaults.appraisalCostEUR;
      let currentRate = -1;
      let payment = 0;
      let paidOff = false;
      const costByYear: number[] = [];

      for (let m = 1; m <= termMonths; m++) {
        if (paidOff) break;
        if (m % 12 === 1 || m === 1) {
          const yr = Math.ceil(m / 12);
          const partial = partialPayments.filter(p => p.year === yr).reduce((s, p) => s + p.amount, 0);
          if (partial > 0) balance = Math.max(balance - partial, 0);
          if (balance <= 0) { paidOff = true; payoffYear[co.offer.id] = yr; costByYear.push(totalCost + co.annualLinkageCost * yr + offer.monthlyAccountCostEUR * yr * 12); break; }
        }
        let rate = bonifiedTIN;
        if (offer.mixedPeriods?.length) {
          const yr = Math.ceil(m / 12);
          for (const period of offer.mixedPeriods) {
            if (yr >= period.fromYear && yr <= period.toYear) {
              if (period.fixedTIN !== undefined) {
                const disc = offer.linkages.filter(l => l.isActive).reduce((s, l) => s + l.discountWeightPct, 0);
                rate = Math.max(period.fixedTIN - disc, 0.01);
              } else if (period.spreadOverEuribor !== undefined) {
                rate = Math.max((offer.euriborRate ?? 2.45) + period.spreadOverEuribor, 0.01);
              }
            }
          }
        }
        const remaining = termMonths - m + 1;
        if (rate !== currentRate) {
          currentRate = rate;
          const r = rate / 100 / 12;
          payment = r === 0 ? balance / remaining : (balance * r * Math.pow(1 + r, remaining)) / (Math.pow(1 + r, remaining) - 1);
        }
        const r = rate / 100 / 12;
        const interest = balance * r;
        totalCost += interest;
        balance = Math.max(balance - (payment - interest), 0);
        if (balance <= 0) { paidOff = true; payoffYear[co.offer.id] = Math.ceil(m / 12); }
        // snapshot at end of each year
        if (m % 12 === 0 || paidOff) {
          const yr = Math.ceil(m / 12);
          const yearCost = totalCost + co.annualLinkageCost * yr + offer.monthlyAccountCostEUR * yr * 12;
          while (costByYear.length < yr) costByYear.push(yearCost);
        }
      }
      if (!paidOff) payoffYear[co.offer.id] = defaults.termYears;
      finalCost[co.offer.id] = costByYear;
    }

    // Find max year any offer runs
    const maxYear = Math.max(...Object.values(payoffYear));
    const years = [];
    for (let y = 1; y <= maxYear; y++) {
      const row: any = { year: y };
      for (const co of computedOffers) {
        const arr = finalCost[co.offer.id];
        // null after payoff → line stops
        row[co.offer.id] = y <= (payoffYear[co.offer.id] ?? defaults.termYears) && arr[y - 1] !== undefined ? arr[y - 1] : null;
      }
      years.push(row);
    }
    return years;
  }, [computedOffers, defaults, partialPayments, hasPayments]);

  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">
        {hasPayments ? (
          <span className="text-primary font-medium">📊 Gráfico ajustado con tus pagos parciales.</span>
        ) : hasMixed ? (
          <>
            Este gráfico muestra cuánto llevas pagado en cada año. <strong>Si piensas amortizar antes del cruce de líneas, la hipoteca mixta te sale más barata.</strong>
          </>
        ) : (
          "Coste acumulado por año para cada banco. La línea más baja = menor coste."
        )}
      </p>
      {hasMixed && !hasPayments && (
        <p className="text-xs text-primary/80 mb-4 bg-primary/5 rounded-lg px-3 py-2">
          💡 <strong>Consejo:</strong> Si planeas hacer amortizaciones anticipadas o cancelar antes del año 10-12, la mixta suele ser más ventajosa.
        </p>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} label={{ value: "Año", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={55} />
            <RTooltip
              formatter={(value: number, name: string) => {
                const co = computedOffers.find((c) => c.offer.id === name);
                return [fmt(value), co?.offer.bankName ?? name];
              }}
              labelFormatter={(l) => `Año ${l}`}
              contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "0.8rem" }}
            />
            <Legend formatter={(value) => computedOffers.find((c) => c.offer.id === value)?.offer.bankName ?? value} />
            {computedOffers.map((co) => (
              <Line key={co.offer.id} type="monotone" dataKey={co.offer.id} stroke={co.offer.logoColor} strokeWidth={co.offer.type === "Mixto" ? 3 : 2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

/* ——— Tab 3: Partial payment simulator ——— */
const PartialPaymentTab = ({ computedOffers, defaults, partialPayments, onPartialPaymentsChange }: {
  computedOffers: ComputedOffer[];
  defaults: OperationDefaults;
  partialPayments: PartialPayment[];
  onPartialPaymentsChange: (payments: PartialPayment[]) => void;
}) => {
  const addPayment = () => {
    const lastYear = partialPayments.length > 0 ? partialPayments[partialPayments.length - 1].year + 1 : 1;
    onPartialPaymentsChange([...partialPayments, { year: Math.min(lastYear, defaults.termYears), amount: 5000 }]);
  };

  const removePayment = (idx: number) => {
    onPartialPaymentsChange(partialPayments.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, field: "year" | "amount", value: number) => {
    onPartialPaymentsChange(partialPayments.map((p, i) =>
      i === idx ? { ...p, [field]: field === "year" ? Math.max(1, Math.min(value, defaults.termYears)) : Math.max(0, value) } : p
    ));
  };

  const results = useMemo(() => {
    if (partialPayments.length === 0) return [];
    return computedOffers.map((co) => {
      const offer = co.offer;
      const termMonths = defaults.termYears * 12;
      const bonifiedTIN = calcBonifiedTIN(offer);
      let balance = defaults.loanAmount;
      let totalInterestWithPayments = 0;
      let currentRate = -1;
      let payment = 0;
      let monthsToPayoff = termMonths;

      for (let m = 1; m <= termMonths; m++) {
        if (balance <= 0) { monthsToPayoff = m - 1; break; }
        if (m % 12 === 1 || m === 1) {
          const year = Math.ceil(m / 12);
          const partialForYear = partialPayments.filter((p) => p.year === year).reduce((s, p) => s + p.amount, 0);
          if (partialForYear > 0) {
            balance = Math.max(balance - partialForYear, 0);
            if (balance <= 0) { monthsToPayoff = m - 1; break; }
          }
        }
        let rate = bonifiedTIN;
        if (offer.mixedPeriods?.length) {
          const year = Math.ceil(m / 12);
          for (const period of offer.mixedPeriods) {
            if (year >= period.fromYear && year <= period.toYear) {
              if (period.fixedTIN !== undefined) {
                const totalDiscount = offer.linkages.filter((l) => l.isActive).reduce((s, l) => s + l.discountWeightPct, 0);
                rate = Math.max(period.fixedTIN - totalDiscount, 0.01);
              } else if (period.spreadOverEuribor !== undefined) {
                rate = Math.max((offer.euriborRate ?? 2.45) + period.spreadOverEuribor, 0.01);
              }
            }
          }
        }
        const remainingMonths = termMonths - m + 1;
        if (rate !== currentRate) {
          currentRate = rate;
          const r = rate / 100 / 12;
          payment = r === 0 ? balance / remainingMonths : (balance * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1);
        }
        const r = rate / 100 / 12;
        const interest = balance * r;
        totalInterestWithPayments += interest;
        balance = Math.max(balance - (payment - interest), 0);
      }
      const totalPartialPayments = partialPayments.reduce((s, p) => s + p.amount, 0);
      const interestSaved = co.totalInterest - totalInterestWithPayments;
      const amortizationFee = totalPartialPayments * (offer.amortizationFeePct / 100);
      const netSaved = interestSaved - amortizationFee;
      const yearsReduced = (termMonths - monthsToPayoff) / 12;
      return {
        bankName: offer.bankName, logoColor: offer.logoColor, originalInterest: co.totalInterest,
        newInterest: totalInterestWithPayments, interestSaved, amortizationFee, netSaved,
        yearsReduced: Math.max(yearsReduced, 0), amortFeePct: offer.amortizationFeePct,
      };
    });
  }, [computedOffers, partialPayments, defaults]);

  const totalPartial = partialPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <p className="text-xs text-muted-foreground mb-4">
        Añade pagos parciales para ver cuánto ahorras en intereses. Los gráficos de <strong>Punto de quiebre</strong> y el <strong>Cuadro de amortización</strong> se actualizarán automáticamente.
      </p>

      {partialPayments.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">No hay pagos parciales configurados.</p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addPayment}>
            <Plus className="h-3.5 w-3.5" /> Añadir pago parcial
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {partialPayments.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Importe (€)</label>
                  <Input
                    type="number"
                    value={p.amount || ""}
                    onChange={(e) => updatePayment(idx, "amount", Number(e.target.value))}
                    className="h-8 text-sm"
                    min={0}
                    step={1000}
                    placeholder="Ej: 10000"
                  />
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-muted-foreground">Año</label>
                  <Input
                    type="number"
                    value={p.year || ""}
                    onChange={(e) => updatePayment(idx, "year", Number(e.target.value))}
                    className="h-8 text-sm"
                    min={1}
                    max={defaults.termYears}
                  />
                </div>
                <button
                  onClick={() => removePayment(idx)}
                  className="mt-4 p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addPayment}>
              <Plus className="h-3.5 w-3.5" /> Añadir pago
            </Button>
          </div>

          {totalPartial > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              Total amortización parcial: <strong>{fmt(totalPartial)}</strong>
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r.bankName} className="bg-muted/30 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-card-foreground text-sm">{r.bankName}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Ahorro intereses</p>
                      <p className="font-semibold text-accent">{fmt(r.interestSaved)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Com. amort. ({r.amortFeePct}%)</p>
                      <p className="font-semibold text-card-foreground">{r.amortizationFee > 0 ? `-${fmt(r.amortizationFee)}` : "0 €"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ahorro neto</p>
                      <p className={`font-semibold ${r.netSaved > 0 ? "text-accent" : "text-destructive"}`}>{fmt(r.netSaved)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Años menos</p>
                      <p className="font-semibold text-card-foreground">{r.yearsReduced.toFixed(1)} años</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

/* ——— Main component ——— */
const InterestBarChart = ({ computedOffers, recommendedId, defaults, partialPayments, onPartialPaymentsChange }: InterestBarChartProps) => {
  return (
    <div className="bg-card rounded-xl border p-5">
      <Tabs defaultValue="total" className="w-full">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Análisis de costes
          </h3>
          <TabsList className="h-8">
            <TabsTrigger value="total" className="text-xs px-3 h-7">Coste total</TabsTrigger>
            <TabsTrigger value="breakeven" className="text-xs px-3 h-7">
              Punto de quiebre
              <InfoTooltip text="Compara cuánto pagarías en total según el año en que canceles o amortices." />
            </TabsTrigger>
            <TabsTrigger value="partial" className="text-xs px-3 h-7">
              Pago parcial
              <InfoTooltip text="Simula amortizaciones parciales para ver cuánto ahorras en intereses y cuántos años reduces." />
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="total">
          <StackedBarTab computedOffers={computedOffers} recommendedId={recommendedId} />
        </TabsContent>
        <TabsContent value="breakeven">
          <BreakevenTab computedOffers={computedOffers} defaults={defaults} partialPayments={partialPayments} />
        </TabsContent>
        <TabsContent value="partial">
          <PartialPaymentTab computedOffers={computedOffers} defaults={defaults} partialPayments={partialPayments} onPartialPaymentsChange={onPartialPaymentsChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterestBarChart;
