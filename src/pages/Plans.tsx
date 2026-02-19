import { AppLayout } from "@/components/layout/AppLayout";
import { useTreatmentPlans, useStudents, useAllGrades, useAllBehaviors, useAddTreatmentPlan, useDeleteTreatmentPlan } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Sparkles, Trash2, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { analyzeStudent, calculateWeightedAverage, generateTreatmentPlan } from "@/lib/analysis-engine";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Plans() {
  const { data: plans = [] } = useTreatmentPlans();
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const addPlan = useAddTreatmentPlan();
  const deletePlan = useDeleteTreatmentPlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;

  const handleGeneratePlan = () => {
    if (!selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    const grades = allGrades.filter(g => g.student_id === selectedStudentId);
    const behaviors = allBehaviors.filter(b => b.student_id === selectedStudentId);
    const analysis = analyzeStudent(student, grades, behaviors, classAvg);
    const plan = generateTreatmentPlan(analysis, student.name);

    addPlan.mutate({
      student_id: selectedStudentId,
      case_analysis: plan.case_analysis,
      academic_plan: plan.academic_plan,
      behavioral_plan: plan.behavioral_plan,
      counselor_role: plan.counselor_role,
      parent_role: plan.parent_role,
      success_indicators: plan.success_indicators,
      target_improvement: plan.target_improvement,
      duration_weeks: plan.duration_weeks,
    }, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handlePrint = (planId: string) => {
    const planEl = document.getElementById(`plan-${planId}`);
    if (!planEl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>الخطة العلاجية</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 40px; color: #1a1a1a; direction: rtl; }
          h2 { font-size: 22px; margin-bottom: 8px; color: #1e3a5f; }
          h4 { font-size: 14px; margin-bottom: 6px; font-weight: 600; }
          p, li { font-size: 13px; line-height: 1.7; color: #444; }
          ul { padding-right: 20px; margin-bottom: 12px; }
          .section { margin-bottom: 18px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
          .meta { font-size: 12px; color: #888; margin-top: 4px; }
          .indicators { background: #f3f4f6; padding: 12px; border-radius: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${planEl.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { label: "نشطة", variant: "default" },
    completed: { label: "مكتملة", variant: "secondary" },
    archived: { label: "مؤرشفة", variant: "secondary" },
  };

  return (
    <AppLayout title="الخطط العلاجية">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Sparkles className="h-4 w-4 ml-2" />
                إنشاء خطة علاجية ذكية
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء خطة علاجية ذكية</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">اختر الطالب وسيقوم النظام بتحليل بياناته وإنشاء خطة علاجية شاملة تلقائياً</p>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.status !== "archived").map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleGeneratePlan} className="w-full" disabled={!selectedStudentId || addPlan.isPending}>
                  {addPlan.isPending ? "جارٍ الإنشاء..." : "إنشاء الخطة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {plans.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p>لا توجد خطط علاجية بعد. أنشئ خطة ذكية لأي طالب يحتاج تدخل.</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plans.map(plan => {
              const studentName = (plan as any).students?.name ?? "طالب";
              const status = statusMap[plan.status] ?? statusMap.active;
              const academic = plan.academic_plan as Record<string, string> | null;
              const behavioral = plan.behavioral_plan as Record<string, string> | null;
              const indicators = plan.success_indicators as Record<string, any> | null;

              return (
                <Card key={plan.id} className="animate-fade-in">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        <Link to={`/students/${plan.student_id}`} className="text-primary hover:underline">
                          {studentName}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(plan.id)} title="طباعة / تصدير PDF">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="حذف الخطة">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد من حذف هذه الخطة؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الخطة العلاجية للطالب "{studentName}" نهائياً ولا يمكن التراجع.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deletePlan.mutate(plan.id)}
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.created_at).toLocaleDateString("ar-SA")} • {plan.duration_weeks} أسابيع
                    </p>
                  </CardHeader>

                  {/* Visible card content */}
                  <CardContent className="space-y-3 text-sm">
                    {plan.case_analysis && (
                      <div>
                        <h4 className="font-semibold text-destructive mb-1">📋 تحليل الحالة</h4>
                        <p className="text-muted-foreground">{plan.case_analysis}</p>
                      </div>
                    )}
                    {academic && (
                      <div>
                        <h4 className="font-semibold text-primary mb-1">📚 الخطة الأكاديمية</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {Object.values(academic).map((v, i) => <li key={i}>{v}</li>)}
                        </ul>
                      </div>
                    )}
                    {behavioral && (
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
                        <p className="text-muted-foreground">{plan.counselor_role}</p>
                      </div>
                    )}
                    {plan.parent_role && (
                      <div>
                        <h4 className="font-semibold mb-1">👨‍👩‍👦 دور ولي الأمر</h4>
                        <p className="text-muted-foreground">{plan.parent_role}</p>
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
                      <h2>الخطة العلاجية - {studentName}</h2>
                      <p className="meta">
                        تاريخ الإنشاء: {new Date(plan.created_at).toLocaleDateString("ar-SA")} • المدة: {plan.duration_weeks} أسابيع • الحالة: {status.label}
                      </p>
                    </div>
                    {plan.case_analysis && (
                      <div className="section">
                        <h4>📋 تحليل الحالة</h4>
                        <p>{plan.case_analysis}</p>
                      </div>
                    )}
                    {academic && (
                      <div className="section">
                        <h4>📚 الخطة الأكاديمية</h4>
                        <ul>{Object.values(academic).map((v, i) => `<li>${v}</li>`).join("")}</ul>
                      </div>
                    )}
                    {behavioral && (
                      <div className="section">
                        <h4>🎯 الخطة السلوكية</h4>
                        <ul>{Object.values(behavioral).map((v, i) => `<li>${v}</li>`).join("")}</ul>
                      </div>
                    )}
                    {plan.counselor_role && (
                      <div className="section">
                        <h4>👨‍⚕️ دور المرشد</h4>
                        <p>{plan.counselor_role}</p>
                      </div>
                    )}
                    {plan.parent_role && (
                      <div className="section">
                        <h4>👨‍👩‍👦 دور ولي الأمر</h4>
                        <p>{plan.parent_role}</p>
                      </div>
                    )}
                    {indicators?.target_average && (
                      <div className="section indicators">
                        <h4>📊 مؤشرات النجاح</h4>
                        <p>المعدل المستهدف: {indicators.target_average}%</p>
                        {plan.target_improvement && <p>نسبة التحسن المستهدفة: {plan.target_improvement}%</p>}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
