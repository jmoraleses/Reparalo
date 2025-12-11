import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SolicitudCard } from "@/components/solicitudes/SolicitudCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const featuredSolicitudes = [
  {
    id: "1",
    deviceName: "Apple iPhone 14 Pro",
    deviceType: "Smartphone",
    problem: "La pantalla muestra líneas verticales y no responde al tacto en algunas zonas.",
    city: "Madrid",
    status: "esperando_ofertas" as const,
  },
  {
    id: "2",
    deviceName: "MacBook Pro 2021",
    deviceType: "Portátil",
    problem: "Se apaga solo después de 10 minutos de uso. Se calienta mucho.",
    city: "Barcelona",
    status: "en_reparacion" as const,
  },
  {
    id: "3",
    deviceName: "Samsung Galaxy S23",
    deviceType: "Smartphone",
    problem: "La batería dura muy poco, necesita cambio.",
    city: "Valencia",
    status: "esperando_ofertas" as const,
  },
];

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <HowItWorks />
      
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Solicitudes recientes</h2>
              <p className="text-muted-foreground">Dispositivos que necesitan reparación</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/solicitudes">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSolicitudes.map((solicitud) => (
              <SolicitudCard key={solicitud.id} {...solicitud} />
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-secondary-foreground mb-4">
              ¿Eres profesional de reparaciones?
            </h2>
            <p className="text-secondary-foreground/80 mb-8">
              Únete a nuestra red de talleres verificados y accede a clientes que necesitan tus servicios.
            </p>
            <Button asChild size="lg">
              <Link to="/auth?tipo=profesional">
                Registrar mi taller
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">RepairHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 RepairHub. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
