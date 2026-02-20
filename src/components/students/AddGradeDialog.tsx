import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAddGrade } from "@/hooks/use-students";
import { MAX_SCORES } from "@/lib/analysis-engine";

interface Props {
  studentId: string;
}

export function AddGradeDialog({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(1);
  const [exam, setExam] = useState(0);
  const [homework, setHomework] = useState(0);
  const [participation, setParticipation] = useState(0);
  const [classInteraction, setClassInteraction] = useState(0);
  const [project, setProject] = useState(0);
  const [practical, setPractical] = useState(0);
  const addGrade = useAddGrade();

  const handleSubmit = () => {
    addGrade.mutate(
      {
        student_id: studentId,
        week_number: week,
        exam_score: exam,
        homework_score: homework,
        participation_score: participation,
        class_interaction_score: classInteraction,
        project_score: project,
        practical_score: practical,
      } as any,
      { onSuccess: () => { setOpen(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 ml-1" />
          إضافة درجة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة درجة أسبوعية</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-3">
          <div>
            <Label>رقم الأسبوع</Label>
            <Input type="number" min={1} value={week} onChange={e => setWeek(+e.target.value)} />
          </div>
          <div>
            <Label>الاختبار (من {MAX_SCORES.exam})</Label>
            <Input type="number" min={0} max={MAX_SCORES.exam} value={exam} onChange={e => setExam(+e.target.value)} />
          </div>
          <div>
            <Label>الواجبات (من {MAX_SCORES.homework})</Label>
            <Input type="number" min={0} max={MAX_SCORES.homework} value={homework} onChange={e => setHomework(+e.target.value)} />
          </div>
          <div>
            <Label>المشاركة (من {MAX_SCORES.participation})</Label>
            <Input type="number" min={0} max={MAX_SCORES.participation} value={participation} onChange={e => setParticipation(+e.target.value)} />
          </div>
          <div>
            <Label>التفاعل الصفي (من {MAX_SCORES.class_interaction})</Label>
            <Input type="number" min={0} max={MAX_SCORES.class_interaction} value={classInteraction} onChange={e => setClassInteraction(+e.target.value)} />
          </div>
          <div>
            <Label>المشروع (من {MAX_SCORES.project})</Label>
            <Input type="number" min={0} max={MAX_SCORES.project} value={project} onChange={e => setProject(+e.target.value)} />
          </div>
          <div>
            <Label>العملي (من {MAX_SCORES.practical})</Label>
            <Input type="number" min={0} max={MAX_SCORES.practical} value={practical} onChange={e => setPractical(+e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={addGrade.isPending}>
            {addGrade.isPending ? "جارٍ الحفظ..." : "حفظ الدرجة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
