import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeStudent, calculateWeightedAverage } from "@/lib/analysis-engine";
import type { Tables } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";

type Student = Tables<"students">;
type Grade = Tables<"grades">;
type Behavior = Tables<"behaviors">;

export function useAutoAlerts(
  students: Student[],
  allGrades: Grade[],
  allBehaviors: Behavior[]
) {
  const qc = useQueryClient();
  const lastRun = useRef<string>("");

  useEffect(() => {
    if (!students.length || !allGrades.length) return;

    // Create a fingerprint to avoid re-running on same data
    const fingerprint = `${students.length}-${allGrades.length}-${allBehaviors.length}`;
    if (fingerprint === lastRun.current) return;
    lastRun.current = fingerprint;

    const classAvg = calculateWeightedAverage(allGrades);

    const generateAlerts = async () => {
      // Get existing alerts to avoid duplicates (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: existingAlerts } = await supabase
        .from("alerts")
        .select("student_id, type, created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      const recentAlertKeys = new Set(
        (existingAlerts ?? []).map(a => `${a.student_id}-${a.type}`)
      );

      const newAlerts: Array<{
        student_id: string;
        type: string;
        message: string;
        severity: string;
      }> = [];

      for (const student of students) {
        if (student.status !== "active") continue;
        
        const grades = allGrades.filter(g => g.student_id === student.id);
        const behaviors = allBehaviors.filter(b => b.student_id === student.id);
        const analysis = analyzeStudent(student, grades, behaviors, classAvg);

        // Academic intervention alert
        if (
          (analysis.riskLevel === "needs_intervention" || analysis.riskLevel === "critical") &&
          analysis.academicRiskIndex > 30
        ) {
          const key = `${student.id}-academic_intervention`;
          if (!recentAlertKeys.has(key)) {
            newAlerts.push({
              student_id: student.id,
              type: "academic_intervention",
              message: `الطالب ${student.name} يحتاج تدخل أكاديمي عاجل — المعدل ${analysis.weightedAverage}% ومؤشر الخطر الأكاديمي ${analysis.academicRiskIndex}%`,
              severity: analysis.riskLevel === "critical" ? "critical" : "warning",
            });
          }
        }

        // Behavioral intervention alert
        if (analysis.behavioralRiskIndex > 40) {
          const key = `${student.id}-behavioral_intervention`;
          if (!recentAlertKeys.has(key)) {
            const negCount = behaviors.filter(b => b.type === "negative").length;
            newAlerts.push({
              student_id: student.id,
              type: "behavioral_intervention",
              message: `الطالب ${student.name} يحتاج تدخل سلوكي — ${negCount} سلوك سلبي (مؤشر الخطر السلوكي ${analysis.behavioralRiskIndex}%)`,
              severity: analysis.behavioralRiskIndex > 70 ? "critical" : "warning",
            });
          }
        }

        // Declining trend alert
        if (analysis.trend === "down" && Math.abs(analysis.trendPercentage) > 10) {
          const key = `${student.id}-declining_performance`;
          if (!recentAlertKeys.has(key)) {
            newAlerts.push({
              student_id: student.id,
              type: "declining_performance",
              message: `الطالب ${student.name} يشهد تراجعاً ملحوظاً في الأداء (${Math.abs(analysis.trendPercentage)}% انخفاض)`,
              severity: "warning",
            });
          }
        }

        // Critical combined risk
        if (analysis.riskLevel === "critical") {
          const key = `${student.id}-critical_risk`;
          if (!recentAlertKeys.has(key)) {
            newAlerts.push({
              student_id: student.id,
              type: "critical_risk",
              message: `⚠️ الطالب ${student.name} في وضع حرج — يحتاج تدخل فوري (أكاديمي: ${analysis.academicRiskIndex}% | سلوكي: ${analysis.behavioralRiskIndex}%)`,
              severity: "critical",
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        await supabase.from("alerts").insert(newAlerts as any);
        qc.invalidateQueries({ queryKey: ["alerts"] });
      }
    };

    generateAlerts();
  }, [students, allGrades, allBehaviors, qc]);
}
