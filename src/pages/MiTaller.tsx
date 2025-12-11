import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, Status } from "@/components/ui/status-badge";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import {
  Wrench,
  MapPin,
  Star,
  MessageSquare,
  ChevronRight,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Gamepad2,
  Monitor,
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Euro,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { EarningsChart } from "@/components/estadisticas/EarningsChart";

interface Profile {
  workshop_name: string | null;
  workshop_city: string | null;
  workshop_description: string | null;
  workshop_rating: number | null;
  workshop_reviews_count: number | null;
}

interface Reparacion {
  id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  problem_description: string;
  status: Status;
  created_at: string;
  final_quote: number | null;
  user_id: string;
}

const getDeviceIcon = (tipo: string) => {
  switch (tipo) {
    case "smartphone":
      return <Smartphone className="h-5 w-5" />;
    case "laptop":
    case "portatil":
      return <Laptop className="h-5 w-5" />;
    case "tablet":
      return <Tablet className="h-5 w-5" />;
    case "smartwatch":
      return <Watch className="h-5 w-5" />;
    case "console":
      return <Gamepad2 className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
};

const getStatusInfo = (estado: Status) => {
  switch (estado) {
    case "oferta_seleccionada":
      return { icon: Clock, text: "Pendiente envío", color: "text-muted-foreground" };
    case "en_camino_taller":
      return { icon: Package, text: "En camino", color: "text-primary" };
    case "diagnostico":
      return { icon: AlertCircle, text: "Diagnóstico", color: "text-warning" };
    case "presupuesto_final":
      return { icon: AlertCircle, text: "Esperando aprobación", color: "text-warning" };
    case "en_reparacion":
      return { icon: Wrench, text: "Reparando", color: "text-primary" };
    case "reparado":
      return { icon: CheckCircle2, text: "Listo para enviar", color: "text-success" };
    case "en_camino_cliente":
      return { icon: Package, text: "Enviado", color: "text-primary" };
    case "completado":
      return { icon: CheckCircle2, text: "Completado", color: "text-success" };
    default:
      return { icon: Clock, text: "Pendiente", color: "text-muted-foreground" };
  }
};

export default function MiTaller() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // const { getOrCreateConversation } = useMessages();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWorkshop, setIsWorkshop] = useState(false);
  const [contactingCustomer, setContactingCustomer] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Check if user is a verified workshop
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, verified_at')
      .eq('user_id', user.id)
      .eq('role', 'workshop')
      .maybeSingle();

    const isVerifiedWorkshop = roleData?.verified_at !== null;
    setIsWorkshop(isVerifiedWorkshop);

    if (!isVerifiedWorkshop) {
      setLoading(false);
      return;
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('workshop_name, workshop_city, workshop_description, workshop_rating, workshop_reviews_count')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Get accepted offers for this workshop
    const { data: ofertasData } = await supabase
      .from('ofertas')
      .select('id, solicitud_id, final_quote, status')
      .eq('workshop_id', user.id)
      .eq('status', 'aceptada');

    if (ofertasData && ofertasData.length > 0) {
      const solicitudIds = ofertasData.map(o => o.solicitud_id);

      const { data: solicitudesData } = await supabase
        .from('solicitudes')
        .select('id, device_type, device_brand, device_model, problem_description, status, created_at, user_id')
        .in('id', solicitudIds)
        .order('created_at', { ascending: false });

      // Map final quotes to solicitudes
      const reparacionesWithQuotes = (solicitudesData || []).map(sol => {
        const oferta = ofertasData.find(o => o.solicitud_id === sol.id);
        return {
          ...sol,
          final_quote: oferta?.final_quote ?? null,
        } as Reparacion;
      });

      setReparaciones(reparacionesWithQuotes);
    }

    setLoading(false);
  };

  const activas = reparaciones.filter(r =>
    !['completado', 'cancelado'].includes(r.status)
  );
  const completadas = reparaciones.filter(r => r.status === 'completado');
  const pendientesAccion = reparaciones.filter(r =>
    ['en_camino_taller', 'presupuesto_final', 'reparado'].includes(r.status)
  );

  // Calculate total earnings from completed repairs
  const totalEarnings = completadas.reduce((sum, rep) => sum + (rep.final_quote || 0), 0);

  // Calculate this month's earnings
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthlyEarnings = completadas
    .filter(r => new Date(r.created_at) >= thisMonth)
    .reduce((sum, rep) => sum + (rep.final_quote || 0), 0);

  // Calculate average repair value
  const avgRepairValue = completadas.length > 0
    ? Math.round(totalEarnings / completadas.length)
    : 0;

  const handleContactCustomer = async (customerId: string, solicitudId: string) => {
    setContactingCustomer(solicitudId);
    try {
      // For workshop, we need to swap customer and workshop in the conversation
      // The getOrCreateConversation expects workshopId, but we're the workshop
      // So we need a different approach - create conversation where we're the workshop
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", customerId)
        .eq("workshop_id", user!.id)
        .maybeSingle();

      if (existing) {
        navigate(`/mensajes?conversation=${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          customer_id: customerId,
          workshop_id: user!.id,
          solicitud_id: solicitudId,
        })
        .select("id")
        .single();

      if (error) throw error;

      navigate(`/mensajes?conversation=${newConv.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Error al iniciar la conversación");
    } finally {
      setContactingCustomer(null);
    }
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

  if (!isWorkshop) {
    return (
      <Layout>
        <div className="container py-8">
          <Card className="p-12 text-center bg-card">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No eres un taller verificado
            </h3>
            <p className="text-muted-foreground mb-6">
              Esta página es solo para talleres registrados en la plataforma.
            </p>
            <Button asChild>
              <Link to="/">Ir al marketplace</Link>
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header del taller */}
      <div className="bg-secondary py-12">
        <div className="container">
          <div className="flex items-start gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-secondary-foreground/10">
              <Wrench className="h-12 w-12 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-secondary-foreground">
                {profile?.workshop_name || "Mi Taller"}
              </h1>
              {profile?.workshop_city && (
                <div className="flex items-center gap-1 text-secondary-foreground/80 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.workshop_city}</span>
                </div>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-secondary-foreground/80">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{profile?.workshop_rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-secondary-foreground/60">
                    ({profile?.workshop_reviews_count || 0} reseñas)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Panel */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Panel de Estadísticas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wrench className="h-4 w-4" />
                <span className="text-xs">Total trabajos</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{reparaciones.length}</div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">En curso</span>
              </div>
              <div className="text-2xl font-bold text-primary">{activas.length}</div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Completadas</span>
              </div>
              <div className="text-2xl font-bold text-success">{completadas.length}</div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-xs">Valoración</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {profile?.workshop_rating?.toFixed(1) || "0.0"}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({profile?.workshop_reviews_count || 0})
                </span>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-primary/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Euro className="h-4 w-4" />
                <span className="text-xs">Ganancias totales</span>
              </div>
              <div className="text-2xl font-bold text-primary">{totalEarnings.toLocaleString()}€</div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Este mes</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{monthlyEarnings.toLocaleString()}€</div>
            </div>
          </div>

          {/* Additional metrics row */}
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-warning"></div>
              <div>
                <div className="text-sm font-medium text-foreground">{pendientesAccion.length}</div>
                <div className="text-xs text-muted-foreground">Requieren acción</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div>
                <div className="text-sm font-medium text-foreground">{avgRepairValue}€</div>
                <div className="text-xs text-muted-foreground">Valor medio por reparación</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {reparaciones.length > 0
                    ? Math.round((completadas.length / reparaciones.length) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Tasa de completado</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {profile?.workshop_reviews_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Reseñas recibidas</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Earnings Chart */}
        <EarningsChart reparaciones={reparaciones} />

        <Tabs defaultValue="activas" className="space-y-6 mt-8">
          <TabsList>
            <TabsTrigger value="activas">
              En curso ({activas.length})
            </TabsTrigger>
            <TabsTrigger value="completadas">
              Completadas ({completadas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activas" className="space-y-4">
            {activas.length > 0 ? (
              activas.map((rep) => {
                const statusInfo = getStatusInfo(rep.status);
                const StatusIcon = statusInfo.icon;
                const needsAction = ['en_camino_taller', 'presupuesto_final', 'reparado'].includes(rep.status);

                return (
                  <Card
                    key={rep.id}
                    className={`p-4 bg-card hover:shadow-md transition-shadow ${needsAction ? 'border-warning/50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        {getDeviceIcon(rep.device_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">
                            {rep.device_brand} {rep.device_model}
                          </h3>
                          <StatusBadge status={rep.status} />
                          {needsAction && (
                            <Badge variant="outline" className="text-warning border-warning">
                              Acción requerida
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          {rep.problem_description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium hidden sm:inline">{statusInfo.text}</span>
                        </div>
                        {rep.final_quote && (
                          <span className="text-sm font-semibold text-foreground">
                            {rep.final_quote}€
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleContactCustomer(rep.user_id, rep.id);
                          }}
                          disabled={contactingCustomer === rep.id}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {contactingCustomer === rep.id ? "..." : "Contactar"}
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/solicitud/${rep.id}`}>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-12 text-center bg-card">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tienes reparaciones activas
                </h3>
                <p className="text-muted-foreground mb-6">
                  Explora el marketplace y envía ofertas a solicitudes de reparación.
                </p>
                <Button asChild>
                  <Link to="/">Ver solicitudes</Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completadas" className="space-y-4">
            {completadas.length > 0 ? (
              completadas.map((rep) => (
                <Card key={rep.id} className="p-4 bg-card/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {rep.device_brand} {rep.device_model}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {rep.problem_description}
                      </p>
                    </div>
                    <div className="text-right">
                      {rep.final_quote && (
                        <div className="font-semibold text-foreground">{rep.final_quote}€</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(rep.created_at).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/solicitud/${rep.id}`}>
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center bg-card">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Sin reparaciones completadas
                </h3>
                <p className="text-muted-foreground">
                  Aquí aparecerán tus trabajos finalizados.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
}
