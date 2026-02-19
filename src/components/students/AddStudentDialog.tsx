import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useAddStudent } from "@/hooks/use-students";

export function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("الأول الثانوي");
  const [section, setSection] = useState("١");
  const [notes, setNotes] = useState("");
  const addStudent = useAddStudent();

  const handleSubmit = () => {
    if (!name.trim()) return;
    addStudent.mutate(
      { name: name.trim(), grade, section, notes: notes || null },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setNotes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة طالب
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>اسم الطالب</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسم الطالب" />
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
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || addStudent.isPending}>
            {addStudent.isPending ? "جارٍ الإضافة..." : "إضافة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
