import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudents, useAllGrades, useAllBehaviors, useAlerts } from "@/hooks/use-students";
import { analyzeStudent, calculateWeightedAverage, type RiskLevel, getRiskLevelInfo } from "@/lib/analysis-engine";
import { Users, TrendingUp, AlertTriangle, Heart, Trophy, ShieldAlert } from "lucide-react";
import { StudentRiskBadge } from "@/components/students/StudentRiskBadge";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: students = [] } = useStudents();
  const { data: allGrades = [] } = useAllGrades();
  const { data: allBehaviors = [] } = useAllBehaviors();
  const { data: alerts = [] } = useAlerts();

  const activeStudents = students.filter(s => s.status !== "archived");

  // Calculate class average
  const classAvg = allGrades.length > 0 ? calculateWeightedAverage(allGrades) : 0;

  // Analyze all students
  const analyses = activeStudents.map(student => {
    const studentGrades = allGrades.filter(g => g.student_id === student.id);
    const studentBehaviors = allBehaviors.filter(b => b.student_id === student.id);
    return { student, analysis: analyzeStudent(student, studentGrades, studentBehaviors, classAvg) };
  });

  // Sort for top/bottom 5
  const sortedByAvg = [...analyses].sort((a, b) => b.analysis.weightedAverage - a.analysis.weightedAverage);
  const top5 = sortedByAvg.slice(0, 5);
  const bottom5 = [...analyses].sort((a, b) => a.analysis.weightedAverage - b.analysis.weightedAverage).slice(0, 5);

  // Risk distribution
  const riskCounts: Record<RiskLevel, number> = { excellent: 0, stable: 0, needs_intervention: 0, critical: 0 };
  analyses.forEach(a => riskCounts[a.analysis.riskLevel]++);

  const distribution = [
    { name: "متفوق 🌟", value: riskCounts.excellent, color: "#22c55e" },
    { name: "مستقر ✅", value: riskCounts.stable, color: "#3b82f6" },
    { name: "يحتاج تدخل ⚠️", value: riskCounts.needs_intervention, color: "#f59e0b" },
    { name: "خطر حرج 🚨", value: riskCounts.critical, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Behaviors summary
  const positiveBehaviors = allBehaviors.filter(b => b.type === "positive").length;
  const negativeBehaviors = allBehaviors.filter(b => b.type === "negative").length;

  // Class health score
  const healthScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + (100 - (a.analysis.academicRiskIndex * 0.6 + a.analysis.behavioralRiskIndex * 0.4)), 0) / analyses.length)
    : 0;

  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  return (
    <AppLayout title="لوحة التحكم">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="إجمالي الطلاب" value={activeStudents.length} icon={Users} gradient="gradient-primary" />
          <StatCard title="متوسط الفصل" value={`${Math.round(classAvg)}%`} icon={TrendingUp} gradient="gradient-success" />
          <StatCard title="الإنذارات النشطة" value={unreadAlerts} icon={AlertTriangle} gradient="gradient-warning" />
          <StatCard
            title="صحة الفصل"
            value={`${healthScore}%`}
            subtitle={healthScore >= 70 ? "جيد" : healthScore >= 50 ? "متوسط" : "يحتاج تحسين"}
            icon={Heart}
            gradient={healthScore >= 70 ? "gradient-success" : healthScore >= 50 ? "gradient-warning" : "gradient-danger"}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RiskDistributionChart distribution={distribution} />
          <WeeklyPerformanceChart grades={allGrades} />
        </div>

        {/* Top & Bottom students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                أعلى 5 طلاب
              </CardTitle>
            </CardHeader>
            <CardContent>
              {top5.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد بيانات بعد</p>
              ) : (
                <div className="space-y-2">
                  {top5.map(({ student, analysis }, i) => (
                    <Link
                      key={student.id}
                      to={`/students/${student.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-accent w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{analysis.weightedAverage}%</span>
                        <StudentRiskBadge level={analysis.riskLevel} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                أكثر 5 طلاب عرضة للخطر
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bottom5.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد بيانات بعد</p>
              ) : (
                <div className="space-y-2">
                  {bottom5.map(({ student, analysis }, i) => (
                    <Link
                      key={student.id}
                      to={`/students/${student.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-destructive w-6">{i + 1}</span>
                        <span className="text-sm font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{analysis.weightedAverage}%</span>
                        <StudentRiskBadge level={analysis.riskLevel} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Behavior summary */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ملخص السلوك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm">إيجابي: {positiveBehaviors}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm">سلبي: {negativeBehaviors}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                النسبة: {positiveBehaviors + negativeBehaviors > 0
                  ? `${Math.round((positiveBehaviors / (positiveBehaviors + negativeBehaviors)) * 100)}% إيجابي`
                  : "لا توجد بيانات"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
