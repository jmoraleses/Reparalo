import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, CheckCircle, Truck, Loader2, Eye, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomerStatusControlsProps {
  solicitudId: string;
  currentStatus: string;
  onStatusChange: () => void;
  viewOnly?: boolean; // If true, show "View" buttons that link to detail instead of action buttons
  workshopId: string;
}

export function CustomerStatusControls({
  solicitudId,
  currentStatus,
  onStatusChange,
  viewOnly = false,
  workshopId,
}: CustomerStatusControlsProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkShipped = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("solicitudes")
        .update({ status: "en_camino_taller" })
        .eq("id", solicitudId);

      if (error) throw error;

      // Notification to workshop
      await supabase.from("notifications").insert({
        user_id: workshopId,
        type: "status_change",
        title: "Dispositivo en camino",
        message: "El cliente ha marcado el dispositivo como enviado.",
        link: `/solicitud/${solicitudId}`,
        read: false,
      });

      toast.success("¡Envío marcado! El taller será notificado.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("solicitudes")
        .update({ status: "completado" })
        .eq("id", solicitudId);

      if (error) throw error;

      // Notification to workshop
      await supabase.from("notifications").insert({
        user_id: workshopId,
        type: "status_change",
        title: "Reparación completada",
        message: "El cliente ha confirmado la recepción del dispositivo. ¡Buen trabajo!",
        link: `/solicitud/${solicitudId}`,
        read: false,
      });

      toast.success("¡Reparación completada! Gracias por usar Repáralo.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("solicitudes")
        .update({ status: "en_reparacion" })
        .eq("id", solicitudId);

      if (error) throw error;

      // Notification to workshop
      await supabase.from("notifications").insert({
        user_id: workshopId,
        type: "status_change",
        title: "Presupuesto aceptado",
        message: "El cliente ha aceptado el presupuesto final. Puedes comenzar la reparación.",
        link: `/solicitud/${solicitudId}`,
        read: false,
      });

      toast.success("¡Presupuesto aceptado! El taller comenzará la reparación.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("solicitudes")
        .update({ status: "cancelado" })
        .eq("id", solicitudId);

      if (error) throw error;

      // Notification to workshop
      await supabase.from("notifications").insert({
        user_id: workshopId,
        type: "status_change",
        title: "Presupuesto rechazado",
        message: "El cliente ha rechazado el presupuesto final.",
        link: `/solicitud/${solicitudId}`,
        read: false,
      });

      toast.success("Presupuesto rechazado. El dispositivo será devuelto.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  // Show controls based on current status
  if (currentStatus === "oferta_seleccionada") {
    return (
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Envía tu dispositivo</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando hayas enviado tu dispositivo al taller, márcalo aquí para que puedan prepararse.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="mt-3" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  He enviado el dispositivo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Has enviado tu dispositivo al taller? Esta acción notificará al taller que el paquete está en camino.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkShipped}>
                    Sí, lo he enviado
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    );
  }

  if (currentStatus === "presupuesto_final") {
    return (
      <Card className="p-4 bg-warning/5 border-warning/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 shrink-0">
            <CheckCircle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Presupuesto final disponible</h4>
            <p className="text-sm text-muted-foreground mt-1">
              El taller ha determinado el coste final de la reparación. Revisa el presupuesto y acepta para continuar.
            </p>
            {viewOnly ? (
              <Button className="mt-3" asChild>
                <Link to={`/solicitud/${solicitudId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver presupuesto
                </Link>
              </Button>
            ) : (
              <div className="flex gap-2 mt-3 flex-wrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Aceptar presupuesto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Aceptar presupuesto final</AlertDialogTitle>
                      <AlertDialogDescription>
                        Al aceptar, autorizas al taller a proceder con la reparación. El pago se realizará cuando confirmes la recepción del dispositivo reparado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAcceptQuote}>
                        Aceptar y continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={loading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rechazar presupuesto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Si rechazas el presupuesto, el dispositivo será devuelto sin reparar. El coste del diagnóstico y transporte ya pagado no será reembolsado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRejectQuote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Rechazar presupuesto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (currentStatus === "en_camino_cliente") {
    return (
      <Card className="p-4 bg-success/5 border-success/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 shrink-0">
            <Package className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Tu dispositivo está en camino</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando recibas tu dispositivo y verifiques que funciona correctamente, confirma la recepción.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="mt-3" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  He recibido mi dispositivo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar recepción</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Has recibido tu dispositivo y funciona correctamente? Al confirmar, se liberará el pago al taller y se completará la reparación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmReceived}>
                    Confirmar recepción
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
