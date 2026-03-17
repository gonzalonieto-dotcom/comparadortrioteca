import { useState, useCallback } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileText, ClipboardPaste } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { OfferFormData } from "./OfferEditor";
import type { LinkageFormData } from "./LinkageEditor";

type Status = "idle" | "dragging" | "processing" | "done" | "error";

interface Props {
  onExtracted: (data: Partial<OfferFormData>) => void;
}

/** Fuzzy-match an extracted label to the closest preset linkage label */
function matchLinkageLabel(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (lower.includes("nómina") || lower.includes("nomina") || lower.includes("recibo")) {
    return "Domiciliación de nómina";
  }
  if (lower.includes("hogar") || lower.includes("multirriesgo")) {
    return "Seguro hogar";
  }
  if (lower.includes("vida")) {
    return "Seguro de vida";
  }
  return null;
}

function mapExtracted(extracted: any): Partial<OfferFormData> {
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
    // Build a map keyed by label to aggregate values; fuzzy-match presets
    const map = new Map<string, LinkageFormData>();
    for (const l of extracted.linkages) {
      const matched = matchLinkageLabel(l.label) || l.label;
      const existing = map.get(matched);
      if (existing) {
        existing.discount_weight_pct += l.discount_weight_pct ?? 0;
        existing.annual_cost += l.annual_cost ?? 0;
      } else {
        map.set(matched, {
          label: matched,
          is_active_default: true,
          discount_weight_pct: l.discount_weight_pct ?? 0,
          annual_cost: l.annual_cost ?? 0,
        });
      }
    }
    patch.linkages = Array.from(map.values());
  }

  if (extracted.mixed_periods?.length) {
    patch.mixedPeriods = extracted.mixed_periods.map((m: any) => ({
      from_year: m.from_year,
      to_year: m.to_year,
      fixed_tin: m.fixed_tin ?? null,
      spread_over_euribor: m.spread_over_euribor ?? null,
    }));
  }

  return patch;
}

const PdfDropZone = ({ onExtracted }: Props) => {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [tab, setTab] = useState<string>("pdf");

  const handleExtraction = useCallback(async (body: Record<string, string>) => {
    setStatus("processing");
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("parse-offer-pdf", { body });
      if (error) throw new Error(error.message || "Error al procesar");
      if (data?.error) throw new Error(data.error);
      const extracted = data?.data;
      if (!extracted) throw new Error("No se recibieron datos");

      setStatus("done");
      onExtracted(mapExtracted(extracted));
    } catch (e: any) {
      console.error("Extraction error:", e);
      setStatus("error");
      setErrorMsg(e.message || "Error desconocido");
    }
  }, [onExtracted]);

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
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    await handleExtraction({ pdf_base64: base64 });
  }, [handleExtraction]);

  const handleTextSubmit = useCallback(async () => {
    if (!textContent.trim()) return;
    setFileName("");
    await handleExtraction({ text_content: textContent });
  }, [textContent, handleExtraction]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
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
      ? "border-primary/50 bg-primary/5"
      : status === "error"
      ? "border-destructive bg-destructive/5"
      : "border-muted-foreground/25 hover:border-primary/50";

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2 h-8">
        <TabsTrigger value="pdf" className="text-xs gap-1"><FileUp className="h-3.5 w-3.5" /> PDF</TabsTrigger>
        <TabsTrigger value="text" className="text-xs gap-1"><ClipboardPaste className="h-3.5 w-3.5" /> Pegar texto</TabsTrigger>
      </TabsList>

      <TabsContent value="pdf">
        <label
          className={`relative flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors ${borderColor}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (status !== "processing") setStatus("dragging");
          }}
          onDragLeave={() => {
            if (status === "dragging") setStatus(fileName ? "done" : "idle");
          }}
          onDrop={handleDrop}
        >
          <input type="file" accept=".pdf" className="sr-only" onChange={handleFileInput} />
          {status === "processing" && tab === "pdf" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Extrayendo datos del PDF…</span>
            </>
          ) : status === "done" && fileName ? (
            <>
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {fileName}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">Arrastra otro para reemplazar</span>
            </>
          ) : status === "error" && tab === "pdf" ? (
            <>
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-xs text-destructive">{errorMsg}</span>
            </>
          ) : (
            <>
              <FileUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Arrastra un PDF de oferta bancaria o haz clic para seleccionar
              </span>
            </>
          )}
        </label>
      </TabsContent>

      <TabsContent value="text">
        <div className="space-y-2">
          <Textarea
            placeholder="Pega aquí el texto de la oferta bancaria (email, WhatsApp, web…)"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={5}
            className="text-xs"
          />
          <Button
            size="sm"
            className="w-full gap-1"
            disabled={!textContent.trim() || status === "processing"}
            onClick={handleTextSubmit}
          >
            {status === "processing" && tab === "text" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extrayendo datos…</>
            ) : (
              <><ClipboardPaste className="h-3.5 w-3.5" /> Extraer datos del texto</>
            )}
          </Button>
          {status === "done" && tab === "text" && (
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Datos extraídos correctamente
            </p>
          )}
          {status === "error" && tab === "text" && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PdfDropZone;
