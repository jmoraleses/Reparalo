import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/solicitudes/OrderTimeline";
import { OfertaForm } from "@/components/ofertas/OfertaForm";
import { OfertaCard } from "@/components/ofertas/OfertaCard";
import { WorkshopStatusControls } from "@/components/solicitudes/WorkshopStatusControls";
import { CustomerStatusControls } from "@/components/solicitudes/CustomerStatusControls";
import { SelectedOfferSummary } from "@/components/solicitudes/SelectedOfferSummary";
import { SolicitudForm, SolicitudFormData } from "@/components/solicitudes/SolicitudForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Trash2, Pencil } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Status } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Gamepad2,
  Monitor,
  MapPin,
  Clock,
  Shield,
  Truck,
  CheckCircle,
  Plus,
  Loader2
} from "lucide-react";

interface Solicitud {
  id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  problem_description: string;
  city: string;
  status: string;
  user_id: string;
  created_at: string;
  images: string[] | null;
  selected_offer_id: string | null;
  counter_offer_count: number | null;
}

interface Oferta {
  id: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  diagnosis_cost: number;
  transport_cost: number;
  estimated_days: number;
  message: string | null;
  status: string;
  final_quote: number | null;
  workshop_id: string;
  workshop: {
    user_id: string;
    workshop_name: string | null;
    workshop_rating: number | null;
    workshop_reviews_count: number | null;
    workshop_city: string | null;
  } | null;
}

const getDeviceIcon = (tipo: string) => {
  switch (tipo) {
    case "smartphone":
      return <Smartphone className="h-8 w-8 text-primary" />;
    case "laptop":
    case "portatil":
      return <Laptop className="h-8 w-8 text-primary" />;
    case "tablet":
      return <Tablet className="h-8 w-8 text-primary" />;
    case "smartwatch":
      return <Watch className="h-8 w-8 text-primary" />;
    case "console":
      return <Gamepad2 className="h-8 w-8 text-primary" />;
    default:
      return <Monitor className="h-8 w-8 text-primary" />;
  }
};

