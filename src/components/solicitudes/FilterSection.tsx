import { Search, Filter, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface FilterSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  deviceType: string;
  onDeviceTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
}

export function FilterSection({
  searchTerm,
  onSearchChange,
  deviceType,
  onDeviceTypeChange,
  status,
  onStatusChange,
  city,
  onCityChange,
}: FilterSectionProps) {
  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center gap-2 mb-4 text-foreground">
        <Filter className="h-5 w-5" />
        <span className="font-medium">Filtros de búsqueda</span>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={deviceType} onValueChange={onDeviceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="smartphone">Smartphone</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="portatil">Portátil</SelectItem>
              <SelectItem value="smartwatch">Smartwatch</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="esperando_ofertas">Esperando ofertas</SelectItem>
              <SelectItem value="en_reparacion">En proceso</SelectItem>
              <SelectItem value="reparado">Reparado</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Ciudad..."
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
