import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddBehavior } from "@/hooks/use-students";

interface Props {
  studentId: string;
}

export function AddBehaviorDialog({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"positive" | "negative">("positive");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const addBehavior = useAddBehavior();

  const handleSubmit = () => {
    if (!description.trim()) return;
    addBehavior.mutate(
      { student_id: studentId, type, description: description.trim(), date },
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
            <Select value={type} onValueChange={(v: "positive" | "negative") => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">إيجابي ✅</SelectItem>
                <SelectItem value="negative">سلبي ❌</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف السلوك" />
          </div>
          <div>
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!description.trim() || addBehavior.isPending}>
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
