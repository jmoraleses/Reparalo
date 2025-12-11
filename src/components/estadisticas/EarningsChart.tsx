import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Reparacion {
  id: string;
  created_at: string;
  final_quote: number | null;
  status: string;
}

interface EarningsChartProps {
  reparaciones: Reparacion[];
}

export function EarningsChart({ reparaciones }: EarningsChartProps) {
  const chartData = useMemo(() => {
    const completadas = reparaciones.filter(r => r.status === "completado");
    
    // Group by month
    const monthlyData: Record<string, number> = {};
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[key] = 0;
    }
    
    // Sum earnings by month
    completadas.forEach(rep => {
      const date = new Date(rep.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyData) {
        monthlyData[key] += rep.final_quote || 0;
      }
    });
    
    // Convert to array format for recharts
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    return Object.entries(monthlyData).map(([key, total]) => {
      const [year, month] = key.split("-");
      return {
        name: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
        ganancias: total,
      };
    });
  }, [reparaciones]);

  const maxValue = Math.max(...chartData.map(d => d.ganancias), 100);

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Evolución de Ganancias (últimos 6 meses)
      </h3>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGanancias" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}€`}
              domain={[0, maxValue]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              formatter={(value: number) => [`${value.toLocaleString()}€`, "Ganancias"]}
            />
            <Area
              type="monotone"
              dataKey="ganancias"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGanancias)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
