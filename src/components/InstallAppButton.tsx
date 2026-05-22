import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true);

const InstallAppButton = ({
  variant = "outline",
  size = "sm",
  className,
  label = "Descargar app",
}: Props) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("App instalada correctamente");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setDeferred(null);
      }
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Button>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar la app</DialogTitle>
            <DialogDescription>
              Añade Trioteca a tu pantalla de inicio para abrirla como una app
              nativa.
            </DialogDescription>
          </DialogHeader>
          {isIOS() ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium">En iPhone / iPad (Safari):</p>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>
                  Toca el icono{" "}
                  <Share className="inline h-4 w-4 align-text-bottom" />{" "}
                  <strong>Compartir</strong> en la barra inferior.
                </li>
                <li>
                  Desplázate y elige{" "}
                  <strong>"Añadir a pantalla de inicio"</strong>.
                </li>
                <li>Confirma pulsando <strong>"Añadir"</strong>.</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="font-medium">En Android (Chrome):</p>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>Abre el menú ⋮ del navegador.</li>
                <li>
                  Pulsa <strong>"Instalar app"</strong> o{" "}
                  <strong>"Añadir a pantalla de inicio"</strong>.
                </li>
                <li>Confirma para finalizar la instalación.</li>
              </ol>
              <p className="font-medium pt-2">En ordenador:</p>
              <p className="text-muted-foreground">
                Pulsa el icono de instalación en la barra de direcciones de tu
                navegador (Chrome, Edge o Brave).
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;