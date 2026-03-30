import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddBehavior } from "@/hooks/use-students";
import { POSITIVE_BEHAVIORS, NEGATIVE_BEHAVIORS } from "./behavior-options";

interface Props {
  studentId: string;
}

export function AddBehaviorDialog({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"positive" | "negative">("positive");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const addBehavior = useAddBehavior();

  const behaviorOptions = type === "positive" ? POSITIVE_BEHAVIORS : NEGATIVE_BEHAVIORS;

  const handleSubmit = () => {
    if (!description) return;
    addBehavior.mutate(
      { student_id: studentId, type, description, date },
      { onSuccess: () => { setOpen(false); setDescription(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 ml-1" />
          تسجيل سلوك
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل سلوك</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-3">
          <div>
            <Label>نوع السلوك</Label>
            <Select value={type} onValueChange={(v: "positive" | "negative") => { setType(v); setDescription(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">إيجابي ✅</SelectItem>
                <SelectItem value="negative">سلبي ❌</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>السلوك</Label>
            <Select value={description} onValueChange={setDescription}>
              <SelectTrigger><SelectValue placeholder="اختر السلوك" /></SelectTrigger>
              <SelectContent>
                {behaviorOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!description || addBehavior.isPending}>
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
