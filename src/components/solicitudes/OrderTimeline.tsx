import { Clock, CheckCircle, Wrench, Truck, CircleDot, Search, FileText, Send, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
}

const statusOrder = [
  "esperando_ofertas",
  "oferta_seleccionada",
  "en_camino_taller",
  "diagnostico",
  "presupuesto_final",
  "en_reparacion",
  "reparado",
  "en_camino_cliente",
  "completado"
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  const steps: TimelineStep[] = [
    {
      id: "esperando_ofertas",
      label: "Esperando ofertas",
      description: "Los talleres pueden enviarte presupuestos",
      icon: Clock,
      completed: currentIndex > 0,
      current: currentStatus === "esperando_ofertas",
    },
    {
      id: "oferta_seleccionada",
      label: "Oferta aceptada",
      description: "Has seleccionado un taller para la reparación",
      icon: CheckCircle,
      completed: currentIndex > 1,
      current: currentStatus === "oferta_seleccionada",
    },
    {
      id: "en_camino_taller",
      label: "En camino al taller",
      description: "Tu dispositivo está siendo enviado al taller",
      icon: Truck,
      completed: currentIndex > 2,
      current: currentStatus === "en_camino_taller",
    },
    {
      id: "diagnostico",
      label: "En diagnóstico",
      description: "El taller está analizando tu dispositivo",
      icon: Search,
      completed: currentIndex > 3,
      current: currentStatus === "diagnostico",
    },
    {
      id: "presupuesto_final",
      label: "Presupuesto final",
      description: "El taller ha enviado el coste final de reparación",
      icon: FileText,
      completed: currentIndex > 4,
      current: currentStatus === "presupuesto_final",
    },
    {
      id: "en_reparacion",
      label: "En reparación",
      description: "Tu dispositivo está siendo reparado",
      icon: Wrench,
      completed: currentIndex > 5,
      current: currentStatus === "en_reparacion",
    },
    {
      id: "reparado",
      label: "Reparado",
      description: "La reparación ha sido completada",
      icon: CircleDot,
      completed: currentIndex > 6,
      current: currentStatus === "reparado",
    },
    {
      id: "en_camino_cliente",
      label: "En camino de vuelta",
      description: "Tu dispositivo está siendo devuelto",
      icon: Send,
      completed: currentIndex > 7,
      current: currentStatus === "en_camino_cliente",
    },
    {
      id: "completado",
      label: "Completado",
      description: "¡Reparación finalizada con éxito!",
      icon: ThumbsUp,
      completed: currentIndex >= 8,
      current: currentStatus === "completado",
    },
  ];

  return (
    <div className="space-y-1">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                step.current
                  ? "bg-primary text-primary-foreground"
                  : step.completed
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 h-6 mt-1",
                  step.completed ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
          <div className="pt-1 pb-2">
            <p
              className={cn(
                "font-medium text-sm",
                step.current
                  ? "text-foreground"
                  : step.completed
                    ? "text-foreground/80"
                    : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
            {step.current && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}