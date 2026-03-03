import { ComputedOffer, calcBonifiedTIN } from "@/lib/mortgageCalc";
import { useState, useMemo } from "react";
import { BankLogo } from "@/lib/bankLogos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartialPayment } from "@/pages/Index";

interface AmortizationTableProps {
  computedOffers: ComputedOffer[];
  termYears: number;
  partialPayments: PartialPayment[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

const AmortizationTable = ({ computedOffers, termYears, partialPayments }: AmortizationTableProps) => {
  const [selectedYear, setSelectedYear] = useState(1);
  const hasPayments = partialPayments.length > 0 && partialPayments.some(p => p.amount > 0);

  // Recalculate schedules with partial payments
  const adjustedSchedules = useMemo(() => {
    if (!hasPayments) {
      return computedOffers.map(co => ({ offer: co.offer, schedule: co.schedule }));
    }

    return computedOffers.map(co => {
      const offer = co.offer;
      const termMonths = termYears * 12;
      const bonifiedTIN = calcBonifiedTIN(offer);
      let balance = co.schedule[0]?.remainingBalance ? (co.schedule[0].payment + co.schedule[0].remainingBalance - (co.schedule[0].payment - co.schedule[0].interest)) : 0;
      // Start from loan amount
      balance = co.schedule.length > 0 ? co.schedule[0].remainingBalance + co.schedule[0].principal : 0;

      const rows: typeof co.schedule = [];
      let currentRate = -1;
      let payment = 0;

      for (let m = 1; m <= termMonths; m++) {
        if (balance <= 0) break;

        // Apply partial payment at start of year
        if (m % 12 === 1 || m === 1) {
          const yr = Math.ceil(m / 12);
          const partial = partialPayments.filter(p => p.year === yr).reduce((s, p) => s + p.amount, 0);
          if (partial > 0) balance = Math.max(balance - partial, 0);
          if (balance <= 0) break;
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
        const principal = payment - interest;
        balance = Math.max(balance - principal, 0);
        rows.push({ month: m, year: Math.ceil(m / 12), payment, interest, principal, remainingBalance: balance });
      }

      return { offer: co.offer, schedule: rows };
    });
  }, [computedOffers, partialPayments, hasPayments, termYears]);

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          {hasPayments && (
            <p className="text-xs text-primary font-medium">📊 Cuadro ajustado con pagos parciales</p>
          )}
        </div>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: termYears }, (_, i) => i + 1).map((y) => (
              <SelectItem key={y} value={String(y)}>Año {y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue={computedOffers[0]?.offer.id}>
        <TabsList className="mb-4">
          {adjustedSchedules.map((item) => (
            <TabsTrigger key={item.offer.id} value={item.offer.id} className="text-xs">
              <BankLogo bankName={item.offer.bankName} logoColor={item.offer.logoColor} size="sm" />
            </TabsTrigger>
          ))}
        </TabsList>
        {adjustedSchedules.map((item) => {
          const yearRows = item.schedule.filter((r) => r.year === selectedYear);
          const annualInterest = yearRows.reduce((s, r) => s + r.interest, 0);
          const annualPrincipal = yearRows.reduce((s, r) => s + r.principal, 0);

          // Check if a partial payment applies this year
          const partialThisYear = partialPayments.filter(p => p.year === selectedYear).reduce((s, p) => s + p.amount, 0);

          return (
            <TabsContent key={item.offer.id} value={item.offer.id}>
              {partialThisYear > 0 && (
                <p className="text-xs text-primary mb-2 bg-primary/5 rounded px-2 py-1">
                  💰 Amortización parcial aplicada este año: <strong>{fmt(partialThisYear)}</strong>
                </p>
              )}
              {yearRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Hipoteca ya cancelada en este año.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mes</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cuota</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Interés</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amortización</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Saldo pendiente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearRows.map((r) => (
                        <tr key={r.month} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-3 py-2 text-card-foreground">{r.month}</td>
                          <td className="px-3 py-2 text-right text-card-foreground">{fmt(r.payment)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{fmt(r.interest)}</td>
                          <td className="px-3 py-2 text-right text-card-foreground">{fmt(r.principal)}</td>
                          <td className="px-3 py-2 text-right text-card-foreground">{fmt(r.remainingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/30 font-medium">
                        <td className="px-3 py-2 text-card-foreground">Total año</td>
                        <td className="px-3 py-2 text-right text-card-foreground">{fmt(yearRows.reduce((s, r) => s + r.payment, 0))}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{fmt(annualInterest)}</td>
                        <td className="px-3 py-2 text-right text-card-foreground">{fmt(annualPrincipal)}</td>
                        <td className="px-3 py-2 text-right text-card-foreground">{fmt(yearRows[yearRows.length - 1]?.remainingBalance ?? 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AmortizationTable;
