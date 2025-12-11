import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Upload, X, Smartphone, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  solicitudId?: string;
}

export function PhotoUploader({ photos, onPhotosChange, maxPhotos = 5, solicitudId }: PhotoUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a unique session ID for QR code upload
  const uploadSessionId = solicitudId || `temp-${user?.id}-${Date.now()}`;
  const qrUploadUrl = `${window.location.origin}/upload-photos?session=${uploadSessionId}`;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast.error("Debes iniciar sesión para subir fotos");
      return;
    }

    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen válida`);
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} es demasiado grande (máximo 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('images') // Use 'images' bucket as defined in SQL schema
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        newPhotos.push(publicUrl);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast.success(`${newPhotos.length} foto(s) subida(s)`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error("Error al subir las fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    onPhotosChange(photos.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      {/* QR Code option */}
      <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">¿Usas otro dispositivo?</p>
            <p className="text-sm text-muted-foreground">Escanea el QR desde tu móvil</p>
          </div>
        </div>
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              Mostrar QR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Escanea el código QR</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={qrUploadUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Escanea este código con tu móvil para subir fotos directamente desde la cámara
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading || photos.length >= maxPhotos}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {uploading ? "Subiendo..." : "Haz clic para subir fotos"}
            </p>
            <p className="text-sm text-muted-foreground">
              {photos.length}/{maxPhotos} fotos · JPG, PNG hasta 10MB
            </p>
          </div>
          <Button variant="outline" disabled={uploading || photos.length >= maxPhotos}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Subiendo..." : "Seleccionar archivos"}
          </Button>
        </div>
      </div>
    </div>
  );
}