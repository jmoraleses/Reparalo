// import { TrackingResult } from "./trackingService";

export interface CorreosExpressEvent {
    status: string;
    description: string;
    location: string;
    timestamp: string;
    code: string;
}

export const correosExpressService = {
    async getTrackingHistory(trackingNumber: string): Promise<CorreosExpressEvent[]> {
        console.log(`[CorreosExpress] Fetching history for ${trackingNumber}`);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

        // Deterministic mock based on tracking number
        const lastChar = trackingNumber.slice(-1);
        const day = new Date();

        // Helper to format date relative to now
        const getDate = (hoursAgo: number) => {
            const d = new Date(day.getTime() - hoursAgo * 60 * 60 * 1000);
            return d.toISOString();
        };

        const events: CorreosExpressEvent[] = [
            {
                status: "ADMITIDO",
                description: "ENVIADO POR EL REMITENTE",
                location: "MADRID",
                timestamp: getDate(48),
                code: "ADM"
            },
            {
                status: "EN ARRASTRE",
                description: "EN CAMINO A PLATAFORMA DE DESTINO",
                location: "MADRID - PLATAFORMA",
                timestamp: getDate(36),
                code: "ARR"
            },
            {
                status: "EN REPARTO",
                description: "EN REPARTO",
                location: "BARCELONA",
                timestamp: getDate(4),
                code: "REP"
            }
        ];

        // Customize based on last char to give variety
        if (lastChar === '8' || lastChar === '9') {
            events.unshift({
                status: "ENTREGADO",
                description: "ENTREGADO AL DESTINATARIO",
                location: "BARCELONA",
                timestamp: getDate(1),
                code: "ENT"
            });
        }

        return events;
    }
};
