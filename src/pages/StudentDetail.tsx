import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useStudent, useStudentGrades, useStudentBehaviors, useStudentInterventions, useParentMeetings, useAllGrades } from "@/hooks/use-students";
import { analyzeStudent, calculateWeightedAverage, getRiskLevelInfo } from "@/lib/analysis-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRiskBadge } from "@/components/students/StudentRiskBadge";
import { AddGradeDialog } from "@/components/students/AddGradeDialog";
import { AddBehaviorDialog } from "@/components/students/AddBehaviorDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: student } = useStudent(id);
  const { data: grades = [] } = useStudentGrades(id);
  const { data: behaviors = [] } = useStudentBehaviors(id);
  const { data: interventions = [] } = useStudentInterventions(id);
  const { data: meetings = [] } = useParentMeetings(id);
  const { data: allGrades = [] } = useAllGrades();

  if (!student) return <AppLayout title="تحميل..."><div /></AppLayout>;

  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;
  const analysis = analyzeStudent(student, grades, behaviors, classAvg);
  const riskInfo = getRiskLevelInfo(analysis.riskLevel);

  const chartData = grades.map(g => ({
    week: `أسبوع ${g.week_number}`,
    اختبار: g.exam_score ?? 0,
    واجبات: g.homework_score ?? 0,
    مشاركة: g.participation_score ?? 0,
  }));

  return (
    <AppLayout title={`ملف الطالب: ${student.name}`}>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-primary">{student.name.charAt(0)}</span>
              </div>
              <h3 className="font-bold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.grade} - فصل {student.section}</p>
              <div className="mt-2"><StudentRiskBadge level={analysis.riskLevel} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>المعدل المرجح</span>
                <span className="font-bold">{analysis.weightedAverage}%</span>
              </div>
              <Progress value={analysis.weightedAverage} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>مقارنة بالفصل</span>
                <span className={analysis.classComparison >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                  {analysis.classComparison > 0 ? "+" : ""}{analysis.classComparison}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>الخطر الأكاديمي</span>
                <span className="font-bold">{analysis.academicRiskIndex}%</span>
              </div>
              <Progress value={analysis.academicRiskIndex} className="h-2 [&>div]:bg-destructive" />
              <div className="flex justify-between text-sm">
                <span>الخطر السلوكي</span>
                <span className="font-bold">{analysis.behavioralRiskIndex}%</span>
              </div>
              <Progress value={analysis.behavioralRiskIndex} className="h-2 [&>div]:bg-warning" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>استقرار الأداء</span>
                <span className="font-bold">{analysis.stabilityScore}%</span>
              </div>
              <Progress value={analysis.stabilityScore} className="h-2 [&>div]:bg-info" />
              <div className="flex justify-between text-sm">
                <span>الاتجاه</span>
                <span className={analysis.trend === "up" ? "text-success font-bold" : analysis.trend === "down" ? "text-destructive font-bold" : "text-muted-foreground font-bold"}>
                  {analysis.trend === "up" ? "↑ صعود" : analysis.trend === "down" ? "↓ هبوط" : "— مستقر"}
                  {analysis.trendPercentage !== 0 && ` (${Math.abs(analysis.trendPercentage)}%)`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">تطور الأداء</CardTitle>
            <AddGradeDialog studentId={student.id} />
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="اختبار" stroke="#1e40af" strokeWidth={2} name="اختبار" />
                    <Line type="monotone" dataKey="واجبات" stroke="#16a34a" strokeWidth={2} name="واجبات" />
                    <Line type="monotone" dataKey="مشاركة" stroke="#d97706" strokeWidth={2} name="مشاركة" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  لا توجد درجات بعد. أضف درجات أسبوعية لتتبع الأداء.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="grades" dir="rtl">
          <TabsList>
            <TabsTrigger value="grades">الدرجات</TabsTrigger>
            <TabsTrigger value="behaviors">السلوك</TabsTrigger>
            <TabsTrigger value="interventions">التدخلات</TabsTrigger>
            <TabsTrigger value="meetings">اجتماعات أولياء الأمور</TabsTrigger>
          </TabsList>

          <TabsContent value="grades">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الأسبوع</TableHead>
                      <TableHead>الاختبار</TableHead>
                      <TableHead>الواجبات</TableHead>
                      <TableHead>المشاركة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map(g => (
                      <TableRow key={g.id}>
                        <TableCell>أسبوع {g.week_number}</TableCell>
                        <TableCell>{g.exam_score ?? 0}</TableCell>
                        <TableCell>{g.homework_score ?? 0}</TableCell>
                        <TableCell>{g.participation_score ?? 0}</TableCell>
                      </TableRow>
                    ))}
                    {grades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا توجد درجات</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behaviors">
            <div className="flex justify-end mb-2">
              <AddBehaviorDialog studentId={student.id} />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behaviors.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{b.date}</TableCell>
                        <TableCell>
                          <Badge variant={b.type === "positive" ? "default" : "destructive"}>
                            {b.type === "positive" ? "إيجابي ✅" : "سلبي ❌"}
                          </Badge>
                        </TableCell>
                        <TableCell>{b.description}</TableCell>
                      </TableRow>
                    ))}
                    {behaviors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">لا توجد سجلات</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interventions">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>النتيجة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interventions.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.date}</TableCell>
                        <TableCell>{i.type}</TableCell>
                        <TableCell>{i.description}</TableCell>
                        <TableCell>{i.outcome ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {interventions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا توجد تدخلات</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>التوصيات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{m.date}</TableCell>
                        <TableCell>{m.notes}</TableCell>
                        <TableCell>{m.recommendations ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {meetings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">لا توجد اجتماعات</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
