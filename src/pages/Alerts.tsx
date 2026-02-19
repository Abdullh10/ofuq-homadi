import { AppLayout } from "@/components/layout/AppLayout";
import { useAlerts, useMarkAlertRead, useStudents } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Alerts() {
  const { data: alerts = [] } = useAlerts();
  const markRead = useMarkAlertRead();

  const unread = alerts.filter(a => !a.is_read);
  const read = alerts.filter(a => a.is_read);

  const severityMap: Record<string, { label: string; color: string }> = {
    info: { label: "معلومات", color: "bg-info/10 text-info border-info/30" },
    warning: { label: "تحذير", color: "bg-warning/10 text-warning border-warning/30" },
    critical: { label: "حرج", color: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  return (
    <AppLayout title="الإنذارات">
      <div className="space-y-6">
        {/* Unread */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            إنذارات جديدة ({unread.length})
          </h3>
          {unread.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد إنذارات جديدة 🎉</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {unread.map(alert => {
                const sev = severityMap[alert.severity] ?? severityMap.info;
                const studentName = (alert as any).students?.name ?? "طالب";
                return (
                  <Card key={alert.id} className="animate-fade-in border-r-4" style={{ borderRightColor: alert.severity === "critical" ? "hsl(var(--destructive))" : alert.severity === "warning" ? "hsl(var(--warning))" : "hsl(var(--info))" }}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn("text-xs", sev.color)}>{sev.label}</Badge>
                          <Link to={`/students/${alert.student_id}`} className="text-sm font-bold text-primary hover:underline">
                            {studentName}
                          </Link>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => markRead.mutate(alert.id)}>
                        <CheckCheck className="h-4 w-4 ml-1" />
                        تم القراءة
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Read */}
        {read.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <BellOff className="h-5 w-5 text-muted-foreground" />
              إنذارات سابقة ({read.length})
            </h3>
            <div className="space-y-2">
              {read.map(alert => {
                const studentName = (alert as any).students?.name ?? "طالب";
                return (
                  <Card key={alert.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/students/${alert.student_id}`} className="text-sm font-medium text-primary hover:underline">
                          {studentName}
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleDateString("ar-SA")}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
