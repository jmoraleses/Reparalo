import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { FilterSection } from "@/components/solicitudes/FilterSection";
import { SolicitudCard } from "@/components/solicitudes/SolicitudCard";
import { HowItWorks } from "@/components/home/HowItWorks";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { Loader2 } from "lucide-react";

interface Solicitud {
  id: string;
  device_brand: string;
  device_model: string;
  device_type: string;
  problem_description: string;
  city: string;
  status: Status;
  images: string[] | null;
}


import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { LayoutList, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Solicitudes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceType, setDeviceType] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [city, setCity] = useState("");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 36;

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);

      let query = supabase
        .from("solicitudes")
        .select("*", { count: "exact" });

      // Apply server-side filters
      if (searchTerm) {
        query = query.or(`device_brand.ilike.%${searchTerm}%,device_model.ilike.%${searchTerm}%,problem_description.ilike.%${searchTerm}%`);
      }

      if (deviceType !== "todos") {
        query = query.eq("device_type", deviceType);
      }

      if (status !== "todos") {
        query = query.eq("status", status as any);
      }

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching solicitudes:", error);
      } else {
        setSolicitudes(data || []);
        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }
      }
      setLoading(false);
    };

    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchSolicitudes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, searchTerm, deviceType, status, city]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, deviceType, status, city]);

  // Generate page numbers for pagination
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
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
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

  return (
    <Layout>
      <HowItWorks />

      <div className="container py-8">
        <FilterSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          deviceType={deviceType}
          onDeviceTypeChange={setDeviceType}
          status={status}
          onStatusChange={setStatus}
          city={city}
          onCityChange={setCity}
        />

        <div className="mt-6 mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {loading ? "Cargando..." : `Mostrando ${solicitudes.length} resultados`}
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {solicitudes.map((solicitud) => (
              viewMode === "grid" ? (
                <SolicitudCard
                  key={solicitud.id}
                  id={solicitud.id}
                  deviceName={`${solicitud.device_brand} ${solicitud.device_model}`}
                  deviceType={solicitud.device_type}
                  problem={solicitud.problem_description}
                  city={solicitud.city}
                  status={solicitud.status}
                  imageUrl={solicitud.images?.[0]}
                />
              ) : (
                <div key={solicitud.id} className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/solicitudes/${solicitud.id}`}>
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border">
                    {solicitud.images?.[0] ? (
                      <img src={solicitud.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Sin foto</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{solicitud.device_brand} {solicitud.device_model}</h3>
                        <p className="text-sm text-muted-foreground">{solicitud.device_type} • {solicitud.city}</p>
                      </div>
                      <StatusBadge status={solicitud.status} />
                    </div>
                    <p className="text-sm mt-2 line-clamp-1">{solicitud.problem_description}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {!loading && solicitudes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron solicitudes con los filtros seleccionados.
            </p>
          </div>
        )}

        {/* Pagination UI */}
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
