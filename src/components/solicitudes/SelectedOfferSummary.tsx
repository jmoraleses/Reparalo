import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Wrench, MessageSquare, AlertTriangle, CheckCircle, XCircle, HandCoins } from "lucide-react";
import { ShippingLabel } from "./ShippingLabel";
import { ShipmentTracker } from "./ShipmentTracker";
import { CounterOfferDialog } from "./CounterOfferDialog";
import { CounterOffersList } from "./CounterOffersList";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useShipmentTracking } from "@/hooks/useShipmentTracking";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkshopReviews } from "@/components/reviews/WorkshopReviews";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface SelectedOfferSummaryProps {
  oferta: {
    id: string;
    estimated_cost_min: number;
    estimated_cost_max: number;
    diagnosis_cost: number;
    transport_cost: number;
    estimated_days: number;
    final_quote: number | null;
    workshop_id: string;
    workshop: {
      workshop_name: string | null;
      workshop_rating: number | null;
      workshop_reviews_count: number | null;
      workshop_city: string | null;
    } | null;
  };
  solicitudId: string;
  currentStatus: string;
  isOwner?: boolean;
  onStatusChange?: () => void;
  deviceInfo?: string;
  customerCity?: string;
  counterOfferCount?: number;
}

export function SelectedOfferSummary({ oferta, solicitudId, currentStatus, isOwner = false, onStatusChange, deviceInfo = "Dispositivo", customerCity = "España", counterOfferCount = 0 }: SelectedOfferSummaryProps) {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessages();
  const { isWorkshop: isTaller } = useUserProfile();
  const { shipments, history, createShipment, updateShipmentStatus } = useShipmentTracking(solicitudId);
  const [startingChat, setStartingChat] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [showCounterOfferDialog, setShowCounterOfferDialog] = useState(false);

  // Auto-create shipments when needed
  useEffect(() => {
    const createShipmentIfNeeded = async () => {
      if (creatingShipment) return;

      // Create "to_workshop" shipment when status changes to en_camino_taller
      if (currentStatus === 'en_camino_taller' && !shipments.find(s => s.type === 'to_workshop')) {
        setCreatingShipment(true);
        try {
          await createShipment({
            solicitud_id: solicitudId,
            tracking_number: `ENV-${solicitudId.slice(0, 8).toUpperCase()}`,
            type: 'to_workshop',
            status: 'created',
            origin_name: 'Cliente',
            origin_city: customerCity,
            destination_name: oferta.workshop?.workshop_name || 'Taller',
            destination_city: oferta.workshop?.workshop_city || 'España',
            estimated_delivery: null,
          });
        } catch (error) {
          console.error('Error creating shipment:', error);
        } finally {
          setCreatingShipment(false);
        }
      }

      // Create "to_customer" shipment when status changes to en_camino_cliente
      if (currentStatus === 'en_camino_cliente' && !shipments.find(s => s.type === 'to_customer')) {
        setCreatingShipment(true);
        try {
          await createShipment({
            solicitud_id: solicitudId,
            tracking_number: `DEV-${solicitudId.slice(0, 8).toUpperCase()}`,
            type: 'to_customer',
            status: 'created',
            origin_name: oferta.workshop?.workshop_name || 'Taller',
            origin_city: oferta.workshop?.workshop_city || 'España',
            destination_name: 'Cliente',
            destination_city: customerCity,
            estimated_delivery: null,
          });
        } catch (error) {
          console.error('Error creating shipment:', error);
        } finally {
          setCreatingShipment(false);
        }
      }
    };

    createShipmentIfNeeded();
  }, [currentStatus, shipments.length]);

  const handleContactWorkshop = async () => {
    if (!oferta.workshop_id) return;

    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(oferta.workshop_id, solicitudId);
      if (conversationId) {
        navigate(`/mensajes?conversation=${conversationId}`);
      } else {
        toast.error("Error al iniciar la conversación");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Error al iniciar la conversación");
    } finally {
      setStartingChat(false);
    }
  };

  const handleAcceptFinalQuote = async () => {
    setAccepting(true);
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({
          status: 'en_reparacion',
          final_quote_paid: true
        })
        .eq('id', solicitudId);

      if (error) throw error;

      toast.success("¡Presupuesto aceptado! El taller comenzará la reparación.");
      onStatusChange?.();
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      toast.error(error.message || 'Error al aceptar el presupuesto');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectFinalQuote = async () => {
    setRejecting(true);
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({ status: 'cancelado' })
        .eq('id', solicitudId);

      if (error) throw error;

      toast.info("Presupuesto rechazado. El dispositivo será devuelto.");
      onStatusChange?.();
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      toast.error(error.message || 'Error al rechazar el presupuesto');
    } finally {
      setRejecting(false);
    }
  };

  const totalUpfront = oferta.diagnosis_cost + oferta.transport_cost;
  const isPendingQuoteApproval = currentStatus === 'presupuesto_final';
  const isNegotiating = currentStatus === 'negociando';
  const showFinalQuote = oferta.final_quote && ['presupuesto_final', 'negociando', 'en_reparacion', 'reparado', 'en_camino_cliente', 'completado'].includes(currentStatus);
  const canMakeCounterOffer = counterOfferCount < 3;

  // Generate tracking number based on solicitud ID
  const generateTrackingNumber = (prefix: string) => {
    const shortId = solicitudId.slice(0, 8).toUpperCase();
    return `${prefix}-${shortId}`;
  };

  // Show shipping label to workshop when status is "oferta_seleccionada" (customer to workshop)
  const showShippingToWorkshop = ['oferta_seleccionada'].includes(currentStatus) && isOwner;

  // Show return shipping label when status is "reparado"
  const showShippingToCustomer = ['reparado'].includes(currentStatus);

  // Get active shipments for tracking display
  const toWorkshopShipment = shipments.find(s => s.type === 'to_workshop');
  const toCustomerShipment = shipments.find(s => s.type === 'to_customer');
  const toWorkshopHistory = history.filter(h => h.shipment_id === toWorkshopShipment?.id);
  const toCustomerHistory = history.filter(h => h.shipment_id === toCustomerShipment?.id);

  // Show tracker when shipment exists and we're in transit states
  const showToWorkshopTracker = toWorkshopShipment && ['en_camino_taller', 'diagnostico', 'presupuesto_final', 'en_reparacion', 'reparado', 'en_camino_cliente', 'completado'].includes(currentStatus);
  const showToCustomerTracker = toCustomerShipment && ['en_camino_cliente', 'completado'].includes(currentStatus);

  return (
    <Card className="p-5 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Taller seleccionado
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleContactWorkshop}
          disabled={startingChat}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          {startingChat ? "..." : "Contactar"}
        </Button>
      </div>

      {/* Workshop info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-medium text-foreground">
            {oferta.workshop?.workshop_name || "Taller"}
          </h4>
          {oferta.workshop?.workshop_city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {oferta.workshop.workshop_city}
            </p>
          )}
          {oferta.workshop?.workshop_rating && oferta.workshop.workshop_rating > 0 ? (
            <div className="mt-1">
              <WorkshopReviews
                workshopId={oferta.workshop_id}
                workshopName={oferta.workshop.workshop_name || "Taller"}
                rating={oferta.workshop.workshop_rating}
                reviewsCount={oferta.workshop.workshop_reviews_count}
                variant="inline"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-3 border-t border-border pt-4">
        {showFinalQuote ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Presupuesto final</span>
              <span className="text-xl font-bold text-primary">{oferta.final_quote}€</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Pago inicial realizado: {totalUpfront}€ (diagnóstico + transporte)
            </div>

            {/* Accept/Reject/Counter-offer buttons for owner when status is presupuesto_final */}
            {isPendingQuoteApproval && isOwner && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Opciones disponibles</p>
                    <p className="text-muted-foreground">
                      Puedes aceptar, hacer una contraoferta ({3 - counterOfferCount} restantes), o rechazar.
                      Si rechazas, el dispositivo será devuelto sin reembolso de los {totalUpfront}€.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRejectFinalQuote}
                    disabled={rejecting || accepting}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Rechazar</span>
                  </Button>
                  {canMakeCounterOffer && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCounterOfferDialog(true)}
                      disabled={rejecting || accepting}
                    >
                      <HandCoins className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Contraoferta</span>
                    </Button>
                  )}
                  <Button
                    onClick={handleAcceptFinalQuote}
                    disabled={accepting || rejecting}
                    className={canMakeCounterOffer ? "" : "col-span-2"}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {accepting ? "..." : `Aceptar`}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Al aceptar, se te cobrará {oferta.final_quote}€ que quedará en depósito hasta confirmar la reparación.
                </p>
              </div>
            )}

            {/* Counter offers list for negotiation status */}
            {(isNegotiating || counterOfferCount > 0) && (
              <div className="mt-4 pt-4 border-t border-border">
                <CounterOffersList
                  solicitudId={solicitudId}
                  offerId={oferta.id}
                  isWorkshop={isTaller}
                  onStatusChange={() => onStatusChange?.()}
                  currentStatus={currentStatus}
                />
              </div>
            )}

            {/* Show waiting message when negotiating as customer */}
            {isNegotiating && isOwner && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Esperando respuesta del taller a tu contraoferta...
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Presupuesto estimado</span>
              <span className="font-semibold text-foreground">
                {oferta.estimated_cost_min}€ - {oferta.estimated_cost_max}€
              </span>
            </div>

            <div className="space-y-2 py-3 border-y border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diagnóstico</span>
                <span className="font-medium text-foreground">{oferta.diagnosis_cost}€</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transporte (ida y vuelta)</span>
                <span className="font-medium text-foreground">{oferta.transport_cost}€</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Pago inicial requerido</span>
              <span className="text-lg font-bold text-primary">{totalUpfront}€</span>
            </div>

            {/* Counter offers list for negotiation on initial offers */}
            {(isNegotiating || counterOfferCount > 0) && (
              <div className="mt-4 pt-4 border-t border-border">
                <CounterOffersList
                  solicitudId={solicitudId}
                  offerId={oferta.id}
                  isWorkshop={isTaller}
                  onStatusChange={() => onStatusChange?.()}
                  currentStatus={currentStatus}
                />
              </div>
            )}

            {/* Show waiting message when negotiating as customer */}
            {isNegotiating && isOwner && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Esperando respuesta del taller a tu contraoferta...
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
          <Clock className="h-4 w-4" />
          <span>Tiempo estimado: {oferta.estimated_days} días</span>
        </div>
      </div>

      {/* Shipping label to workshop */}
      {showShippingToWorkshop && (
        <div className="mt-4 pt-4 border-t border-border">
          <ShippingLabel
            trackingNumber={generateTrackingNumber("ENV")}
            origin={{
              name: "Cliente",
              city: customerCity
            }}
            destination={{
              name: oferta.workshop?.workshop_name || "Taller",
              city: oferta.workshop?.workshop_city || "España"
            }}
            deviceInfo={deviceInfo}
            createdAt={format(new Date(), "dd/MM/yyyy")}
            type="to_workshop"
          />
        </div>
      )}

      {/* Shipment tracker to workshop */}
      {showToWorkshopTracker && toWorkshopShipment && (
        <div className="mt-4 pt-4 border-t border-border">
          <ShipmentTracker
            shipment={toWorkshopShipment}
            history={toWorkshopHistory}
            canUpdate={!isOwner && toWorkshopShipment.status !== 'delivered'}
            onUpdateStatus={(newStatus) => updateShipmentStatus(toWorkshopShipment.id, newStatus)}
          />
        </div>
      )}

      {/* Return shipping label to customer */}
      {showShippingToCustomer && !toCustomerShipment && (
        <div className="mt-4 pt-4 border-t border-border">
          <ShippingLabel
            trackingNumber={generateTrackingNumber("DEV")}
            origin={{
              name: oferta.workshop?.workshop_name || "Taller",
              city: oferta.workshop?.workshop_city || "España"
            }}
            destination={{
              name: "Cliente",
              city: customerCity
            }}
            deviceInfo={deviceInfo}
            createdAt={format(new Date(), "dd/MM/yyyy")}
            type="to_customer"
          />
        </div>
      )}

      {/* Shipment tracker to customer */}
      {showToCustomerTracker && toCustomerShipment && (
        <div className="mt-4 pt-4 border-t border-border">
          <ShipmentTracker
            shipment={toCustomerShipment}
            history={toCustomerHistory}
            canUpdate={!isOwner && toCustomerShipment.status !== 'delivered'}
            onUpdateStatus={(newStatus) => updateShipmentStatus(toCustomerShipment.id, newStatus)}
          />
        </div>
      )}

      {/* Counter offer dialog */}
      {oferta.final_quote && (
        <CounterOfferDialog
          open={showCounterOfferDialog}
          onOpenChange={setShowCounterOfferDialog}
          solicitudId={solicitudId}
          offerId={oferta.id}
          currentQuote={oferta.final_quote}
          counterOfferCount={counterOfferCount}
          onSuccess={() => onStatusChange?.()}
        />
      )}
    </Card>
  );
}