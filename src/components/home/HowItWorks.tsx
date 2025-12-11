import { Plus, Package, Star, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Plus,
    title: "Crea tu solicitud",
    description: "Describe tu dispositivo y el problema",
    color: "bg-primary",
  },
  {
    icon: Package,
    title: "Recibe ofertas",
    description: "Los talleres te envían presupuestos",
    color: "bg-purple-500",
  },
  {
    icon: Star,
    title: "Elige el mejor",
    description: "Compara precios y valoraciones",
    color: "bg-orange-500",
  },
  {
    icon: CheckCircle,
    title: "Repara y valora",
    description: "Pago seguro y protección garantizada",
    color: "bg-green-500",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 bg-card">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} mb-4`}>
                <step.icon className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
