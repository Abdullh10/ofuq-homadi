import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;
type Grade = Tables<"grades">;
type Behavior = Tables<"behaviors">;

export type RiskLevel = "excellent" | "stable" | "needs_intervention" | "critical";

export interface StudentAnalysis {
  studentId: string;
  weightedAverage: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  academicRiskIndex: number;
  behavioralRiskIndex: number;
  stabilityScore: number;
  riskLevel: RiskLevel;
  classComparison: number; // difference from class average
}

export function calculateWeightedAverage(grades: Grade[]): number {
  if (!grades.length) return 0;
  const weights = { exam: 0.5, homework: 0.3, participation: 0.2 };
  let totalWeighted = 0;
  let count = 0;
  for (const g of grades) {
    const exam = g.exam_score ?? 0;
    const hw = g.homework_score ?? 0;
    const part = g.participation_score ?? 0;
    totalWeighted += exam * weights.exam + hw * weights.homework + part * weights.participation;
    count++;
  }
  return count ? totalWeighted / count : 0;
}

export function analyzeTrend(grades: Grade[]): { trend: "up" | "down" | "stable"; percentage: number } {
  if (grades.length < 2) return { trend: "stable", percentage: 0 };
  const sorted = [...grades].sort((a, b) => a.week_number - b.week_number);
  const recent = sorted.slice(-3);
  if (recent.length < 2) return { trend: "stable", percentage: 0 };

  const avgScore = (g: Grade) => ((g.exam_score ?? 0) + (g.homework_score ?? 0) + (g.participation_score ?? 0)) / 3;
  const first = avgScore(recent[0]);
  const last = avgScore(recent[recent.length - 1]);
  const diff = last - first;
  const percentage = first > 0 ? (diff / first) * 100 : 0;

  if (percentage > 5) return { trend: "up", percentage };
  if (percentage < -5) return { trend: "down", percentage };
  return { trend: "stable", percentage };
}

export function calculateAcademicRisk(avg: number, trend: "up" | "down" | "stable"): number {
  let risk = 0;
  if (avg < 50) risk += 40;
  else if (avg < 60) risk += 25;
  else if (avg < 70) risk += 10;

  if (trend === "down") risk += 20;
  else if (trend === "stable" && avg < 60) risk += 10;

  return Math.min(100, risk);
}

export function calculateBehavioralRisk(behaviors: Behavior[]): number {
  if (!behaviors.length) return 0;
  const negative = behaviors.filter(b => b.type === "negative").length;
  const positive = behaviors.filter(b => b.type === "positive").length;
  const total = behaviors.length;
  const negativeRatio = negative / total;
  return Math.min(100, Math.round(negativeRatio * 100));
}

export function calculateStabilityScore(grades: Grade[]): number {
  if (grades.length < 2) return 50;
  const scores = grades.map(g => ((g.exam_score ?? 0) + (g.homework_score ?? 0) + (g.participation_score ?? 0)) / 3);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  // Lower stdDev = more stable = higher score
  return Math.max(0, Math.min(100, 100 - stdDev * 2));
}

export function classifyRiskLevel(academicRisk: number, behavioralRisk: number, avg: number): RiskLevel {
  const combinedRisk = academicRisk * 0.6 + behavioralRisk * 0.4;
  if (avg >= 85 && combinedRisk < 15) return "excellent";
  if (avg >= 60 && combinedRisk < 40) return "stable";
  if (combinedRisk < 65) return "needs_intervention";
  return "critical";
}

export function getRiskLevelInfo(level: RiskLevel) {
  const map = {
    excellent: { label: "متفوق", emoji: "🌟", color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/30" },
    stable: { label: "مستقر", emoji: "✅", color: "text-info", bgColor: "bg-info/10", borderColor: "border-info/30" },
    needs_intervention: { label: "يحتاج تدخل", emoji: "⚠️", color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/30" },
    critical: { label: "خطر حرج", emoji: "🚨", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" },
  };
  return map[level];
}

export function analyzeStudent(
  student: Student,
  grades: Grade[],
  behaviors: Behavior[],
  classAvg: number
): StudentAnalysis {
  const avg = calculateWeightedAverage(grades);
  const { trend, percentage } = analyzeTrend(grades);
  const academicRisk = calculateAcademicRisk(avg, trend);
  const behavioralRisk = calculateBehavioralRisk(behaviors);
  const stability = calculateStabilityScore(grades);
  const riskLevel = classifyRiskLevel(academicRisk, behavioralRisk, avg);

  return {
    studentId: student.id,
    weightedAverage: Math.round(avg * 10) / 10,
    trend,
    trendPercentage: Math.round(percentage * 10) / 10,
    academicRiskIndex: academicRisk,
    behavioralRiskIndex: behavioralRisk,
    stabilityScore: Math.round(stability),
    riskLevel,
    classComparison: Math.round((avg - classAvg) * 10) / 10,
  };
}

export function generateTreatmentPlan(analysis: StudentAnalysis, studentName: string) {
  const plan: any = {};

  plan.case_analysis = analysis.riskLevel === "critical"
    ? `يعاني الطالب ${studentName} من تدنٍ حاد في المستوى الأكاديمي (معدل ${analysis.weightedAverage}%) مع اتجاه ${analysis.trend === "down" ? "هبوطي" : "غير مستقر"} في الأداء. مؤشر الخطر الأكاديمي: ${analysis.academicRiskIndex}%. مؤشر الخطر السلوكي: ${analysis.behavioralRiskIndex}%.`
    : `يحتاج الطالب ${studentName} إلى تدخل تعليمي مع معدل ${analysis.weightedAverage}%. مؤشر الخطر الأكاديمي: ${analysis.academicRiskIndex}%. الاتجاه: ${analysis.trend === "down" ? "هبوطي" : "مستقر"}.`;

  plan.academic_plan = {
    tutoring: "حصتان تقوية أسبوعياً في المواضيع الضعيفة",
    tasks: "مهام علاجية يومية مخصصة مع متابعة",
    quizzes: "اختبار قصير أسبوعي لقياس التقدم",
    review: "جدول مراجعة يومي للمفاهيم الأساسية",
  };

  plan.behavioral_plan = {
    modification: "برنامج تعديل سلوك تدريجي",
    contract: "عقد سلوكي مع الطالب وولي الأمر",
    reinforcement: "نظام تعزيز إيجابي (نقاط ومكافآت)",
    monitoring: "متابعة سلوكية يومية مع تقرير أسبوعي",
  };

  plan.counselor_role = "جلسات إرشاد فردية أسبوعية + تقييم نفسي عند الحاجة + تواصل مستمر مع المعلم وولي الأمر";
  plan.parent_role = "متابعة منزلية يومية + توقيع أسبوعي على تقرير المتابعة + حضور اجتماع شهري + توفير بيئة دراسية مناسبة";

  plan.success_indicators = {
    target_average: Math.min(100, analysis.weightedAverage + 15),
    target_behavior_improvement: 30,
    review_period_weeks: 4,
    milestones: [
      { week: 1, target: "التزام بحضور حصص التقوية" },
      { week: 2, target: "تحسن ملحوظ في الواجبات" },
      { week: 3, target: "ارتفاع في درجة الاختبار القصير" },
      { week: 4, target: "تقييم شامل وإعادة تصنيف" },
    ],
  };

  plan.target_improvement = 15;
  plan.duration_weeks = 4;

  return plan;
}
