import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import { useStudents, useAllGrades, useAllBehaviors, useAddTreatmentPlan } from "@/hooks/use-students";
import { analyzeStudent, calculateWeightedAverage, generateTreatmentPlan } from "@/lib/analysis-engine";
import type { Tables } from "@/integrations/supabase/types";

export function CreateGroupPlanDialog() {
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const addPlan = useAddTreatmentPlan();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualData, setManualData] = useState({
    case_analysis: "",
    counselor_role: "",
    parent_role: "",
    duration_weeks: 4,
    target_improvement: 15,
    academic_items: [""],
    behavioral_items: [""],
  });

  const activeStudents = students.filter(s => s.status !== "archived");
  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAtRisk = () => {
    const atRiskIds = activeStudents.filter(s => {
      const grades = allGrades.filter(g => g.student_id === s.id);
      const behaviors = allBehaviors.filter(b => b.student_id === s.id);
      const analysis = analyzeStudent(s, grades, behaviors, classAvg);
      return analysis.riskLevel === "critical" || analysis.riskLevel === "needs_intervention";
    }).map(s => s.id);
    setSelectedIds(atRiskIds);
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;

    if (mode === "auto") {
      // Generate a shared plan based on the average analysis of selected students
      const names = selectedIds.map(id => students.find(s => s.id === id)?.name ?? "").filter(Boolean);
      const analyses = selectedIds.map(id => {
        const student = students.find(s => s.id === id)!;
        const grades = allGrades.filter(g => g.student_id === id);
        const behaviors = allBehaviors.filter(b => b.student_id === id);
        return analyzeStudent(student, grades, behaviors, classAvg);
      });

      // Average analysis
      const avgAnalysis = {
        ...analyses[0],
        weightedAverage: analyses.reduce((s, a) => s + a.weightedAverage, 0) / analyses.length,
        academicRiskIndex: analyses.reduce((s, a) => s + a.academicRiskIndex, 0) / analyses.length,
        behavioralRiskIndex: analyses.reduce((s, a) => s + a.behavioralRiskIndex, 0) / analyses.length,
        stabilityScore: analyses.reduce((s, a) => s + a.stabilityScore, 0) / analyses.length,
        classComparison: analyses.reduce((s, a) => s + a.classComparison, 0) / analyses.length,
      };

      const plan = generateTreatmentPlan(avgAnalysis, `مجموعة (${names.length} طلاب: ${names.slice(0, 3).join("، ")}${names.length > 3 ? "..." : ""})`);

      addPlan.mutate({
        student_id: selectedIds[0],
        plan_type: "group" as any,
        target_student_ids: selectedIds as any,
        case_analysis: plan.case_analysis,
        academic_plan: plan.academic_plan,
        behavioral_plan: plan.behavioral_plan,
        counselor_role: plan.counselor_role,
        parent_role: plan.parent_role,
        success_indicators: plan.success_indicators,
        target_improvement: plan.target_improvement,
        duration_weeks: plan.duration_weeks,
      }, { onSuccess: () => { setOpen(false); setSelectedIds([]); } });
    } else {
      // Manual
      const academicPlan: Record<string, string> = {};
      manualData.academic_items.filter(Boolean).forEach((v, i) => { academicPlan[`item_${i}`] = v; });
      const behavioralPlan: Record<string, string> = {};
      manualData.behavioral_items.filter(Boolean).forEach((v, i) => { behavioralPlan[`item_${i}`] = v; });

      addPlan.mutate({
        student_id: selectedIds[0],
        plan_type: "group" as any,
        target_student_ids: selectedIds as any,
        case_analysis: manualData.case_analysis,
        academic_plan: academicPlan,
        behavioral_plan: behavioralPlan,
        counselor_role: manualData.counselor_role,
        parent_role: manualData.parent_role,
        duration_weeks: manualData.duration_weeks,
        target_improvement: manualData.target_improvement,
      }, { onSuccess: () => { setOpen(false); setSelectedIds([]); } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 ml-2" />
          خطة جماعية
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء خطة علاجية جماعية</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Student Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">اختر الطلاب ({selectedIds.length} محدد)</Label>
              <Button variant="link" size="sm" onClick={selectAtRisk} className="text-destructive p-0 h-auto">تحديد المعرضين للخطر</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {activeStudents.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted p-1.5 rounded">
                  <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          {/* Mode selection */}
          <div className="flex gap-2">
            <Button variant={mode === "auto" ? "default" : "outline"} size="sm" onClick={() => setMode("auto")}>
              <Sparkles className="h-3.5 w-3.5 ml-1" /> ذكية (تلقائي)
            </Button>
            <Button variant={mode === "manual" ? "default" : "outline"} size="sm" onClick={() => setMode("manual")}>
              يدوية
            </Button>
          </div>

          {mode === "auto" ? (
            <p className="text-sm text-muted-foreground">
              سيقوم النظام بتحليل بيانات الطلاب المحددين وإنشاء خطة علاجية جماعية شاملة تناسب احتياجاتهم المشتركة.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>تحليل الحالة</Label>
                <Textarea value={manualData.case_analysis} onChange={e => setManualData({ ...manualData, case_analysis: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>الخطة الأكاديمية</Label>
                {manualData.academic_items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={item} onChange={e => {
                      const copy = [...manualData.academic_items];
                      copy[i] = e.target.value;
                      setManualData({ ...manualData, academic_items: copy });
                    }} className="flex-1" />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setManualData({ ...manualData, academic_items: manualData.academic_items.filter((_, j) => j !== i) })}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setManualData({ ...manualData, academic_items: [...manualData.academic_items, ""] })}>+ بند</Button>
              </div>
              <div className="space-y-2">
                <Label>الخطة السلوكية</Label>
                {manualData.behavioral_items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={item} onChange={e => {
                      const copy = [...manualData.behavioral_items];
                      copy[i] = e.target.value;
                      setManualData({ ...manualData, behavioral_items: copy });
                    }} className="flex-1" />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setManualData({ ...manualData, behavioral_items: manualData.behavioral_items.filter((_, j) => j !== i) })}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setManualData({ ...manualData, behavioral_items: [...manualData.behavioral_items, ""] })}>+ بند</Button>
              </div>
              <div className="space-y-1.5">
                <Label>دور المرشد</Label>
                <Textarea value={manualData.counselor_role} onChange={e => setManualData({ ...manualData, counselor_role: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>دور ولي الأمر</Label>
                <Textarea value={manualData.parent_role} onChange={e => setManualData({ ...manualData, parent_role: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>المدة (أسابيع)</Label>
                  <Input type="number" min={1} value={manualData.duration_weeks} onChange={e => setManualData({ ...manualData, duration_weeks: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>نسبة التحسن %</Label>
                  <Input type="number" min={1} value={manualData.target_improvement} onChange={e => setManualData({ ...manualData, target_improvement: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} className="w-full" disabled={selectedIds.length === 0 || addPlan.isPending}>
            {addPlan.isPending ? "جارٍ الإنشاء..." : `إنشاء خطة جماعية (${selectedIds.length} طالب)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
