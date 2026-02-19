import { AppLayout } from "@/components/layout/AppLayout";
import { useTreatmentPlans, useStudents, useAllGrades, useAllBehaviors, useAddTreatmentPlan } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { analyzeStudent, calculateWeightedAverage, generateTreatmentPlan } from "@/lib/analysis-engine";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Plans() {
  const { data: plans = [] } = useTreatmentPlans();
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const addPlan = useAddTreatmentPlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

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
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.created_at).toLocaleDateString("ar-SA")} • {plan.duration_weeks} أسابيع
                    </p>
                  </CardHeader>
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
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
