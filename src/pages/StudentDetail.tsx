import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useStudent, useStudentGrades, useStudentBehaviors, useStudentInterventions,
  useParentMeetings, useAllGrades, useAllBehaviors, useUpdateGrade, useDeleteGrade,
  useAddTreatmentPlan, useStudentTreatmentPlans, useAddIntervention, useAddParentMeeting,
} from "@/hooks/use-students";
import { analyzeStudent, calculateWeightedAverage, getRiskLevelInfo, generateTreatmentPlan } from "@/lib/analysis-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRiskBadge } from "@/components/students/StudentRiskBadge";
import { AddGradeDialog } from "@/components/students/AddGradeDialog";
import { AddBehaviorDialog } from "@/components/students/AddBehaviorDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Sparkles, Plus, Save, X } from "lucide-react";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: student } = useStudent(id);
  const { data: grades = [] } = useStudentGrades(id);
  const { data: behaviors = [] } = useStudentBehaviors(id);
  const { data: interventions = [] } = useStudentInterventions(id);
  const { data: meetings = [] } = useParentMeetings(id);
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const { data: plans = [] } = useStudentTreatmentPlans(id);
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const addPlan = useAddTreatmentPlan();
  const addIntervention = useAddIntervention();
  const addMeeting = useAddParentMeeting();

  // Inline editing state
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ exam: 0, homework: 0, participation: 0 });

  // Intervention dialog
  const [intDialog, setIntDialog] = useState(false);
  const [intType, setIntType] = useState("");
  const [intDesc, setIntDesc] = useState("");
  const [intOutcome, setIntOutcome] = useState("");

  // Meeting dialog
  const [meetDialog, setMeetDialog] = useState(false);
  const [meetNotes, setMeetNotes] = useState("");
  const [meetRec, setMeetRec] = useState("");

  if (!student) return <AppLayout title="تحميل..."><div /></AppLayout>;

  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;
  const analysis = analyzeStudent(student, grades, behaviors, classAvg);

  const chartData = grades.map(g => ({
    week: `أسبوع ${g.week_number}`,
    اختبار: g.exam_score ?? 0,
    واجبات: g.homework_score ?? 0,
    مشاركة: g.participation_score ?? 0,
  }));

  const startEdit = (g: typeof grades[0]) => {
    setEditingGradeId(g.id);
    setEditValues({ exam: g.exam_score ?? 0, homework: g.homework_score ?? 0, participation: g.participation_score ?? 0 });
  };

  const saveEdit = () => {
    if (!editingGradeId) return;
    updateGrade.mutate(
      { id: editingGradeId, exam_score: editValues.exam, homework_score: editValues.homework, participation_score: editValues.participation },
      { onSuccess: () => setEditingGradeId(null) }
    );
  };

  const handleGeneratePlan = () => {
    const studentBehaviors = allBehaviors.filter(b => b.student_id === student.id);
    const a = analyzeStudent(student, grades, studentBehaviors, classAvg);
    const plan = generateTreatmentPlan(a, student.name);
    addPlan.mutate({
      student_id: student.id,
      case_analysis: plan.case_analysis,
      academic_plan: plan.academic_plan,
      behavioral_plan: plan.behavioral_plan,
      counselor_role: plan.counselor_role,
      parent_role: plan.parent_role,
      success_indicators: plan.success_indicators,
      target_improvement: plan.target_improvement,
      duration_weeks: plan.duration_weeks,
    });
  };

  const handleAddIntervention = () => {
    if (!intType.trim() || !intDesc.trim()) return;
    addIntervention.mutate(
      { student_id: student.id, type: intType, description: intDesc, outcome: intOutcome || null },
      { onSuccess: () => { setIntDialog(false); setIntType(""); setIntDesc(""); setIntOutcome(""); } }
    );
  };

  const handleAddMeeting = () => {
    if (!meetNotes.trim()) return;
    addMeeting.mutate(
      { student_id: student.id, notes: meetNotes, recommendations: meetRec || null },
      { onSuccess: () => { setMeetDialog(false); setMeetNotes(""); setMeetRec(""); } }
    );
  };

  return (
    <AppLayout title={`ملف الطالب: ${student.name}`}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-primary">{student.name.charAt(0)}</span>
              </div>
              <h3 className="font-bold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.grade} - شعبة {student.section}</p>
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

        {/* Generate Plan Button */}
        {(analysis.riskLevel === "needs_intervention" || analysis.riskLevel === "critical") && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-warning">⚠️ هذا الطالب يحتاج تدخل</p>
                <p className="text-sm text-muted-foreground">أنشئ خطة علاجية ذكية بناءً على تحليل بياناته</p>
              </div>
              <Button onClick={handleGeneratePlan} disabled={addPlan.isPending} className="shrink-0">
                <Sparkles className="h-4 w-4 ml-2" />
                {addPlan.isPending ? "جارٍ الإنشاء..." : "إنشاء خطة علاجية"}
              </Button>
            </CardContent>
          </Card>
        )}

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
                    <Legend />
                    <Line type="monotone" dataKey="اختبار" stroke="#1e40af" strokeWidth={2} />
                    <Line type="monotone" dataKey="واجبات" stroke="#16a34a" strokeWidth={2} />
                    <Line type="monotone" dataKey="مشاركة" stroke="#d97706" strokeWidth={2} />
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
            <TabsTrigger value="plans">الخطط العلاجية</TabsTrigger>
          </TabsList>

          {/* Grades with inline edit */}
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
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">أسبوع {g.week_number}</TableCell>
                        {editingGradeId === g.id ? (
                          <>
                            <TableCell>
                              <Input type="number" min={0} max={100} value={editValues.exam}
                                onChange={e => setEditValues(v => ({ ...v, exam: +e.target.value }))}
                                className="w-20 h-8" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min={0} max={100} value={editValues.homework}
                                onChange={e => setEditValues(v => ({ ...v, homework: +e.target.value }))}
                                className="w-20 h-8" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" min={0} max={100} value={editValues.participation}
                                onChange={e => setEditValues(v => ({ ...v, participation: +e.target.value }))}
                                className="w-20 h-8" />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateGrade.isPending}>
                                  <Save className="h-4 w-4 text-success" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingGradeId(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{g.exam_score ?? 0}</TableCell>
                            <TableCell>{g.homework_score ?? 0}</TableCell>
                            <TableCell>{g.participation_score ?? 0}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => startEdit(g)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-destructive"
                                  onClick={() => { if (confirm("حذف هذه الدرجة؟")) deleteGrade.mutate(g.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {grades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">لا توجد درجات</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behaviors */}
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

          {/* Interventions */}
          <TabsContent value="interventions">
            <div className="flex justify-end mb-2">
              <Dialog open={intDialog} onOpenChange={setIntDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 ml-1" />تسجيل تدخل</Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="max-w-sm">
                  <DialogHeader><DialogTitle>تسجيل تدخل</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-3">
                    <div><Label>نوع التدخل</Label><Input value={intType} onChange={e => setIntType(e.target.value)} placeholder="مثال: تقوية، إرشاد" /></div>
                    <div><Label>الوصف</Label><Textarea value={intDesc} onChange={e => setIntDesc(e.target.value)} placeholder="تفاصيل التدخل" /></div>
                    <div><Label>النتيجة (اختياري)</Label><Input value={intOutcome} onChange={e => setIntOutcome(e.target.value)} /></div>
                    <Button onClick={handleAddIntervention} className="w-full" disabled={!intType.trim() || !intDesc.trim()}>حفظ</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
                        <TableCell><Badge variant="secondary">{i.type}</Badge></TableCell>
                        <TableCell>{i.description}</TableCell>
                        <TableCell>{i.outcome ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {interventions.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا توجد تدخلات</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings */}
          <TabsContent value="meetings">
            <div className="flex justify-end mb-2">
              <Dialog open={meetDialog} onOpenChange={setMeetDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 ml-1" />تسجيل اجتماع</Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="max-w-sm">
                  <DialogHeader><DialogTitle>تسجيل اجتماع ولي أمر</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-3">
                    <div><Label>الملاحظات</Label><Textarea value={meetNotes} onChange={e => setMeetNotes(e.target.value)} placeholder="ملاحظات الاجتماع" /></div>
                    <div><Label>التوصيات (اختياري)</Label><Textarea value={meetRec} onChange={e => setMeetRec(e.target.value)} placeholder="التوصيات" /></div>
                    <Button onClick={handleAddMeeting} className="w-full" disabled={!meetNotes.trim()}>حفظ</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">لا توجد اجتماعات</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatment Plans */}
          <TabsContent value="plans">
            <div className="flex justify-end mb-2">
              <Button onClick={handleGeneratePlan} disabled={addPlan.isPending} size="sm">
                <Sparkles className="h-4 w-4 ml-1" />
                {addPlan.isPending ? "جارٍ الإنشاء..." : "إنشاء خطة جديدة"}
              </Button>
            </div>
            {plans.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد خطط علاجية لهذا الطالب بعد</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {plans.map(plan => {
                  const academic = plan.academic_plan as Record<string, string> | null;
                  const behavioral = plan.behavioral_plan as Record<string, string> | null;
                  const indicators = plan.success_indicators as Record<string, any> | null;
                  return (
                    <Card key={plan.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">خطة علاجية</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                              {plan.status === "active" ? "نشطة" : plan.status === "completed" ? "مكتملة" : "مؤرشفة"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(plan.created_at).toLocaleDateString("ar-SA")}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        {plan.case_analysis && (
                          <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                            <h4 className="font-bold text-destructive mb-1">📋 تحليل الحالة</h4>
                            <p>{plan.case_analysis}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {academic && (
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                              <h4 className="font-bold text-primary mb-2">📚 الخطة الأكاديمية</h4>
                              <ul className="space-y-1">
                                {Object.entries(academic).map(([k, v]) => (
                                  <li key={k} className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{v}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {behavioral && (
                            <div className="bg-accent/10 p-3 rounded-lg border border-accent/30">
                              <h4 className="font-bold text-accent-foreground mb-2">🎯 الخطة السلوكية</h4>
                              <ul className="space-y-1">
                                {Object.entries(behavioral).map(([k, v]) => (
                                  <li key={k} className="flex items-start gap-2">
                                    <span className="text-accent mt-1">•</span>
                                    <span>{v}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {plan.counselor_role && (
                            <div className="bg-info/5 p-3 rounded-lg border border-info/20">
                              <h4 className="font-bold mb-1">👨‍⚕️ دور المرشد الطلابي</h4>
                              <p>{plan.counselor_role}</p>
                            </div>
                          )}
                          {plan.parent_role && (
                            <div className="bg-success/5 p-3 rounded-lg border border-success/20">
                              <h4 className="font-bold mb-1">👨‍👩‍👦 دور ولي الأمر</h4>
                              <p>{plan.parent_role}</p>
                            </div>
                          )}
                        </div>
                        {indicators && (
                          <div className="bg-muted p-3 rounded-lg">
                            <h4 className="font-bold mb-2">📊 مؤشرات قياس النجاح</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {indicators.target_average && (
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-primary">{indicators.target_average}%</p>
                                  <p className="text-xs text-muted-foreground">المعدل المستهدف</p>
                                </div>
                              )}
                              {plan.target_improvement && (
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-success">{plan.target_improvement}%</p>
                                  <p className="text-xs text-muted-foreground">نسبة التحسن</p>
                                </div>
                              )}
                              {plan.duration_weeks && (
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-accent-foreground">{plan.duration_weeks}</p>
                                  <p className="text-xs text-muted-foreground">أسابيع</p>
                                </div>
                              )}
                            </div>
                            {indicators.milestones && (
                              <div className="mt-3 space-y-1">
                                <p className="font-semibold text-xs">المراحل الأسبوعية:</p>
                                {(indicators.milestones as any[]).map((m: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <Badge variant="outline" className="text-[10px]">أسبوع {m.week}</Badge>
                                    <span>{m.target}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
