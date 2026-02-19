import { AppLayout } from "@/components/layout/AppLayout";
import { useStudents, useAllGrades, useAllBehaviors } from "@/hooks/use-students";
import { analyzeStudent, calculateWeightedAverage, getRiskLevelInfo } from "@/lib/analysis-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentRiskBadge } from "@/components/students/StudentRiskBadge";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Reports() {
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();

  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;
  const activeStudents = students.filter(s => s.status !== "archived");

  const analyses = activeStudents.map(student => {
    const grades = allGrades.filter(g => g.student_id === student.id);
    const behaviors = allBehaviors.filter(b => b.student_id === student.id);
    return { student, analysis: analyzeStudent(student, grades, behaviors, classAvg) };
  });

  const chartData = analyses.map(({ student, analysis }) => ({
    name: student.name.split(" ").slice(0, 2).join(" "),
    المعدل: analysis.weightedAverage,
    "الخطر الأكاديمي": analysis.academicRiskIndex,
    "الخطر السلوكي": analysis.behavioralRiskIndex,
  }));

  return (
    <AppLayout title="التقارير">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              مقارنة أداء الطلاب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="المعدل" fill="hsl(215, 80%, 28%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="الخطر الأكاديمي" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="الخطر السلوكي" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full report table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">تقرير شامل</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>الصف</TableHead>
                  <TableHead>المعدل</TableHead>
                  <TableHead>المستوى</TableHead>
                  <TableHead>الاتجاه</TableHead>
                  <TableHead>خطر أكاديمي</TableHead>
                  <TableHead>خطر سلوكي</TableHead>
                  <TableHead>الاستقرار</TableHead>
                  <TableHead>مقارنة بالفصل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map(({ student, analysis }) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell className="font-bold">{analysis.weightedAverage}%</TableCell>
                    <TableCell><StudentRiskBadge level={analysis.riskLevel} /></TableCell>
                    <TableCell className={analysis.trend === "up" ? "text-success" : analysis.trend === "down" ? "text-destructive" : ""}>
                      {analysis.trend === "up" ? "↑" : analysis.trend === "down" ? "↓" : "—"}
                    </TableCell>
                    <TableCell>{analysis.academicRiskIndex}%</TableCell>
                    <TableCell>{analysis.behavioralRiskIndex}%</TableCell>
                    <TableCell>{analysis.stabilityScore}%</TableCell>
                    <TableCell className={analysis.classComparison >= 0 ? "text-success" : "text-destructive"}>
                      {analysis.classComparison > 0 ? "+" : ""}{analysis.classComparison}%
                    </TableCell>
                  </TableRow>
                ))}
                {analyses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
