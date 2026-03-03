import { useState, useCallback } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OfferFormData } from "./OfferEditor";
import type { LinkageFormData } from "./LinkageEditor";

type Status = "idle" | "dragging" | "processing" | "done" | "error";

interface Props {
  onExtracted: (data: Partial<OfferFormData>) => void;
}

const PdfDropZone = ({ onExtracted }: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMsg("Solo se aceptan archivos PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("El archivo excede 10 MB");
      return;
    }

    setStatus("processing");
    setErrorMsg("");

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("parse-offer-pdf", {
        body: { pdf_base64: base64 },
      });

      if (error) throw new Error(error.message || "Error al procesar");
      if (data?.error) throw new Error(data.error);

      const extracted = data?.data;
      if (!extracted) throw new Error("No se recibieron datos");

      // Map to OfferFormData
      const patch: Partial<OfferFormData> = {
        bank_name: extracted.bank_name || "",
        type: extracted.type || "Fijo",
        base_tin: extracted.base_tin ?? 0,
        amortization_fee_pct: extracted.amortization_fee_pct ?? 0,
        upfront_costs: extracted.upfront_costs ?? 0,
        monthly_account_cost: extracted.monthly_account_cost ?? 0,
        euribor_rate: extracted.euribor_rate ?? null,
        advantages: extracted.advantages ?? [],
      };

      if (extracted.linkages?.length) {
        patch.linkages = extracted.linkages.map((l: any): LinkageFormData => ({
          label: l.label,
          is_active_default: true,
          discount_weight_pct: l.discount_weight_pct ?? 0,
          annual_cost: l.annual_cost ?? 0,
        }));
      }

      if (extracted.mixed_periods?.length) {
        patch.mixedPeriods = extracted.mixed_periods.map((m: any) => ({
          from_year: m.from_year,
          to_year: m.to_year,
          fixed_tin: m.fixed_tin ?? null,
          spread_over_euribor: m.spread_over_euribor ?? null,
        }));
      }

      setStatus("done");
      onExtracted(patch);

      // Reset after 3s
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      console.error("PDF extraction error:", e);
      setStatus("error");
      setErrorMsg(e.message || "Error desconocido");
    }
  }, [onExtracted]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setStatus("idle");
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const borderColor =
    status === "dragging"
      ? "border-primary bg-primary/5"
      : status === "processing"
      ? "border-muted-foreground/40"
      : status === "done"
      ? "border-primary bg-primary/5"
      : status === "error"
      ? "border-destructive bg-destructive/5"
      : "border-muted-foreground/25 hover:border-primary/50";

  return (
    <label
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors ${borderColor}`}
      onDragOver={(e) => {
        e.preventDefault();
        setStatus("dragging");
      }}
      onDragLeave={() => setStatus("idle")}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={handleFileInput}
      />

      {status === "processing" ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Extrayendo datos del PDF…</span>
        </>
      ) : status === "done" ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <span className="text-xs text-primary">Datos extraídos — revisa y ajusta</span>
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="h-6 w-6 text-destructive" />
          <span className="text-xs text-destructive">{errorMsg}</span>
        </>
      ) : (
        <>
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Arrastra un PDF de oferta bancaria o haz clic para seleccionar
          </span>
        </>
      )}
    </label>
  );
};

export default PdfDropZone;
