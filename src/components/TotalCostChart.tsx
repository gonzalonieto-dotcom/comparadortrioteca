import { Oferta } from "@/data/mockOffers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TotalCostChartProps {
  ofertas: Oferta[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const TotalCostChart = ({ ofertas }: TotalCostChartProps) => {
  const data = [...ofertas]
    .sort((a, b) => a.costeTotalAproximado - b.costeTotalAproximado)
    .map((o) => ({
      name: o.banco,
      coste: o.costeTotalAproximado,
      fill: o.esRecomendada ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
    }));

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Coste total aproximado
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Intereses + bonificaciones obligatorias (1er año). Cuanto más baja la barra, menor coste.
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 13, fill: "hsl(var(--card-foreground))", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Coste total"]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            />
            <Bar dataKey="coste" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TotalCostChart;
