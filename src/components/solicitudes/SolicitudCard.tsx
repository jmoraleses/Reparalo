import { Link } from "react-router-dom";
import { MapPin, Smartphone, Tablet, Laptop, Watch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge, type Status } from "@/components/ui/status-badge";

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  smartphone: Smartphone,
  tablet: Tablet,
  portatil: Laptop,
  smartwatch: Watch,
  otro: Smartphone,
};

interface SolicitudCardProps {
  id: string;
  deviceName: string;
  deviceType: string;
  problem: string;
  city: string;
  status: Status;
  imageUrl?: string;
}

export function SolicitudCard({
  id,
  deviceName,
  deviceType,
  problem,
  city,
  status,
  imageUrl,
}: SolicitudCardProps) {
  const DeviceIcon = deviceIcons[deviceType.toLowerCase()] || Smartphone;
  
  return (
    <Link to={`/solicitud/${id}`}>
      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-card">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={deviceName}
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                <DeviceIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{deviceName}</h3>
            <p className="text-sm text-muted-foreground capitalize">{deviceType}</p>
            <p className="text-sm text-foreground mt-1 line-clamp-2">{problem}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{city}</span>
          </div>
          <StatusBadge status={status} />
        </div>
      </Card>
    </Link>
  );
}
