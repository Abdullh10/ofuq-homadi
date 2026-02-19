import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, gradient = "gradient-primary" }: StatCardProps) {
  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", gradient)}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
