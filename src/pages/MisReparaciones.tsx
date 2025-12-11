import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, Status } from "@/components/ui/status-badge";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Watch,
  Gamepad2,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquareQuote
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Solicitud {
  id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  problem_description: string;
  status: Status;
  created_at: string;
  selected_offer_id: string | null;
  workshop_name?: string | null;
  workshop_id?: string | null;
  final_quote?: number | null;
  has_review?: boolean;
  offers_count?: number;
}

const getDeviceIcon = (tipo: string) => {
  switch (tipo) {
    case "smartphone":
      return <Smartphone className="h-6 w-6" />;
    case "laptop":
    case "portatil":
      return <Laptop className="h-6 w-6" />;
    case "tablet":
      return <Tablet className="h-6 w-6" />;
    case "smartwatch":
      return <Watch className="h-6 w-6" />;
    case "console":
      return <Gamepad2 className="h-6 w-6" />;
    default:
      return <Monitor className="h-6 w-6" />;
  }
};

export default function MisReparaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  // New state for tabs and pagination
  const [activeTab, setActiveTab] = useState("proceso");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 36;

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a") ||
      (e.target as HTMLElement).closest('[role="button"]')
    ) {
      return;
    }
    if (!id) {
      console.error("No ID found for navigation");
      return;
    }
    console.log("Navigating to request:", id);
    navigate(`/solicitud/${id}`);
  };

  useEffect(() => {
    if (user) {
      fetchSolicitudes();
    }
  }, [user, page, activeTab]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const fetchSolicitudes = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("solicitudes")
      .select("*, ofertas(count)", { count: "exact" }) // Select offers count
      .eq("user_id", user.id);

    // Apply tab filters
    if (activeTab === "proceso") {
      // Not completed and not canceled
      query = query.not("status", "in", '("completado","cancelado")');
    } else {
      // History: completed or canceled
      query = query.in("status", ["completado", "cancelado"]);
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: solicitudesData, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching solicitudes:", error);
      setLoading(false);
      return;
    }

    if (count) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } else {
      setTotalPages(0);
    }

    // Fetch workshop names and final quotes for accepted offers
    const solicitudesWithDetails = await Promise.all(
      (solicitudesData || []).map(async (sol) => {
        let workshop_name = null;
        let workshop_id = null;
        let final_quote = null;
        let has_review = false;

        // Correctly type the offers count
        const offers_count = sol.ofertas?.[0]?.count ?? 0;

        if (sol.selected_offer_id) {
          const { data: oferta } = await supabase
            .from("ofertas")
            .select("final_quote, workshop_id")
            .eq("id", sol.selected_offer_id)
            .maybeSingle();

          if (oferta) {
            final_quote = oferta.final_quote;
            workshop_id = oferta.workshop_id;

            const { data: profile } = await supabase
              .from("profiles")
              .select("workshop_name")
              .eq("user_id", oferta.workshop_id)
              .maybeSingle();

            workshop_name = profile?.workshop_name;
          }
        }

        // Check if review exists for completed repairs
        if (sol.status === "completado") {
          const { data: review } = await supabase
            .from("reviews")
            .select("id")
            .eq("solicitud_id", sol.id)
            .maybeSingle();

          has_review = !!review;
        }

        return {
          ...sol,
          workshop_name,
          workshop_id,
          final_quote,
          has_review,
          offers_count,
        } as Solicitud;
      })
    );

    setSolicitudes(solicitudesWithDetails);
    setLoading(false);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(page);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (solicitudes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {activeTab === "proceso" ? "No tienes reparaciones en curso." : "No tienes reparaciones finalizadas."}
          </p>
          {activeTab === "proceso" && (
            <Button className="mt-4" asChild>
              <Link to="/nueva-solicitud">Nueva solicitud</Link>
            </Button>
          )}
        </div>
      );
    }

    // List View (Only)
    return (
      <div className="space-y-4">
        {solicitudes.map(reparacion => {
          return (
            <Card
              key={reparacion.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => handleCardClick(e, reparacion.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h - 10 w - 10 items - center justify - center rounded - lg bg - ${reparacion.status === "completado" ? "success" : "primary"}/10 text-${reparacion.status === "completado" ? "success" : "primary"} shrink-0`}>
                  {reparacion.status === "completado" ? <CheckCircle2 className="h-5 w-5" /> : getDeviceIcon(reparacion.device_type)}
                </div >

                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-1">
                    <h3 className="font-medium truncate">{reparacion.device_brand} {reparacion.device_model}</h3>
                    <p className="text-xs text-muted-foreground truncate">{new Date(reparacion.created_at).toLocaleDateString("es-ES")}</p>
                  </div>

                  <div className="md:col-span-2 hidden md:block">
                    <p className="text-sm text-muted-foreground truncate">{reparacion.problem_description}</p>
                    {reparacion.offers_count !== undefined && reparacion.offers_count > 0 && reparacion.status === "esperando_ofertas" && (
                      <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                        <MessageSquareQuote className="h-3 w-3" />
                        {reparacion.offers_count} ofertas
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-1 flex items-center justify-end gap-2">
                    <StatusBadge status={reparacion.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div >
            </Card >
          )
        })}
      </div >
    );
  };

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Reparaciones</h1>
            <p className="text-muted-foreground mt-1">
              Sigue el estado de tus dispositivos en reparación
            </p>
          </div>
          <Button asChild>
            <Link to="/nueva-solicitud">Nueva solicitud</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="proceso">En Proceso</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            {/* Removed Toggle Buttons */}
          </div>

          <TabsContent value="proceso" className="space-y-6">
            {renderContent()}
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            {renderContent()}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, idx) => (
                  <PaginationItem key={idx}>
                    {pageNum === -1 ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

      </div>
    </Layout>
  );
}
