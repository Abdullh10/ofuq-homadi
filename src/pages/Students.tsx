import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useStudents, useAllGrades, useAllBehaviors, useDeleteStudent, useUpdateStudent } from "@/hooks/use-students";
import { AddStudentDialog } from "@/components/students/AddStudentDialog";
import { EditStudentDialog } from "@/components/students/EditStudentDialog";
import { StudentRiskBadge } from "@/components/students/StudentRiskBadge";
import { analyzeStudent, calculateWeightedAverage } from "@/lib/analysis-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Search, Eye, Trash2, Archive, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Students() {
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent();

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;

  const studentsWithAnalysis = students.map(student => {
    const grades = allGrades.filter(g => g.student_id === student.id);
    const behaviors = allBehaviors.filter(b => b.student_id === student.id);
    return { student, analysis: analyzeStudent(student, grades, behaviors, classAvg) };
  });

  const filtered = studentsWithAnalysis.filter(({ student, analysis }) => {
    if (search && !student.name.includes(search)) return false;
    if (gradeFilter !== "all" && student.grade !== gradeFilter) return false;
    if (sectionFilter !== "all" && student.section !== sectionFilter) return false;
    if (riskFilter !== "all" && analysis.riskLevel !== riskFilter) return false;
    if (statusFilter !== "all" && student.status !== statusFilter) return false;
    return true;
  });

  return (
    <AppLayout title="إدارة الطلاب">
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث بالاسم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
              </div>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="الصف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفوف</SelectItem>
                  <SelectItem value="الأول الثانوي">الأول الثانوي</SelectItem>
                  <SelectItem value="الثاني الثانوي">الثاني الثانوي</SelectItem>
                  <SelectItem value="الثالث الثانوي">الثالث الثانوي</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="الشعبة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشعب</SelectItem>
                  {["١", "٢", "٣", "٤", "٥", "٦", "٧"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="المستوى" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="excellent">متفوق</SelectItem>
                  <SelectItem value="stable">مستقر</SelectItem>
                  <SelectItem value="needs_intervention">يحتاج تدخل</SelectItem>
                  <SelectItem value="critical">خطر حرج</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                  <SelectItem value="monitored">تحت المراقبة</SelectItem>
                </SelectContent>
              </Select>
              <AddStudentDialog />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الصف</TableHead>
                  <TableHead>الشعبة</TableHead>
                  <TableHead>المعدل</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>الاتجاه</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد نتائج</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(({ student, analysis }) => (
                    <TableRow key={student.id} className="animate-fade-in">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell className="font-bold">{analysis.weightedAverage}%</TableCell>
                      <TableCell><StudentRiskBadge level={analysis.riskLevel} /></TableCell>
                      <TableCell>
                        <span className={analysis.trend === "up" ? "text-success" : analysis.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                          {analysis.trend === "up" ? "↑ صعود" : analysis.trend === "down" ? "↓ هبوط" : "— مستقر"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : student.status === "monitored" ? "destructive" : "secondary"}>
                          {student.status === "active" ? "نشط" : student.status === "monitored" ? "تحت المراقبة" : "مؤرشف"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={`/students/${student.id}`}>
                            <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <EditStudentDialog student={student} />
                          <Button size="icon" variant="ghost"
                            onClick={() => updateStudent.mutate({ id: student.id, status: "archived" })}>
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive"
                            onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) deleteStudent.mutate(student.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
