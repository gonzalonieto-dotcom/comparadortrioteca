import { OperationDefaults } from "@/data/mortgageData";
import { Home, Calendar, Banknote } from "lucide-react";

interface LoanHeaderProps {
  defaults: OperationDefaults;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const LoanHeader = ({ defaults }: LoanHeaderProps) => {
  const ltc = ((defaults.loanAmount / defaults.purchasePrice) * 100).toFixed(0);
  return (
    <div className="bg-card rounded-xl border p-6 md:p-8">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Tu operación</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Importe del préstamo</p>
            <p className="text-xl font-semibold text-card-foreground">{fmt(defaults.loanAmount)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Precio vivienda / LTC</p>
            <p className="text-xl font-semibold text-card-foreground">
              {fmt(defaults.purchasePrice)}{" "}
              <span className="text-base font-normal text-muted-foreground">({ltc} %)</span>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plazo</p>
            <p className="text-xl font-semibold text-card-foreground">
              {defaults.termYears} años{" "}
              <span className="text-base font-normal text-muted-foreground">({defaults.termYears * 12} meses)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanHeader;
