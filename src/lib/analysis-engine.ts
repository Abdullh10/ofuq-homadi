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
  classComparison: number;
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
  // تحليل أعمق للحالة
  const weakAreas: string[] = [];
  if (analysis.academicRiskIndex > 30) weakAreas.push("تدنٍ في المستوى الأكاديمي");
  if (analysis.behavioralRiskIndex > 30) weakAreas.push("مشكلات سلوكية متكررة");
  if (analysis.trend === "down") weakAreas.push("اتجاه هبوطي في الأداء");
  if (analysis.stabilityScore < 40) weakAreas.push("عدم استقرار في الأداء");
  if (analysis.classComparison < -15) weakAreas.push("فجوة كبيرة عن متوسط الفصل");

  const plan: any = {};

  // تحليل الحالة التفصيلي
  plan.case_analysis = `الطالب ${studentName}:\n` +
    `• المعدل المرجح: ${analysis.weightedAverage}% (${analysis.weightedAverage < 50 ? "ضعيف جداً" : analysis.weightedAverage < 60 ? "ضعيف" : analysis.weightedAverage < 70 ? "مقبول" : "متوسط"})\n` +
    `• مؤشر الخطر الأكاديمي: ${analysis.academicRiskIndex}%\n` +
    `• مؤشر الخطر السلوكي: ${analysis.behavioralRiskIndex}%\n` +
    `• استقرار الأداء: ${analysis.stabilityScore}%\n` +
    `• اتجاه الأداء: ${analysis.trend === "down" ? "هبوطي ↓" : analysis.trend === "up" ? "صعودي ↑" : "مستقر —"}\n` +
    `• مقارنة بالفصل: ${analysis.classComparison > 0 ? "+" : ""}${analysis.classComparison}%\n` +
    (weakAreas.length > 0 ? `\nأسباب التدني: ${weakAreas.join(" | ")}` : "");

  // الخطة الأكاديمية المفصلة
  plan.academic_plan = {
    tutoring_sessions: analysis.weightedAverage < 50
      ? "3 حصص تقوية أسبوعياً (سبت - اثنين - أربعاء) في المواضيع الأساسية"
      : "حصتان تقوية أسبوعياً في المواضيع الضعيفة",
    remedial_tasks: "مهام علاجية يومية مخصصة حسب نقاط الضعف مع متابعة دقيقة وتصحيح فوري",
    weekly_quizzes: "اختبار قصير أسبوعي (كل خميس) لقياس التقدم وتحديد الفجوات المتبقية",
    review_schedule: "جدول مراجعة يومي مدته 30 دقيقة للمفاهيم الأساسية في الكيمياء",
    study_groups: "إشراك الطالب في مجموعة دراسية مع طلاب متفوقين لتبادل الخبرات",
    practical_labs: "حصص عملية إضافية لربط المفاهيم النظرية بالتطبيق العملي",
  };

  // الخطة السلوكية المفصلة
  plan.behavioral_plan = {
    behavior_modification: "برنامج تعديل سلوك تدريجي يبدأ بتحديد السلوكيات المستهدفة وتحليلها",
    behavioral_contract: "عقد سلوكي ثلاثي (الطالب - المعلم - ولي الأمر) يحدد التوقعات والعواقب",
    positive_reinforcement: "نظام نقاط وتعزيز إيجابي: كل سلوك إيجابي = نقطة، 10 نقاط = مكافأة",
    daily_monitoring: "بطاقة متابعة يومية يوقعها كل معلم مع ملاحظة السلوك في كل حصة",
    peer_support: "تعيين رفيق إيجابي (buddy system) لدعم السلوك الاجتماعي",
    self_regulation: "تدريب الطالب على مهارات التنظيم الذاتي والتحكم في الانفعالات",
  };

  // دور المرشد الطلابي
  plan.counselor_role =
    "• جلسات إرشاد فردية أسبوعية (30 دقيقة) لتحليل المشكلات ووضع الحلول\n" +
    "• تقييم نفسي أولي للطالب وتحديد العوامل المؤثرة\n" +
    "• تواصل أسبوعي مع المعلم لمتابعة التقدم\n" +
    "• تنسيق مع الأسرة عبر تقارير دورية\n" +
    "• تطبيق مقياس الدافعية والتكيف الدراسي\n" +
    "• إحالة لجهات متخصصة عند الحاجة";

  // دور ولي الأمر
  plan.parent_role =
    "• متابعة منزلية يومية للواجبات والمراجعة (30 دقيقة على الأقل)\n" +
    "• توقيع أسبوعي على بطاقة المتابعة كل خميس\n" +
    "• حضور اجتماع شهري مع المعلم والمرشد\n" +
    "• توفير بيئة دراسية هادئة ومنظمة في المنزل\n" +
    "• الحد من استخدام الأجهزة الإلكترونية أيام الدراسة\n" +
    "• تعزيز إيجابي منزلي لكل تحسن ملحوظ\n" +
    "• تقرير شهري مكتوب عن التقدم المنزلي";

  // مؤشرات قياس النجاح
  const targetAvg = Math.min(100, analysis.weightedAverage + (analysis.weightedAverage < 50 ? 20 : 15));
  plan.success_indicators = {
    target_average: Math.round(targetAvg),
    target_behavior_improvement: analysis.behavioralRiskIndex > 50 ? 40 : 25,
    review_period_weeks: analysis.riskLevel === "critical" ? 6 : 4,
    milestones: [
      { week: 1, target: "التزام كامل بحضور حصص التقوية وتنفيذ المهام العلاجية" },
      { week: 2, target: `تحسن في درجة الاختبار القصير بنسبة 10% (هدف: ${Math.min(100, analysis.weightedAverage + 10)}%)` },
      { week: 3, target: "انخفاض السلوكيات السلبية وزيادة المشاركة الصفية" },
      { week: 4, target: `الوصول لمعدل ${Math.round(targetAvg)}% في الاختبار الأسبوعي وتقييم شامل` },
      ...(analysis.riskLevel === "critical" ? [
        { week: 5, target: "استمرار التحسن وتثبيت المستوى الجديد" },
        { week: 6, target: "تقييم نهائي وإعادة تصنيف المستوى" },
      ] : []),
    ],
  };

  plan.target_improvement = analysis.weightedAverage < 50 ? 20 : 15;
  plan.duration_weeks = analysis.riskLevel === "critical" ? 6 : 4;

  return plan;
}
