import { ComputedOffer, YearlyCumulativeCost, calcCumulativeCostByYear } from "@/lib/mortgageCalc";
import { OperationDefaults } from "@/data/mortgageData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CumulativeCostChartProps {
  computedOffers: ComputedOffer[];
  defaults: OperationDefaults;
  inflationRate?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const COLORS: Record<string, string> = {
  santander: "hsl(0, 80%, 50%)",
  caixabank: "hsl(200, 70%, 40%)",
  bankinter: "hsl(25, 90%, 50%)",
  ibercaja: "hsl(340, 75%, 45%)",
};

const CumulativeCostChart = ({ computedOffers, defaults, inflationRate }: CumulativeCostChartProps) => {
  const data = calcCumulativeCostByYear(computedOffers, defaults, inflationRate);

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Coste acumulado por año
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Intereses + bonificaciones + otros costes. La línea más baja = menor coste total.
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <defs>
              {computedOffers.map((co) => (
                <linearGradient key={co.offer.id} id={`gradient-${co.offer.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[co.offer.id] ?? co.offer.logoColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[co.offer.id] ?? co.offer.logoColor} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Año", position: "insideBottomRight", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const co = computedOffers.find((c) => c.offer.id === name);
                return [fmt(value), co?.offer.bankName ?? name];
              }}
              labelFormatter={(l) => `Año ${l}`}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            />
            <Legend
              formatter={(value) => {
                const co = computedOffers.find((c) => c.offer.id === value);
                return co?.offer.bankName ?? value;
              }}
            />
            {computedOffers.map((co) => (
              <Area
                key={co.offer.id}
                type="monotone"
                dataKey={co.offer.id}
                stroke={COLORS[co.offer.id] ?? co.offer.logoColor}
                strokeWidth={2}
                fill={`url(#gradient-${co.offer.id})`}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CumulativeCostChart;
