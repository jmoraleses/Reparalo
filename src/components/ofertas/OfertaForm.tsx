import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

export interface OfertaData {
  id?: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  diagnosisCost: number;
  transportCost: number;
  estimatedDays: number;
  message?: string;
}

interface OfertaFormProps {
  solicitudId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: OfertaData | null;
  customerId?: string;
}

// Validation schema for offer form
const ofertaSchema = z.object({
  estimatedCostMin: z.number().min(0, "El precio mínimo debe ser mayor o igual a 0").max(100000, "El precio mínimo no puede superar 100,000€"),
  estimatedCostMax: z.number().min(0, "El precio máximo debe ser mayor o igual a 0").max(100000, "El precio máximo no puede superar 100,000€"),
  diagnosisCost: z.number().min(0, "El coste de diagnóstico debe ser mayor o igual a 0").max(10000, "El coste de diagnóstico no puede superar 10,000€"),
  transportCost: z.number().min(0, "El coste de transporte debe ser mayor o igual a 0").max(1000, "El coste de transporte no puede superar 1,000€"),
  estimatedDays: z.number().int("Los días deben ser un número entero").min(1, "Mínimo 1 día").max(365, "Máximo 365 días"),
  message: z.string().max(2000, "El mensaje no puede superar 2000 caracteres").optional(),
}).refine(data => data.estimatedCostMax >= data.estimatedCostMin, {
  message: "El precio máximo debe ser mayor o igual al mínimo",
  path: ["estimatedCostMax"],
});

export function OfertaForm({ solicitudId, onSuccess, onCancel, initialData, customerId }: OfertaFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    estimatedCostMin: initialData?.estimatedCostMin?.toString() || "",
    estimatedCostMax: initialData?.estimatedCostMax?.toString() || "",
    diagnosisCost: initialData?.diagnosisCost?.toString() || "",
    transportCost: initialData?.transportCost?.toString() || "",
    estimatedDays: initialData?.estimatedDays?.toString() || "",
    message: initialData?.message || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!user) {
      toast.error("Debes iniciar sesión para enviar una oferta");
      return;
    }

    // Parse and validate form data
    const parsedData = {
      estimatedCostMin: parseFloat(formData.estimatedCostMin) || 0,
      estimatedCostMax: parseFloat(formData.estimatedCostMax) || 0,
      diagnosisCost: parseFloat(formData.diagnosisCost) || 0,
      transportCost: parseFloat(formData.transportCost) || 0,
      estimatedDays: parseInt(formData.estimatedDays) || 0,
      message: formData.message || undefined,
    };

    const validation = ofertaSchema.safeParse(parsedData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Por favor, corrige los errores del formulario");
      return;
    }

    setLoading(true);

    try {
      if (initialData?.id) {
        // Update existing offer
        const { error } = await supabase
          .from("ofertas")
          .update({
            estimated_cost_min: validation.data.estimatedCostMin,
            estimated_cost_max: validation.data.estimatedCostMax,
            diagnosis_cost: validation.data.diagnosisCost,
            transport_cost: validation.data.transportCost,
            estimated_days: validation.data.estimatedDays,
            message: validation.data.message || null,
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success("¡Oferta actualizada con éxito!");
      } else {
        // Create new offer
        const { error } = await supabase.from("ofertas").insert({
          solicitud_id: solicitudId,
          workshop_id: user.id,
          estimated_cost_min: validation.data.estimatedCostMin,
          estimated_cost_max: validation.data.estimatedCostMax,
          diagnosis_cost: validation.data.diagnosisCost,
          transport_cost: validation.data.transportCost,
          estimated_days: validation.data.estimatedDays,
          message: validation.data.message || null,
        });

        if (error) throw error;
        toast.success("¡Oferta enviada con éxito!");

        // Send notification to customer
        if (customerId) {
          const { error: notifError } = await supabase.from("notifications").insert({
            user_id: customerId,
            type: "new_offer",
            title: "Nueva oferta recibida",
            message: `Un taller ha enviado una oferta para tu solicitud`,
            link: `/solicitudes/${solicitudId}`,
            read: false,
          });

          if (notifError) console.error("Error sending notification:", notifError);
        }
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la oferta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Enviar presupuesto</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estimatedCostMin">Precio mínimo (€)</Label>
            <Input
              id="estimatedCostMin"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              value={formData.estimatedCostMin}
              onChange={(e) => setFormData({ ...formData, estimatedCostMin: e.target.value })}
              required
              className="mt-1"
            />
            {errors.estimatedCostMin && (
              <p className="text-sm text-destructive mt-1">{errors.estimatedCostMin}</p>
            )}
          </div>
          <div>
            <Label htmlFor="estimatedCostMax">Precio máximo (€)</Label>
            <Input
              id="estimatedCostMax"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              value={formData.estimatedCostMax}
              onChange={(e) => setFormData({ ...formData, estimatedCostMax: e.target.value })}
              required
              className="mt-1"
            />
            {errors.estimatedCostMax && (
              <p className="text-sm text-destructive mt-1">{errors.estimatedCostMax}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="diagnosisCost">Coste diagnóstico (€)</Label>
            <Input
              id="diagnosisCost"
              type="number"
              step="0.01"
              min="0"
              max="10000"
              value={formData.diagnosisCost}
              onChange={(e) => setFormData({ ...formData, diagnosisCost: e.target.value })}
              required
              className="mt-1"
            />
            {errors.diagnosisCost && (
              <p className="text-sm text-destructive mt-1">{errors.diagnosisCost}</p>
            )}
          </div>
          <div>
            <Label htmlFor="transportCost">Coste transporte (€)</Label>
            <Input
              id="transportCost"
              type="number"
              step="0.01"
              min="0"
              max="1000"
              value={formData.transportCost}
              onChange={(e) => setFormData({ ...formData, transportCost: e.target.value })}
              required
              className="mt-1"
            />
            {errors.transportCost && (
              <p className="text-sm text-destructive mt-1">{errors.transportCost}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="estimatedDays">Días estimados</Label>
          <Input
            id="estimatedDays"
            type="number"
            min="1"
            max="365"
            value={formData.estimatedDays}
            onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
            required
            className="mt-1"
          />
          {errors.estimatedDays && (
            <p className="text-sm text-destructive mt-1">{errors.estimatedDays}</p>
          )}
        </div>

        <div>
          <Label htmlFor="message">Mensaje (opcional)</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Descripción del trabajo, garantías, etc."
            className="mt-1"
            rows={3}
            maxLength={2000}
          />
          {errors.message && (
            <p className="text-sm text-destructive mt-1">{errors.message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Enviando..." : "Enviar oferta"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
