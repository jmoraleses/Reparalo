import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SolicitudForm, SolicitudFormData } from "@/components/solicitudes/SolicitudForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: SolicitudFormData) => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear una solicitud");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: request, error } = await supabase
        .from('solicitudes')
        .insert({
          user_id: user.id,
          device_type: data.deviceType,
          device_brand: data.brand,
          device_model: data.model,
          city: data.city,
          problem_description: data.problem || "Sin descripción",
          images: data.photos.length > 0 ? data.photos : null,
          status: 'esperando_ofertas'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating solicitud:', error);
        toast.error("Error al crear la solicitud");
        return;
      }

      toast.success("¡Solicitud publicada con éxito!");
      navigate(`/solicitud/${request.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al crear la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nueva solicitud</h1>
          <p className="text-muted-foreground mt-2">
            Describe tu problema y recibe ofertas
          </p>
        </div>

        <SolicitudForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Publicar solicitud"
        />
      </div>
    </Layout>
  );
}
