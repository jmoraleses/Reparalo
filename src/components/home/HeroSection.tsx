import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary py-20 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/20" />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-secondary-foreground sm:text-5xl lg:text-6xl">
            Repara tu dispositivo con{" "}
            <span className="text-primary">profesionales verificados</span>
          </h1>
          <p className="mt-6 text-lg text-secondary-foreground/80">
            Conectamos clientes con talleres especializados. Envía tu dispositivo, 
            recibe presupuestos y paga de forma segura con nuestro sistema de escrow.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/nueva-solicitud">
                Publicar solicitud
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/20">
              <Link to="/solicitudes">
                Ver solicitudes
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-secondary-foreground/10 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Pago seguro</h3>
              <p className="text-sm text-secondary-foreground/70">Sistema Escrow protegido</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-secondary-foreground/10 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1">
              <Truck className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Envío incluido</h3>
              <p className="text-sm text-secondary-foreground/70">Etiquetas prepagadas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-secondary-foreground/10 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              <Star className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-foreground">Talleres verificados</h3>
              <p className="text-sm text-secondary-foreground/70">Profesionales de confianza</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
