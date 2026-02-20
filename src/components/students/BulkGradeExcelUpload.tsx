import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { MAX_SCORES, TOTAL_MAX } from "@/lib/analysis-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  students: Tables<"students">[];
}

interface BulkGradeRow {
  studentName: string;
  studentId: string | null;
  week_number: number;
  exam_score: number;
  homework_score: number;
  participation_score: number;
  class_interaction_score: number;
  project_score: number;
  practical_score: number;
  valid: boolean;
  errors: string[];
}

const HEADERS = [
  "اسم الطالب",
  "رقم الأسبوع",
  `الاختبار (من ${MAX_SCORES.exam})`,
  `الواجبات (من ${MAX_SCORES.homework})`,
  `المشاركة (من ${MAX_SCORES.participation})`,
  `التفاعل الصفي (من ${MAX_SCORES.class_interaction})`,
  `المشروع (من ${MAX_SCORES.project})`,
  `العملي (من ${MAX_SCORES.practical})`,
];

function downloadTemplate(students: Tables<"students">[]) {
  const wb = XLSX.utils.book_new();
  const data: any[][] = [HEADERS];

  // Add a row for each student with week 1
  for (const s of students) {
    data.push([s.name, 1, 0, 0, 0, 0, 0, 0]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = HEADERS.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, "درجات الفصل");
  XLSX.writeFile(wb, `درجات_الفصل.xlsx`);
}

function matchStudent(name: string, students: Tables<"students">[]): Tables<"students"> | null {
  const trimmed = name?.toString().trim();
  if (!trimmed) return null;
  return students.find(s => s.name.trim() === trimmed) ?? null;
}

function validateRow(row: any[], students: Tables<"students">[]): BulkGradeRow {
  const errors: string[] = [];
  const name = row[0]?.toString()?.trim() ?? "";
  const matched = matchStudent(name, students);
  const week = Number(row[1]) || 0;
  const exam = Number(row[2]) || 0;
  const homework = Number(row[3]) || 0;
  const participation = Number(row[4]) || 0;
  const classInteraction = Number(row[5]) || 0;
  const project = Number(row[6]) || 0;
  const practical = Number(row[7]) || 0;

  if (!matched) errors.push("الطالب غير موجود");
  if (week < 1) errors.push("رقم الأسبوع غير صحيح");
  if (exam < 0 || exam > MAX_SCORES.exam) errors.push(`الاختبار 0-${MAX_SCORES.exam}`);
  if (homework < 0 || homework > MAX_SCORES.homework) errors.push(`الواجبات 0-${MAX_SCORES.homework}`);
  if (participation < 0 || participation > MAX_SCORES.participation) errors.push(`المشاركة 0-${MAX_SCORES.participation}`);
  if (classInteraction < 0 || classInteraction > MAX_SCORES.class_interaction) errors.push(`التفاعل 0-${MAX_SCORES.class_interaction}`);
  if (project < 0 || project > MAX_SCORES.project) errors.push(`المشروع 0-${MAX_SCORES.project}`);
  if (practical < 0 || practical > MAX_SCORES.practical) errors.push(`العملي 0-${MAX_SCORES.practical}`);

  return {
    studentName: name,
    studentId: matched?.id ?? null,
    week_number: week,
    exam_score: exam,
    homework_score: homework,
    participation_score: participation,
    class_interaction_score: classInteraction,
    project_score: project,
    practical_score: practical,
    valid: errors.length === 0,
    errors,
  };
}

export function BulkGradeExcelUpload({ students }: Props) {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<BulkGradeRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [weekNumber, setWeekNumber] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const dataRows = rows.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== ""));
      const validated = dataRows.map(r => validateRow(r, students));
      setParsedRows(validated);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) return;

    setUploading(true);
    try {
      const inserts = validRows.map(r => ({
        student_id: r.studentId!,
        week_number: r.week_number,
        exam_score: r.exam_score,
        homework_score: r.homework_score,
        participation_score: r.participation_score,
        class_interaction_score: r.class_interaction_score,
        project_score: r.project_score,
        practical_score: r.practical_score,
      }));

      const { error } = await supabase.from("grades").insert(inserts as any);
      if (error) throw error;

      toast.success(`تم رفع درجات ${validRows.length} طالب بنجاح`);
      qc.invalidateQueries({ queryKey: ["grades"] });
      qc.invalidateQueries({ queryKey: ["all-grades"] });
      setOpen(false);
      setParsedRows([]);
      setStep("upload");
    } catch {
      toast.error("حدث خطأ أثناء رفع الدرجات");
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsedRows([]); setStep("upload"); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="h-4 w-4 ml-1" />
          رفع درجات الفصل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>رفع درجات الفصل من ملف إكسل</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 mt-3">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  حمّل القالب (يحتوي أسماء جميع الطلاب)، عبّئ الدرجات، ثم ارفعه هنا
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="outline" onClick={() => downloadTemplate(students)}>
                    <Download className="h-4 w-4 ml-1" />
                    تحميل القالب ({students.length} طالب)
                  </Button>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 ml-1" />
                    رفع الملف
                  </Button>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">ملاحظات:</p>
              <p>• القالب يحتوي أسماء جميع الطلاب النشطين ({students.length} طالب)</p>
              <p>• يجب أن يتطابق اسم الطالب في الملف مع اسمه في النظام</p>
              <p>• الدرجات القصوى: اختبار ({MAX_SCORES.exam})، واجبات ({MAX_SCORES.homework})، مشاركة ({MAX_SCORES.participation})، تفاعل ({MAX_SCORES.class_interaction})، مشروع ({MAX_SCORES.project})، عملي ({MAX_SCORES.practical})</p>
              <p>• المجموع الكلي من {TOTAL_MAX} درجة</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 mt-3">
            <div className="flex gap-2 items-center">
              {validCount > 0 && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} صحيحة
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {invalidCount} بها أخطاء
                </Badge>
              )}
            </div>

            <div className="max-h-[400px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الأسبوع</TableHead>
                    <TableHead>اختبار</TableHead>
                    <TableHead>واجبات</TableHead>
                    <TableHead>مشاركة</TableHead>
                    <TableHead>تفاعل</TableHead>
                    <TableHead>مشروع</TableHead>
                    <TableHead>عملي</TableHead>
                    <TableHead>المجموع</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={row.valid ? "" : "bg-destructive/5"}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell>{row.week_number}</TableCell>
                      <TableCell>{row.exam_score}</TableCell>
                      <TableCell>{row.homework_score}</TableCell>
                      <TableCell>{row.participation_score}</TableCell>
                      <TableCell>{row.class_interaction_score}</TableCell>
                      <TableCell>{row.project_score}</TableCell>
                      <TableCell>{row.practical_score}</TableCell>
                      <TableCell className="font-bold">
                        {row.exam_score + row.homework_score + row.participation_score + row.class_interaction_score + row.project_score + row.practical_score}
                      </TableCell>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <span className="text-xs text-destructive">{row.errors.join("، ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setStep("upload"); setParsedRows([]); }}>
                رجوع
              </Button>
              <Button onClick={handleUpload} disabled={uploading || validCount === 0}>
                {uploading ? "جارٍ الرفع..." : `رفع درجات ${validCount} طالب`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
