import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { POSITIVE_BEHAVIORS, NEGATIVE_BEHAVIORS } from "./behavior-options";

interface Props {
  studentId: string;
  studentName: string;
}

interface BehaviorRow {
  date: string;
  type: string;
  description: string;
  valid: boolean;
  errors: string[];
}

const HEADERS = ["التاريخ", "النوع (إيجابي / سلبي)", "السلوك"];

function downloadTemplate(studentName: string) {
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().split("T")[0];
  const data: any[][] = [HEADERS];
  data.push([today, "إيجابي", POSITIVE_BEHAVIORS[0]]);
  data.push([today, "سلبي", NEGATIVE_BEHAVIORS[0]]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 30 }];

  // Add a reference sheet with all behavior options
  const refData: any[][] = [["السلوكيات الإيجابية", "السلوكيات السلبية"]];
  const maxLen = Math.max(POSITIVE_BEHAVIORS.length, NEGATIVE_BEHAVIORS.length);
  for (let i = 0; i < maxLen; i++) {
    refData.push([POSITIVE_BEHAVIORS[i] ?? "", NEGATIVE_BEHAVIORS[i] ?? ""]);
  }
  const refWs = XLSX.utils.aoa_to_sheet(refData);
  refWs["!cols"] = [{ wch: 25 }, { wch: 25 }];

  XLSX.utils.book_append_sheet(wb, ws, "سلوك");
  XLSX.utils.book_append_sheet(wb, refWs, "قائمة السلوكيات");
  XLSX.writeFile(wb, `سلوك_${studentName}.xlsx`);
}

function parseType(val: string): "positive" | "negative" | null {
  const v = val?.toString().trim();
  if (v === "إيجابي" || v === "positive" || v === "إيجابي ✅") return "positive";
  if (v === "سلبي" || v === "negative" || v === "سلبي ❌") return "negative";
  return null;
}

function validateRow(row: any[]): BehaviorRow {
  const errors: string[] = [];
  const dateStr = row[0]?.toString()?.trim() ?? "";
  const typeStr = row[1]?.toString()?.trim() ?? "";
  const desc = row[2]?.toString()?.trim() ?? "";

  const parsedType = parseType(typeStr);
  if (!parsedType) errors.push("النوع يجب أن يكون 'إيجابي' أو 'سلبي'");
  if (!desc) errors.push("السلوك مطلوب");
  if (!dateStr) errors.push("التاريخ مطلوب");

  // Validate behavior is from predefined list
  if (desc && parsedType) {
    const validList = parsedType === "positive" ? POSITIVE_BEHAVIORS : NEGATIVE_BEHAVIORS;
    if (!validList.includes(desc)) {
      errors.push(`السلوك "${desc}" غير موجود في القائمة المعتمدة`);
    }
  }

  // Try to parse date
  let finalDate = dateStr;
  if (dateStr && !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      errors.push("تنسيق التاريخ غير صحيح");
    } else {
      finalDate = d.toISOString().split("T")[0];
    }
  }

  return {
    date: finalDate,
    type: parsedType ?? typeStr,
    description: desc,
    valid: errors.length === 0,
    errors,
  };
}

export function BulkBehaviorExcelUpload({ studentId, studentName }: Props) {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<BehaviorRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const dataRows = rows.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== ""));
      const validated = dataRows.map(r => {
        // Handle date objects from Excel
        if (r[0] instanceof Date) {
          r[0] = r[0].toISOString().split("T")[0];
        }
        return validateRow(r);
      });
      setParsedRows(validated);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) return;
    setUploading(true);
    try {
      const inserts = validRows.map(r => ({
        student_id: studentId,
        type: r.type,
        description: r.description,
        date: r.date,
      }));
      const { error } = await supabase.from("behaviors").insert(inserts as any);
      if (error) throw error;
      toast.success(`تم رفع ${validRows.length} سلوك بنجاح`);
      qc.invalidateQueries({ queryKey: ["behaviors"] });
      qc.invalidateQueries({ queryKey: ["all-behaviors"] });
      setOpen(false);
      setParsedRows([]);
      setStep("upload");
    } catch {
      toast.error("حدث خطأ أثناء رفع السلوكيات");
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
          <FileSpreadsheet className="h-4 w-4 ml-1" />
          رفع سلوك Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>رفع سلوكيات من ملف إكسل — {studentName}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 mt-3">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  حمّل القالب، عبّئ السلوكيات، ثم ارفعه هنا
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="outline" onClick={() => downloadTemplate(studentName)}>
                    <Download className="h-4 w-4 ml-1" />
                    تحميل القالب
                  </Button>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 ml-1" />
                    رفع الملف
                  </Button>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">ملاحظات:</p>
              <p>• العمود الأول: التاريخ (مثال: 2026-03-30)</p>
              <p>• العمود الثاني: النوع — اكتب "إيجابي" أو "سلبي"</p>
              <p>• العمود الثالث: السلوك (اختر من القائمة في ورقة "قائمة السلوكيات")</p>
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
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>السلوك</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={row.valid ? "" : "bg-destructive/5"}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <Badge variant={row.type === "positive" ? "default" : "destructive"}>
                          {row.type === "positive" ? "إيجابي ✅" : row.type === "negative" ? "سلبي ❌" : row.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
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
              <Button variant="outline" onClick={() => { setStep("upload"); setParsedRows([]); }}>رجوع</Button>
              <Button onClick={handleUpload} disabled={uploading || validCount === 0}>
                {uploading ? "جارٍ الرفع..." : `رفع ${validCount} سلوك`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
