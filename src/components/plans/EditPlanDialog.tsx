import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateTreatmentPlan } from "@/hooks/use-students";
import { SuggestionChips } from "./SuggestionChips";
import { ACADEMIC_SUGGESTIONS, BEHAVIORAL_SUGGESTIONS, COUNSELOR_SUGGESTIONS, PARENT_SUGGESTIONS } from "./plan-suggestions";
import type { Tables } from "@/integrations/supabase/types";

interface EditPlanDialogProps {
  plan: Tables<"treatment_plans"> & { students?: { name: string } | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlanDialog({ plan, open, onOpenChange }: EditPlanDialogProps) {
  const updatePlan = useUpdateTreatmentPlan();
  const [caseAnalysis, setCaseAnalysis] = useState(plan.case_analysis ?? "");
  const [counselorRole, setCounselorRole] = useState(plan.counselor_role ?? "");
  const [parentRole, setParentRole] = useState(plan.parent_role ?? "");
  const [durationWeeks, setDurationWeeks] = useState(plan.duration_weeks ?? 4);
  const [targetImprovement, setTargetImprovement] = useState(plan.target_improvement ?? 15);

  const academic = (plan.academic_plan as Record<string, string> | null) ?? {};
  const behavioral = (plan.behavioral_plan as Record<string, string> | null) ?? {};

  const [academicItems, setAcademicItems] = useState<string[]>(Object.values(academic));
  const [behavioralItems, setBehavioralItems] = useState<string[]>(Object.values(behavioral));
  const [counselorItems, setCounselorItems] = useState<string[]>(
    (plan.counselor_role ?? "").split("\n").map(l => l.replace(/^[•\-\s]+/, "").trim()).filter(Boolean)
  );
  const [parentItems, setParentItems] = useState<string[]>(
    (plan.parent_role ?? "").split("\n").map(l => l.replace(/^[•\-\s]+/, "").trim()).filter(Boolean)
  );

  useEffect(() => {
    setCaseAnalysis(plan.case_analysis ?? "");
    setDurationWeeks(plan.duration_weeks ?? 4);
    setTargetImprovement(plan.target_improvement ?? 15);
    setAcademicItems(Object.values((plan.academic_plan as Record<string, string> | null) ?? {}));
    setBehavioralItems(Object.values((plan.behavioral_plan as Record<string, string> | null) ?? {}));
    setCounselorItems((plan.counselor_role ?? "").split("\n").map(l => l.replace(/^[•\-\s]+/, "").trim()).filter(Boolean));
    setParentItems((plan.parent_role ?? "").split("\n").map(l => l.replace(/^[•\-\s]+/, "").trim()).filter(Boolean));
  }, [plan]);

  const updateItem = (arr: string[], setArr: (v: string[]) => void, idx: number, val: string) => {
    const copy = [...arr]; copy[idx] = val; setArr(copy);
  };
  const removeItem = (arr: string[], setArr: (v: string[]) => void, idx: number) => {
    setArr(arr.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const academicPlan: Record<string, string> = {};
    academicItems.filter(Boolean).forEach((v, i) => { academicPlan[`item_${i}`] = v; });
    const behavioralPlan: Record<string, string> = {};
    behavioralItems.filter(Boolean).forEach((v, i) => { behavioralPlan[`item_${i}`] = v; });

    updatePlan.mutate({
      id: plan.id,
      case_analysis: caseAnalysis,
      counselor_role: counselorItems.filter(Boolean).map(i => `• ${i}`).join("\n"),
      parent_role: parentItems.filter(Boolean).map(i => `• ${i}`).join("\n"),
      duration_weeks: durationWeeks,
      target_improvement: targetImprovement,
      academic_plan: academicPlan,
      behavioral_plan: behavioralPlan,
    }, { onSuccess: () => onOpenChange(false) });
  };

  const renderItemList = (
    label: string, emoji: string, items: string[],
    setItems: (v: string[]) => void, suggestions: string[]
  ) => (
    <div className="space-y-2">
      <Label className="font-semibold">{emoji} {label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Textarea value={item} onChange={e => updateItem(items, setItems, i, e.target.value)} rows={1} className="flex-1 min-h-[36px]" />
          <Button variant="ghost" size="icon" className="text-destructive shrink-0 mt-0.5" onClick={() => removeItem(items, setItems, i)}>✕</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, ""])}>+ إضافة بند يدوي</Button>
      <SuggestionChips suggestions={suggestions} selectedItems={items} onAdd={(s) => setItems([...items, s])} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل الخطة العلاجية — {(plan as any).students?.name ?? "طالب"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label className="font-semibold">📋 تحليل الحالة</Label>
            <Textarea value={caseAnalysis} onChange={e => setCaseAnalysis(e.target.value)} rows={4} />
          </div>

          {renderItemList("الخطة الأكاديمية", "📚", academicItems, setAcademicItems, ACADEMIC_SUGGESTIONS)}
          {renderItemList("الخطة السلوكية", "🎯", behavioralItems, setBehavioralItems, BEHAVIORAL_SUGGESTIONS)}
          {renderItemList("دور المرشد", "👨‍⚕️", counselorItems, setCounselorItems, COUNSELOR_SUGGESTIONS)}
          {renderItemList("دور ولي الأمر", "👨‍👩‍👦", parentItems, setParentItems, PARENT_SUGGESTIONS)}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>المدة (أسابيع)</Label>
              <Input type="number" min={1} max={24} value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>نسبة التحسن المستهدفة %</Label>
              <Input type="number" min={1} max={100} value={targetImprovement} onChange={e => setTargetImprovement(Number(e.target.value))} />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={updatePlan.isPending}>
            {updatePlan.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
