import { useState, useRef, useCallback } from "react";
import { Offer, Linkage } from "@/data/mortgageData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Building2, Upload, FileCheck, Loader2, ClipboardPaste, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ExternalOfferFormProps {
  onAddOffer: (offer: Offer) => void;
}

const COLORS = [
  "hsl(280, 60%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(170, 60%, 40%)",
  "hsl(50, 80%, 45%)",
  "hsl(100, 50%, 40%)",
];
let colorIndex = 0;

const ExternalOfferForm = ({ onAddOffer }: ExternalOfferFormProps) => {
  const [open, setOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [type, setType] = useState<"Fijo" | "Mixto" | "Variable">("Fijo");
  const [baseTIN, setBaseTIN] = useState("");
  const [amortFeePct, setAmortFeePct] = useState("0");
  const [linkages, setLinkages] = useState<{ label: string; weight: string; cost: string }[]>([]);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [extractionDone, setExtractionDone] = useState(false);
  const [aiConfirmed, setAiConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLinkage = () => {
    setLinkages((prev) => [...prev, { label: "", weight: "0", cost: "0" }]);
  };

  const removeLinkage = (idx: number) => {
    setLinkages((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLinkage = (idx: number, field: string, value: string) => {
    setLinkages((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const applyExtractedData = (data: any) => {
    setBankName(data.bank_name || "");
    setType(data.type || "Fijo");
    setBaseTIN(String(data.base_tin ?? ""));
    setAmortFeePct(String(data.amortization_fee_pct ?? "0"));

    if (data.linkages?.length) {
      setLinkages(
        data.linkages.map((l: any) => ({
          label: l.label || "",
          weight: String(l.discount_weight_pct ?? "0"),
          cost: String(l.annual_cost ?? "0"),
        }))
      );
    }

    setExtractionDone(true);
    setAiConfirmed(false);
    toast({ title: "Datos extraídos", description: `Banco: ${data.bank_name}` });
  };

  const callExtraction = useCallback(async (body: Record<string, string>) => {
    setPdfParsing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/parse-offer-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Error al procesar");
      }

      const { data } = await res.json();
      applyExtractedData(data);
    } catch (err: any) {
      toast({ title: "Error al extraer datos", description: err.message, variant: "destructive" });
      setPdfFileName(null);
    } finally {
      setPdfParsing(false);
    }
  }, []);

  const handlePdfFile = useCallback(async (file: File) => {
    if (!file.type.includes("pdf")) {
      toast({ title: "Solo se aceptan archivos PDF", variant: "destructive" });
      return;
    }
    setPdfFileName(file.name);
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    await callExtraction({ pdf_base64: base64 });
  }, [callExtraction]);

  const handleTextExtract = useCallback(async () => {
    if (!textContent.trim()) return;
    await callExtraction({ text_content: textContent });
  }, [textContent, callExtraction]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handlePdfFile(file);
    },
    [handlePdfFile]
  );

  const handleSubmit = () => {
    if (!bankName || !baseTIN) return;

    const id = `ext-${Date.now()}`;
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;

    const offerLinkages: Linkage[] = linkages
      .filter((l) => l.label.trim())
      .map((l, i) => ({
        id: `${id}-link-${i}`,
        label: l.label,
        isActive: true,
        discountWeightPct: parseFloat(l.weight) || 0,
        annualCostEUR: parseFloat(l.cost) || 0,
      }));

    const totalDiscount = offerLinkages
      .filter((l) => l.isActive)
      .reduce((s, l) => s + l.discountWeightPct, 0);

    const offer: Offer = {
      id,
      bankName: "Oferta externa",
      logoColor: color,
      type,
      baseTIN: (parseFloat(baseTIN) || 0) + totalDiscount,
      amortizationFeePct: parseFloat(amortFeePct) || 0,
      upfrontCostsEUR: 0,
      monthlyAccountCostEUR: 0,
      linkages: offerLinkages,
      advantages: [],
      considerations: [],
      isExternal: true,
    };

    onAddOffer(offer);
    setBankName("");
    setBaseTIN("");
    setAmortFeePct("0");
    setLinkages([]);
    setPdfFileName(null);
    setTextContent("");
    setExtractionDone(false);
    setAiConfirmed(false);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary/50 hover:bg-muted/30 transition-all group"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Building2 className="h-8 w-8" />
          <span className="font-medium text-sm">Incorporar ofertas por fuera de Trioteca</span>
          <span className="text-xs">Arrastra un PDF o introduce los datos a mano para comparar</span>
        </div>
      </button>
    );
  }

  const canSubmit = bankName && baseTIN && (!extractionDone || aiConfirmed);

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-card-foreground">
          Incorporar oferta externa
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>

      {/* Extraction: PDF or Text */}
      <Tabs defaultValue="pdf" className="mb-5">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="pdf" className="text-xs gap-1"><Upload className="h-3.5 w-3.5" /> PDF</TabsTrigger>
          <TabsTrigger value="text" className="text-xs gap-1"><ClipboardPaste className="h-3.5 w-3.5" /> Pegar texto</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              pdfParsing
                ? "border-primary/50 bg-primary/5"
                : pdfFileName
                ? "border-primary/40 bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfFile(file);
              }}
            />
            {pdfParsing ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-medium">Extrayendo datos del PDF...</span>
              </div>
            ) : pdfFileName ? (
              <div className="flex flex-col items-center gap-1 text-primary">
                <FileCheck className="h-6 w-6" />
                <span className="text-xs font-medium">{pdfFileName}</span>
                <span className="text-[10px] text-muted-foreground">Datos pre-rellenados. Ajusta lo que necesites.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-xs font-medium">Arrastra tu PDF de oferta bancaria aquí</span>
                <span className="text-[10px]">o haz clic para seleccionarlo</span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="space-y-2">
            <Textarea
              placeholder="Pega aquí el texto de la oferta bancaria (email, WhatsApp, web…)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={4}
              className="text-xs"
            />
            <Button
              size="sm"
              className="w-full gap-1"
              disabled={!textContent.trim() || pdfParsing}
              onClick={handleTextExtract}
            >
              {pdfParsing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extrayendo datos…</>
              ) : (
                <><ClipboardPaste className="h-3.5 w-3.5" /> Extraer datos del texto</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Disclaimer */}
      {extractionDone && (
        <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-foreground mb-2">
            🤖 <strong>¡Ojo!</strong> Verifica que los datos extraídos son correctos. Como buena IA, a veces me invento cosas con mucha convicción.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={aiConfirmed}
              onCheckedChange={(v) => setAiConfirmed(v === true)}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <span className="text-xs text-muted-foreground">He verificado que los datos son correctos</span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <Label className="text-xs text-muted-foreground">Banco</Label>
          <Input
            placeholder="Nombre del banco"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fijo">Fijo</SelectItem>
              <SelectItem value="Mixto">Mixto</SelectItem>
              <SelectItem value="Variable">Variable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">TIN base (%)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ej: 2.80"
            value={baseTIN}
            onChange={(e) => setBaseTIN(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Comisión amortización (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Ej: 0"
            value={amortFeePct}
            onChange={(e) => setAmortFeePct(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Bonificaciones</Label>
          <Button variant="outline" size="sm" onClick={addLinkage} className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" /> Añadir
          </Button>
        </div>
        {linkages.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Sin bonificaciones. Pulsa "Añadir" para incluir seguros, nómina, etc.</p>
        )}
        <div className="space-y-2">
          {linkages.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end">
              <div>
                <Input
                  placeholder="Nombre (ej: Seguro Hogar)"
                  value={l.label}
                  onChange={(e) => updateLinkage(i, "label", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Peso (pp)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.15"
                  value={l.weight}
                  onChange={(e) => updateLinkage(i, "weight", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">€/año</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="350"
                  value={l.cost}
                  onChange={(e) => updateLinkage(i, "cost", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeLinkage(i)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
        Añadir a la comparativa
      </Button>
    </div>
  );
};

export default ExternalOfferForm;
