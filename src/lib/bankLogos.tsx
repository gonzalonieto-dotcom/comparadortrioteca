import { useState } from "react";

/** Map of bank names → logo URLs (using favicon service as fallback) */
export const BANK_LOGOS: Record<string, string> = {
  CaixaBank: "https://www.caixabank.es/deployedfiles/caixabank_com/Estaticos/Imagenes/favicon.ico",
  BBVA: "https://www.bbva.es/content/dam/public-web/global/images/logos/bbva_logo_72.png",
  Ibercaja: "https://www.ibercaja.es/favicon.ico",
  Kutxabank: "https://www.kutxabank.es/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1365522492498&ssbinary=true",
  Bankinter: "https://www.bankinter.com/favicon.ico",
  Santander: "https://www.bancosantander.es/favicon.ico",
  Sabadell: "https://www.bancsabadell.com/favicon.ico",
  Unicaja: "https://www.unicaja.es/favicon.ico",
  ING: "https://www.ing.es/favicon.ico",
  Openbank: "https://www.openbank.es/favicon.ico",
  EVO: "https://www.evobanco.com/favicon.ico",
  Abanca: "https://www.abanca.com/favicon.ico",
  UCI: "https://www.uci.com/favicon.ico",
  "Global Caja": "https://www.globalcaja.es/favicon.ico",
  "Laboral Kutxa": "https://www.laboralkutxa.com/favicon.ico",
  "Caixa Popular": "https://www.caixapopular.es/favicon.ico",
  MyInvestor: "https://myinvestor.es/favicon.ico",
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
