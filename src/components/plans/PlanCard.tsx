import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Trash2, Pencil, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteTreatmentPlan } from "@/hooks/use-students";
import { EditPlanDialog } from "./EditPlanDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface PlanCardProps {
  plan: Tables<"treatment_plans"> & { students?: { name: string } | null };
  isAdmin: boolean;
  allStudents: { id: string; name: string }[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "نشطة", variant: "default" },
  completed: { label: "مكتملة", variant: "secondary" },
  archived: { label: "مؤرشفة", variant: "secondary" },
};

export function PlanCard({ plan, isAdmin, allStudents }: PlanCardProps) {
  const deletePlan = useDeleteTreatmentPlan();
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const studentName = (plan as any).students?.name ?? "طالب";
  const status = statusMap[plan.status] ?? statusMap.active;
  const academic = plan.academic_plan as Record<string, string> | null;
  const behavioral = plan.behavioral_plan as Record<string, string> | null;
  const indicators = plan.success_indicators as Record<string, any> | null;
  const isGroup = (plan as any).plan_type === "group";
  const targetIds: string[] = (plan as any).target_student_ids ?? [];
  const targetNames = targetIds.map(id => allStudents.find(s => s.id === id)?.name).filter(Boolean);

  const getPlanTitle = () => isGroup ? `خطة علاجية جماعية (${targetNames.join("، ")})` : `الخطة العلاجية - ${studentName}`;

  const buildPlanHtml = () => {
    let html = `<div class="header"><h2>${getPlanTitle()}</h2><p style="font-size:12px;color:#888;">تاريخ: ${new Date(plan.created_at).toLocaleDateString("ar-SA")} • المدة: ${plan.duration_weeks} أسابيع</p></div>`;
    if (plan.case_analysis) html += `<div class="section"><h4>📋 تحليل الحالة</h4><p>${plan.case_analysis}</p></div>`;
    if (academic && Object.keys(academic).length > 0) html += `<div class="section"><h4>📚 الخطة الأكاديمية</h4><ul>${Object.values(academic).map(v => `<li>${v}</li>`).join("")}</ul></div>`;
    if (behavioral && Object.keys(behavioral).length > 0) html += `<div class="section"><h4>🎯 الخطة السلوكية</h4><ul>${Object.values(behavioral).map(v => `<li>${v}</li>`).join("")}</ul></div>`;
    if (plan.counselor_role) html += `<div class="section"><h4>👨‍⚕️ دور المرشد</h4><p>${plan.counselor_role.replace(/\n/g, "<br/>")}</p></div>`;
    if (plan.parent_role) html += `<div class="section"><h4>👨‍👩‍👦 دور ولي الأمر</h4><p>${plan.parent_role.replace(/\n/g, "<br/>")}</p></div>`;
    if (indicators?.target_average) html += `<div class="section" style="background:#f3f4f6;"><h4>📊 مؤشرات النجاح</h4><p>المعدل المستهدف: ${indicators.target_average}%</p>${plan.target_improvement ? `<p>نسبة التحسن: ${plan.target_improvement}%</p>` : ""}</div>`;
    return html;
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    try {
      const planHtml = buildPlanHtml();
      const subject = getPlanTitle();

      // Build plain text for mailto
      const plainText = planHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const truncated = plainText.substring(0, 1800);

      // Open mailto link
      const mailto = `mailto:${encodeURIComponent(emailTo.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
      window.open(mailto, "_blank");

      toast.success("تم فتح تطبيق البريد الإلكتروني لإرسال الخطة");
      setEmailOpen(false);
      setEmailTo("");
    } catch (err) {
      toast.error("حدث خطأ أثناء إعداد البريد");
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrint = () => {
    const planEl = document.getElementById(`plan-${plan.id}`);
    if (!planEl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><title>الخطة العلاجية</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:40px;color:#1a1a1a;direction:rtl}
        h2{font-size:22px;margin-bottom:8px;color:#1e3a5f}h4{font-size:14px;margin-bottom:6px;font-weight:600}
        p,li{font-size:13px;line-height:1.7;color:#444}ul{padding-right:20px;margin-bottom:12px}
        .section{margin-bottom:18px;padding:12px;border:1px solid #e5e7eb;border-radius:8px}
        .header{text-align:center;margin-bottom:24px;border-bottom:2px solid #1e3a5f;padding-bottom:12px}
        .meta{font-size:12px;color:#888;margin-top:4px}.indicators{background:#f3f4f6;padding:12px;border-radius:8px}
        @media print{body{padding:20px}}
      </style></head><body>${planEl.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {isGroup ? (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    خطة جماعية ({targetNames.length} طلاب)
                  </span>
                ) : (
                  <Link to={`/students/${plan.student_id}`} className="text-primary hover:underline">
                    {studentName}
                  </Link>
                )}
              </CardTitle>
              <Badge variant={isGroup ? "default" : "secondary"} className="text-[10px]">
                {isGroup ? "جماعية" : "فردية"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint} title="طباعة">
                <Printer className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEmailOpen(true)} title="إرسال بالبريد">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)} title="تعديل">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="حذف">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من حذف هذه الخطة؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف الخطة العلاجية نهائياً ولا يمكن التراجع.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePlan.mutate(plan.id)}>حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(plan.created_at).toLocaleDateString("ar-SA")} • {plan.duration_weeks} أسابيع
          </p>
          {isGroup && targetNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {targetNames.map((name, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {plan.case_analysis && (
            <div>
              <h4 className="font-semibold text-destructive mb-1">📋 تحليل الحالة</h4>
              <p className="text-muted-foreground whitespace-pre-line">{plan.case_analysis}</p>
            </div>
          )}
          {academic && Object.keys(academic).length > 0 && (
            <div>
              <h4 className="font-semibold text-primary mb-1">📚 الخطة الأكاديمية</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {Object.values(academic).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
          {behavioral && Object.keys(behavioral).length > 0 && (
            <div>
              <h4 className="font-semibold text-accent mb-1">🎯 الخطة السلوكية</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {Object.values(behavioral).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
          {plan.counselor_role && (
            <div>
              <h4 className="font-semibold mb-1">👨‍⚕️ دور المرشد</h4>
              <p className="text-muted-foreground whitespace-pre-line">{plan.counselor_role}</p>
            </div>
          )}
          {plan.parent_role && (
            <div>
              <h4 className="font-semibold mb-1">👨‍👩‍👦 دور ولي الأمر</h4>
              <p className="text-muted-foreground whitespace-pre-line">{plan.parent_role}</p>
            </div>
          )}
          {indicators?.target_average && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-semibold mb-1">📊 مؤشرات النجاح</h4>
              <p className="text-muted-foreground">المعدل المستهدف: {indicators.target_average}%</p>
              {plan.target_improvement && <p className="text-muted-foreground">نسبة التحسن المستهدفة: {plan.target_improvement}%</p>}
            </div>
          )}
        </CardContent>

        {/* Hidden printable content */}
        <div id={`plan-${plan.id}`} className="hidden">
          <div className="header">
            <h2>{getPlanTitle()}</h2>
            <p className="meta">تاريخ الإنشاء: {new Date(plan.created_at).toLocaleDateString("ar-SA")} • المدة: {plan.duration_weeks} أسابيع • الحالة: {status.label}</p>
          </div>
          {plan.case_analysis && <div className="section"><h4>📋 تحليل الحالة</h4><p>{plan.case_analysis}</p></div>}
          {academic && <div className="section"><h4>📚 الخطة الأكاديمية</h4><ul>{Object.values(academic).map(v => `<li>${v}</li>`).join("")}</ul></div>}
          {behavioral && <div className="section"><h4>🎯 الخطة السلوكية</h4><ul>{Object.values(behavioral).map(v => `<li>${v}</li>`).join("")}</ul></div>}
          {plan.counselor_role && <div className="section"><h4>👨‍⚕️ دور المرشد</h4><p>{plan.counselor_role}</p></div>}
          {plan.parent_role && <div className="section"><h4>👨‍👩‍👦 دور ولي الأمر</h4><p>{plan.parent_role}</p></div>}
          {indicators?.target_average && <div className="section indicators"><h4>📊 مؤشرات النجاح</h4><p>المعدل المستهدف: {indicators.target_average}%</p>{plan.target_improvement && <p>نسبة التحسن: {plan.target_improvement}%</p>}</div>}
        </div>
      </Card>

      {isAdmin && <EditPlanDialog plan={plan} open={editOpen} onOpenChange={setEditOpen} />}

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال الخطة العلاجية بالبريد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">أدخل البريد الإلكتروني للمرشد الطلابي أو ولي الأمر لإرسال الخطة</p>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                dir="ltr"
                placeholder="example@email.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
              />
            </div>
            <Button onClick={handleSendEmail} className="w-full" disabled={!emailTo.trim() || emailSending}>
              <Mail className="h-4 w-4 ml-2" />
              {emailSending ? "جارٍ الإعداد..." : "فتح البريد وإرسال الخطة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
