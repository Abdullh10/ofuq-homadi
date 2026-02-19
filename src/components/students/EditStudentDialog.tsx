import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { useUpdateStudent } from "@/hooks/use-students";
import type { Tables } from "@/integrations/supabase/types";

interface EditStudentDialogProps {
  student: Tables<"students">;
}

export function EditStudentDialog({ student }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade);
  const [section, setSection] = useState(student.section);
  const [notes, setNotes] = useState(student.notes || "");
  const updateStudent = useUpdateStudent();

  useEffect(() => {
    if (open) {
      setName(student.name);
      setGrade(student.grade);
      setSection(student.section);
      setNotes(student.notes || "");
    }
  }, [open, student]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    updateStudent.mutate(
      { id: student.id, name: name.trim(), grade, section, notes: notes || null },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الطالب</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>اسم الطالب</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>الصف</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="الأول الثانوي">الأول الثانوي</SelectItem>
                  <SelectItem value="الثاني الثانوي">الثاني الثانوي</SelectItem>
                  <SelectItem value="الثالث الثانوي">الثالث الثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الشعبة</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["١", "٢", "٣", "٤", "٥", "٦", "٧"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || updateStudent.isPending}>
            {updateStudent.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
