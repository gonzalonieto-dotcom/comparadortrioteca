import { useState } from "react";

/** Map of bank names → logo URLs (using favicon service as fallback) */
export const BANK_LOGOS: Record<string, string> = {
  CaixaBank: "https://www.google.com/s2/favicons?domain=caixabank.es&sz=64",
  BBVA: "https://www.google.com/s2/favicons?domain=bbva.es&sz=64",
  Ibercaja: "https://www.google.com/s2/favicons?domain=ibercaja.es&sz=64",
  Kutxabank: "https://www.google.com/s2/favicons?domain=kutxabank.es&sz=64",
  Bankinter: "https://www.google.com/s2/favicons?domain=bankinter.com&sz=64",
  Santander: "https://www.google.com/s2/favicons?domain=bancosantander.es&sz=64",
  Sabadell: "https://www.google.com/s2/favicons?domain=bancsabadell.com&sz=64",
  Unicaja: "https://www.google.com/s2/favicons?domain=unicaja.es&sz=64",
  ING: "https://www.google.com/s2/favicons?domain=ing.es&sz=64",
  Openbank: "https://www.google.com/s2/favicons?domain=openbank.es&sz=64",
  EVO: "https://www.google.com/s2/favicons?domain=evobanco.com&sz=64",
  Abanca: "https://www.google.com/s2/favicons?domain=abanca.com&sz=64",
  UCI: "https://www.google.com/s2/favicons?domain=uci.com&sz=64",
  "Global Caja": "https://www.google.com/s2/favicons?domain=globalcaja.es&sz=64",
  "Laboral Kutxa": "https://www.google.com/s2/favicons?domain=laboralkutxa.com&sz=64",
  "Caixa Popular": "https://www.google.com/s2/favicons?domain=caixapopular.es&sz=64",
  MyInvestor: "https://www.google.com/s2/favicons?domain=myinvestor.es&sz=64",
};

interface BankLogoProps {
  bankName: string;
  logoColor?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const SIZES = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
const TEXT_SIZES = { sm: "text-xs", md: "text-sm", lg: "text-base" };

/**
 * Renders a bank logo image if available, otherwise falls back to color dot + name.
 * For "Oferta externa" always shows dot + text.
 */
export const BankLogo = ({ bankName, logoColor, size = "md", showName = true, className = "" }: BankLogoProps) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = BANK_LOGOS[bankName];
  const isExternal = bankName === "Oferta externa";

  if (!isExternal && logoUrl && !imgError) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <img
          src={logoUrl}
          alt={bankName}
          className={`${SIZES[size]} object-contain rounded-sm`}
          onError={() => setImgError(true)}
        />
        {showName && <span className={`font-medium text-card-foreground ${TEXT_SIZES[size]}`}>{bankName}</span>}
      </span>
    );
  }

  // Fallback: color dot + text
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`${SIZES[size]} rounded-full flex-shrink-0 inline-block`}
        style={{ backgroundColor: logoColor || "hsl(var(--muted-foreground))" }}
      />
      {showName && <span className={`font-medium text-card-foreground ${TEXT_SIZES[size]}`}>{bankName}</span>}
    </span>
  );
};
