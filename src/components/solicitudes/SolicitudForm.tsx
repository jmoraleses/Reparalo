
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Smartphone,
    Tablet,
    Laptop,
    Watch,
    HelpCircle,
    Camera,
    Check,
    ArrowLeft,
    ArrowRight,
    MapPin,
    Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PhotoUploader } from "@/components/solicitudes/PhotoUploader";

export const deviceTypes = [
    { id: "smartphone", label: "Smartphone", icon: Smartphone },
    { id: "tablet", label: "Tablet", icon: Tablet },
    { id: "portatil", label: "Portátil", icon: Laptop },
    { id: "smartwatch", label: "Smartwatch", icon: Watch },
    { id: "otro", label: "Otro", icon: HelpCircle },
];

const steps = [
    { id: "dispositivo", label: "Dispositivo", icon: Smartphone },
    { id: "fotos", label: "Fotos", icon: Camera },
    { id: "confirmar", label: "Confirmar", icon: Check },
];

export interface SolicitudFormData {
    deviceType: string;
    brand: string;
    model: string;
    city: string;
    problem: string;
    photos: string[];
}

interface SolicitudFormProps {
    initialData?: SolicitudFormData;
    onSubmit: (data: SolicitudFormData) => Promise<void>;
    isSubmitting?: boolean;
    submitLabel?: string;
}

export function SolicitudForm({
    initialData,
    onSubmit,
    isSubmitting = false,
    submitLabel = "Publicar solicitud"
}: SolicitudFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<SolicitudFormData>(initialData || {
        deviceType: "",
        brand: "",
        model: "",
        city: "",
        problem: "",
        photos: [],
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleDeviceTypeSelect = (type: string) => {
        setFormData((prev) => ({ ...prev, deviceType: type }));
    };

    const handleNext = () => {
        if (currentStep === 0) {
            if (!formData.deviceType || !formData.brand || !formData.model || !formData.city) {
                toast.error("Por favor completa todos los campos");
                return;
            }
        }

        if (currentStep === 1) {
            if (!formData.photos || formData.photos.length === 0) {
                toast.error("Debes subir al menos una foto del dispositivo para ayudar a los talleres");
                return;
            }
        }

        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        await onSubmit(formData);
    };

    return (
        <div className="w-full">
            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-4 mb-8 overflow-x-auto pb-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                index === currentStep
                                    ? "bg-secondary text-secondary-foreground"
                                    : index < currentStep
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted/50 text-muted-foreground"
                            )}
                        >
                            {index < currentStep ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <step.icon className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="w-8 h-0.5 bg-border hidden sm:block" />
                        )}
                    </div>
                ))}
            </div>

            <Card className="p-6 bg-card">
                {currentStep === 0 && (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-foreground mb-3 block">Tipo de dispositivo</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {deviceTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleDeviceTypeSelect(type.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                                            formData.deviceType === type.id
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <type.icon className="h-6 w-6 text-foreground" />
                                        <span className="text-sm text-foreground">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="brand" className="text-foreground">Marca</Label>
                            <Input
                                id="brand"
                                placeholder="Ej: Apple, Samsung, Xiaomi, Huawei..."
                                value={formData.brand}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, brand: e.target.value }))
                                }
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="model" className="text-foreground">Modelo del dispositivo</Label>
                            <Input
                                id="model"
                                placeholder="Ej: iPhone 14 Pro, Galaxy S23, Redmi Note 12..."
                                value={formData.model}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, model: e.target.value }))
                                }
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="city" className="text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Tu ciudad (para calcular envío)
                            </Label>
                            <Input
                                id="city"
                                placeholder="Ej: Madrid, Barcelona, Valencia..."
                                value={formData.city}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                                }
                                className="mt-2"
                            />
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Fotos del dispositivo
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Sube fotos que muestren el problema. Esto ayudará a los talleres a darte un presupuesto más preciso.
                            </p>
                        </div>

                        <PhotoUploader
                            photos={formData.photos}
                            onPhotosChange={(photos) => setFormData((prev) => ({ ...prev, photos }))}
                            maxPhotos={5}
                        />

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800">Consejos para mejores fotos:</p>
                                    <ul className="text-sm text-amber-700 mt-1 space-y-1">
                                        <li>• Buena iluminación, sin reflejos</li>
                                        <li>• Muestra claramente el daño o problema</li>
                                        <li>• Incluye diferentes ángulos si es posible</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="problem" className="text-foreground">
                                Describe el problema (opcional)
                            </Label>
                            <Textarea
                                id="problem"
                                placeholder="Ej: La pantalla no enciende, la batería dura poco, el botón de encendido no funciona..."
                                value={formData.problem}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, problem: e.target.value }))
                                }
                                className="mt-2 min-h-[100px]"
                            />
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Confirma tu solicitud
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Revisa los datos antes de publicar tu solicitud.
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {formData.brand} {formData.model}
                                    </h3>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {deviceTypes.find((t) => t.id === formData.deviceType)?.label}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{formData.city}</span>
                            </div>

                            {formData.problem && (
                                <div>
                                    <p className="text-sm font-medium text-foreground">Descripción del problema:</p>
                                    <p className="text-sm text-muted-foreground">{formData.problem}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-primary/10 rounded-lg p-4">
                            <p className="text-sm text-foreground">
                                <strong>¿Qué pasa después?</strong> Los talleres verán tu solicitud y podrán enviarte ofertas.
                                Podrás comparar precios y valoraciones antes de elegir.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                    {currentStep > 0 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Atrás
                        </Button>
                    ) : (
                        <div />
                    )}

                    {currentStep < steps.length - 1 ? (
                        <Button onClick={handleNext}>
                            Continuar
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                        >
                            {isSubmitting ? "Guardando..." : submitLabel}
                            <Check className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
