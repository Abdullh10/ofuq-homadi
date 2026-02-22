import { AppLayout } from "@/components/layout/AppLayout";
import { useTreatmentPlans, useStudents, useAllGrades, useAllBehaviors, useAddTreatmentPlan } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";
import { analyzeStudent, calculateWeightedAverage, generateTreatmentPlan } from "@/lib/analysis-engine";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanCard } from "@/components/plans/PlanCard";
import { CreateGroupPlanDialog } from "@/components/plans/CreateGroupPlanDialog";

export default function Plans() {
  const { data: plans = [] } = useTreatmentPlans();
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const addPlan = useAddTreatmentPlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { session } = useAuth();
  const isAdmin = !!session;

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

  const individualPlans = plans.filter(p => (p as any).plan_type !== "group");
  const groupPlans = plans.filter(p => (p as any).plan_type === "group");
  const allStudentsList = students.map(s => ({ id: s.id, name: s.name }));

  return (
    <AppLayout title="الخطط العلاجية">
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex gap-2 justify-end flex-wrap">
            <CreateGroupPlanDialog />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Sparkles className="h-4 w-4 ml-2" />
                  خطة فردية ذكية
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
        )}

        {plans.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p>لا توجد خطط علاجية بعد. {isAdmin ? "أنشئ خطة ذكية لأي طالب يحتاج تدخل." : ""}</p>
          </CardContent></Card>
        ) : (
          <Tabs defaultValue="all" dir="rtl">
            <TabsList>
              <TabsTrigger value="all">الكل ({plans.length})</TabsTrigger>
              <TabsTrigger value="individual">فردية ({individualPlans.length})</TabsTrigger>
              <TabsTrigger value="group">جماعية ({groupPlans.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {plans.map(plan => <PlanCard key={plan.id} plan={plan} isAdmin={isAdmin} allStudents={allStudentsList} />)}
              </div>
            </TabsContent>
            <TabsContent value="individual" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {individualPlans.map(plan => <PlanCard key={plan.id} plan={plan} isAdmin={isAdmin} allStudents={allStudentsList} />)}
              </div>
            </TabsContent>
            <TabsContent value="group" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupPlans.length > 0 ? groupPlans.map(plan => <PlanCard key={plan.id} plan={plan} isAdmin={isAdmin} allStudents={allStudentsList} />) : (
                  <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">لا توجد خطط جماعية بعد</CardContent></Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
