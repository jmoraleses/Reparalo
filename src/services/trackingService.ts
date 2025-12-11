export interface TrackingResult {
    status: "created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered";
    location?: string;
    notes?: string;
    timestamp: string;
}

/**
 * Service to handle interaction with shipment carriers.
 * Currently simulates Correos API responses.
 */
export const trackingService = {
    /**
     * Fetches tracking information for a given tracking number.
     * 
     * @param trackingNumber The shipment tracking number
     * @returns Promise<TrackingResult | null>
     */
    async fetchCorreosTracking(trackingNumber: string): Promise<TrackingResult | null> {
        // TODO: Replace with actual API call to Correos
        // Endpoint: https://api.correos.es/...
        // Headers: Authorization: Bearer <token>

        console.log(`[TrackingService] Fetching specific info for: ${trackingNumber}`);

        // SIMULATION MOCK
        // We simulate delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 800));

        // Deterministic mock based on the last char of the tracking number
        const lastChar = trackingNumber.slice(-1);

        const now = new Date().toISOString();

        // Logic for simulation
        if (lastChar === '1') {
            return {
                status: "created",
                location: "Oficina Correos",
                notes: "Admitido en origen",
                timestamp: now
            };
        }

        if (lastChar === '2' || lastChar === '3') {
            return {
                status: "picked_up",
                location: "Centro Logístico Madrid",
                notes: "Clasificado en centro logístico",
                timestamp: now
            };
        }

        if (lastChar === '4' || lastChar === '5') {
            return {
                status: "in_transit",
                location: "En ruta",
                notes: "Salida de oficina de cambio destino",
                timestamp: now
            };
        }

        if (lastChar === '6' || lastChar === '7') {
            return {
                status: "out_for_delivery",
                location: "Unidad de Reparto",
                notes: "En reparto",
                timestamp: now
            };
        }

        if (['8', '9', '0', 'E', 'F'].includes(lastChar)) {
            return {
                status: "delivered",
                location: "Domicilio",
                notes: "Entregado al destinatario",
                timestamp: now
            };
        }

        // Default fallback
        return {
            status: "in_transit",
            location: "En tránsito",
            notes: "En tránsito hacia destino",
            timestamp: now
        };
    }
};
