import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres").max(100),
  fullName: z.string().max(100).optional(),
});

// Demo credentials
const DEMO_ACCOUNTS = {
  cliente: { email: "cliente_v4@demo.com", password: "demo12134" },
  profesional: { email: "taller_v4@demo.com", password: "demo1234" },
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultType = searchParams.get("tipo") === "profesional" ? "profesional" : "cliente";

  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(false); // Default to signup mode
  const [userType, setUserType] = useState<"cliente" | "profesional">(defaultType as "cliente" | "profesional");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update demo credentials when user type changes (only for login)
  const handleDemoTypeChange = (type: "cliente" | "profesional") => {
    setUserType(type);
    if (isLogin) {
      setEmail(DEMO_ACCOUNTS[type].email);
      setPassword(DEMO_ACCOUNTS[type].password);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = authSchema.safeParse({
      email,
      password,
      fullName: isLogin ? undefined : fullName
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email o contraseña incorrectos");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("¡Bienvenido de nuevo!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName, userType === "profesional");
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Este email ya está registrado");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("¡Cuenta creada con éxito!");
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Accede a tu cuenta" : "Crea tu cuenta"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin
              ? "Bienvenido de nuevo, por favor introduce tus datos."
              : "Regístrate para empezar a usar RepairHub."}
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User type selector - always visible */}
          <div>
            <Label className="text-foreground mb-2 block">
              {isLogin ? "Acceder como" : "Tipo de cuenta"}
            </Label>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => handleDemoTypeChange("cliente")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  userType === "cliente"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => handleDemoTypeChange("profesional")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  userType === "profesional"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Taller / Profesional
              </button>
            </div>
            {isLogin && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Credenciales demo pre-rellenadas
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <Label htmlFor="fullName" className="text-foreground">
                {userType === "profesional" ? "Nombre del taller" : "Nombre completo"}
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder={userType === "profesional" ? "Nombre de tu taller" : "Tu nombre"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Introduce tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Contraseña</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Introduce tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground">
                  Recuérdame
                </Label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">
                He olvidado mi contraseña
              </a>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : (
              isLogin ? "Iniciar Sesión" : "Crear cuenta"
            )}
          </Button>
        </form>


        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">O continúa con</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full" disabled={isSubmitting}>
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button variant="outline" className="w-full" disabled={isSubmitting}>
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={() => {
              const newIsLogin = !isLogin;
              setIsLogin(newIsLogin);
              if (newIsLogin) {
                // Pre-fill demo credentials when switching to login
                setEmail(DEMO_ACCOUNTS[userType].email);
                setPassword(DEMO_ACCOUNTS[userType].password);
              } else {
                // Clear fields when switching to signup
                setEmail("");
                setPassword("");
                setFullName("");
              }
            }}
            className="text-primary hover:underline font-medium"
            disabled={isSubmitting}
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </Card>
    </div>
  );
}
