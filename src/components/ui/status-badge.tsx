import { cn } from "@/lib/utils";

type Status =
  | "esperando_ofertas"
  | "oferta_seleccionada"
  | "en_camino_taller"
  | "diagnostico"
  | "presupuesto_final"
  | "negociando"
  | "en_reparacion"
  | "reparado"
  | "en_camino_cliente"
  | "completado"
  | "cancelado";

const statusConfig: Record<Status, { label: string; className: string }> = {
  esperando_ofertas: {
    label: "Esperando ofertas",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  oferta_seleccionada: {
    label: "Oferta seleccionada",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  en_camino_taller: {
    label: "En camino al taller",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  diagnostico: {
    label: "En diagnóstico",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  presupuesto_final: {
    label: "Presupuesto final",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  negociando: {
    label: "Negociando",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  en_reparacion: {
    label: "En proceso",
    className: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  reparado: {
    label: "Reparado",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  en_camino_cliente: {
    label: "En camino",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
  completado: {
    label: "Completado",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`StatusBadge: Unknown status "${status}"`);
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800", className)}>
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export type { Status };
