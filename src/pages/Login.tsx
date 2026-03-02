import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import triotecaLogo from "@/assets/trioteca-logo.svg";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu email para confirmar.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/admin");
      }
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={triotecaLogo} alt="Trioteca" className="h-8 mx-auto mb-4" />
          <CardTitle className="text-xl">{isSignUp ? "Crear cuenta" : "Acceso gestores"}</CardTitle>
          <CardDescription>
            {isSignUp ? "Regístrate para gestionar operaciones" : "Inicia sesión con tu cuenta de gestor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
          <div className="mt-4 p-3 rounded-md bg-muted text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Credenciales de prueba (gestor):</p>
            <p>Email: <code className="bg-background px-1 rounded">gestor@trioteca.test</code></p>
            <p>Pass: <code className="bg-background px-1 rounded">gestor123</code></p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => { setEmail("gestor@trioteca.test"); setPassword("gestor123"); }}
            >
              Rellenar credenciales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