export default function SolicitudDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isWorkshop: isTaller } = useUserProfile();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [showOfertaForm, setShowOfertaForm] = useState(false);
  // const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Oferta | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isOwner = user && solicitud && user.id === solicitud.user_id;

  useEffect(() => {
    if (id) {
      fetchSolicitud();
      fetchOfertas();
    }
  }, [id]);

  const fetchSolicitud = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching solicitud:', error);
        toast.error('Error al cargar la solicitud');
        setLoading(false);
        return;
      }

      if (!data) {
        toast.error('Solicitud no encontrada');
        navigate('/');
        return;
      }

      setSolicitud(data);
    } catch (err) {
      console.error('Unexpected error in fetchSolicitud:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfertas = async () => {
    if (!id) return;

    // First get the ofertas
    const { data: ofertasData, error: ofertasError } = await supabase
      .from('ofertas')
      .select('*')
      .eq('solicitud_id', id)
      .order('created_at', { ascending: false });

    if (ofertasError) {
      console.error('Error fetching ofertas:', ofertasError);
      return;
    }

    if (!ofertasData || ofertasData.length === 0) {
      setOfertas([]);
      return;
    }

    // Get workshop profiles for each offer
    const workshopIds = ofertasData.map(o => o.workshop_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, workshop_name, workshop_rating, workshop_reviews_count, workshop_city')
      .in('user_id', workshopIds);

    // Map profiles to ofertas
    const ofertasWithWorkshop: Oferta[] = ofertasData.map(oferta => ({
      ...oferta,
      final_quote: oferta.final_quote ?? null, // Ensure final_quote is number | null
      workshop: profilesData?.find(p => p.user_id === oferta.workshop_id) || null
    }));

    setOfertas(ofertasWithWorkshop);
  };

  const handleAcceptOferta = async (ofertaId: string) => {
    if (!solicitud || !user) return;

    try {
      // Update solicitud with selected offer and change status
      const { error: solicitudError } = await supabase
        .from('solicitudes')
        .update({
          selected_offer_id: ofertaId,
          status: 'oferta_seleccionada'
        })
        .eq('id', solicitud.id);

      if (solicitudError) throw solicitudError;

      // Update the accepted offer status
      const { error: ofertaError } = await supabase
        .from('ofertas')
        .update({ status: 'aceptada' })
        .eq('id', ofertaId);

      if (ofertaError) throw ofertaError;

      // Reject all other offers
      const { error: rejectError } = await supabase
        .from('ofertas')
        .update({ status: 'rechazada' })
        .eq('solicitud_id', solicitud.id)
        .neq('id', ofertaId);

      if (rejectError) throw rejectError;

      if (rejectError) throw rejectError;

      // Send notification to the workshop whose offer was accepted
      const acceptedOffer = ofertas.find(o => o.id === ofertaId);
      if (acceptedOffer) {
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: acceptedOffer.workshop_id,
          type: "offer_accepted",
          title: "¡Oferta aceptada!",
          message: `El cliente ha aceptado tu oferta para ${solicitud.device_brand} ${solicitud.device_model}`,
          link: `/solicitudes/${solicitud.id}`,
          read: false,
        });

        if (notifError) console.error("Error sending notification:", notifError);
      }

      toast.success("¡Oferta aceptada! Ahora debes realizar el pago inicial.");

      // Refresh data
      fetchSolicitud();
      fetchOfertas();
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      toast.error(error.message || 'Error al aceptar la oferta');
    }
  };

  const handleOfertaSuccess = () => {
    setShowOfertaForm(false);
    fetchOfertas();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!solicitud) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Solicitud no encontrada</h1>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }



  const handleUpdate = async (data: SolicitudFormData) => {
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({
          device_type: data.deviceType,
          device_brand: data.brand,
          device_model: data.model,
          city: data.city,
          problem_description: data.problem,
          images: data.photos
        })
        .eq('id', solicitud.id);

      if (error) throw error;

      setSolicitud(prev => prev ? ({
        ...prev,
        device_type: data.deviceType,
        device_brand: data.brand,
        device_model: data.model,
        city: data.city,
        problem_description: data.problem,
        images: data.photos
      }) : null);

      toast.success("Solicitud actualizada");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar");
    }
  };

  const handleCancel = async () => {
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({ status: 'cancelado' })
        .eq('id', solicitud.id);

      if (error) throw error;

      setSolicitud(prev => prev ? ({ ...prev, status: 'cancelado' }) : null);
      toast.success("Solicitud cancelada");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Error al cancelar");
    }
  };

  // Check if current user (as workshop) has already sent an offer
  const hasAlreadySentOffer = isTaller && user && ofertas.some(o => o.workshop_id === user.id);
  const canSendOffer = isTaller && solicitud.status === 'esperando_ofertas' && !hasAlreadySentOffer && !isOwner;

  return (
    <Layout>
      <div className="container py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          {isOwner && solicitud.status === 'esperando_ofertas' && (
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar solicitud</DialogTitle>
                  </DialogHeader>
                  <SolicitudForm
                    initialData={{
                      deviceType: solicitud.device_type,
                      brand: solicitud.device_brand,
                      model: solicitud.device_model,
                      city: solicitud.city,
                      problem: solicitud.problem_description,
                      photos: solicitud.images || []
                    }}
                    onSubmit={handleUpdate}
                    submitLabel="Guardar cambios"
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La solicitud se marcará como cancelada y no recibirás más ofertas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sí, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-card">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                  {getDeviceIcon(solicitud.device_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {solicitud.device_brand} {solicitud.device_model}
                      </h1>
                      <p className="text-muted-foreground capitalize">{solicitud.device_type}</p>
                    </div>
                    <StatusBadge status={solicitud.status as Status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{solicitud.city}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="font-semibold text-foreground mb-2">
                  Descripción del problema
                </h2>
                <p className="text-muted-foreground">{solicitud.problem_description}</p>
              </div>

              {/* Images */}
              {solicitud.images && solicitud.images.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h2 className="font-semibold text-foreground mb-3">Fotos del dispositivo</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {solicitud.images.map((img, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={img}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Ofertas section */}
            {solicitud.status === 'esperando_ofertas' ? (
              <Card className="p-6 bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Ofertas recibidas
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                </div>

                {ofertas.length > 0 ? (
                  <div className="space-y-4">
                    {ofertas.map((oferta) => (
                      <OfertaCard
                        key={oferta.id}
                        oferta={oferta}
                        isOwner={isOwner || false}
                        solicitudId={solicitud.id}
                        onAccept={handleAcceptOferta}
                        isAccepted={false}
                        onEdit={(oferta) => {
                          setEditingOffer(oferta as Oferta);
                          setShowOfertaForm(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Esperando ofertas
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Los talleres revisarán tu solicitud y enviarán sus presupuestos
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              // Show selected offer summary when an offer has been accepted
              (() => {
                const selectedOffer = ofertas.find(o => o.id === solicitud.selected_offer_id);
                if (selectedOffer) {
                  return (
                    <SelectedOfferSummary
                      oferta={selectedOffer}
                      solicitudId={solicitud.id}
                      currentStatus={solicitud.status}
                      isOwner={isOwner || false}
                      onStatusChange={() => {
                        fetchSolicitud();
                        fetchOfertas();
                      }}
                      deviceInfo={`${solicitud.device_brand} ${solicitud.device_model}`}
                      customerCity={solicitud.city}
                      counterOfferCount={solicitud.counter_offer_count || 0}
                    />
                  );
                }
                return null;
              })()
            )}

            {/* Workshop offer form */}
            {canSendOffer && (
              <div>
                {showOfertaForm ? (
                  <OfertaForm
                    solicitudId={solicitud.id}
                    onSuccess={handleOfertaSuccess}
                    onCancel={() => {
                      setShowOfertaForm(false);
                      setEditingOffer(null);
                    }}
                    initialData={editingOffer ? {
                      id: editingOffer.id,
                      estimatedCostMin: editingOffer.estimated_cost_min,
                      estimatedCostMax: editingOffer.estimated_cost_max,
                      diagnosisCost: editingOffer.diagnosis_cost,
                      transportCost: editingOffer.transport_cost,
                      estimatedDays: editingOffer.estimated_days,
                      message: editingOffer.message || undefined
                    } : null}
                    customerId={solicitud.user_id}
                  />
                ) : (
                  <Button
                    onClick={() => setShowOfertaForm(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Enviar presupuesto
                  </Button>
                )}
              </div>
            )}

            {hasAlreadySentOffer && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Ya has enviado una oferta para esta solicitud
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Customer controls - show if user is the owner */}
            {isOwner && ["oferta_seleccionada", "presupuesto_final", "en_camino_cliente"].includes(solicitud.status) && (
              <CustomerStatusControls
                solicitudId={solicitud.id}
                currentStatus={solicitud.status}
                onStatusChange={() => {
                  fetchSolicitud();
                  fetchOfertas();
                }}
                workshopId={ofertas.find(o => o.id === solicitud.selected_offer_id)?.workshop_id || ""}
              />
            )}

            {/* Workshop controls - show if user is the workshop for this repair */}
            {isTaller && user && solicitud.selected_offer_id && ofertas.some(o => o.workshop_id === user.id && solicitud.selected_offer_id) && (
              <WorkshopStatusControls
                solicitudId={solicitud.id}
                currentStatus={solicitud.status}
                selectedOfferId={solicitud.selected_offer_id}
                onStatusChange={() => {
                  fetchSolicitud();
                  fetchOfertas();
                }}
                customerId={solicitud.user_id}
              />
            )}

            <Card className="p-6 bg-card">
              <h2 className="font-semibold text-foreground mb-4">
                Estado del pedido
              </h2>
              <OrderTimeline currentStatus={solicitud.status} />
            </Card>

            <Card className="p-6 bg-card">
              <h2 className="font-semibold text-foreground mb-4">Garantías</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">Pago seguro con Escrow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">Envío anónimo (Blind Shipping)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">Talleres verificados</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}