import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["student", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useStudentGrades(studentId: string | undefined) {
  return useQuery({
    queryKey: ["grades", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId!)
        .order("week_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudentBehaviors(studentId: string | undefined) {
  return useQuery({
    queryKey: ["behaviors", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("behaviors")
        .select("*")
        .eq("student_id", studentId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllGrades() {
  return useQuery({
    queryKey: ["all-grades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grades").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useAllBehaviors() {
  return useQuery({
    queryKey: ["all-behaviors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("behaviors").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*, students(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTreatmentPlans() {
  return useQuery({
    queryKey: ["treatment-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select("*, students(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudentTreatmentPlans(studentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-plans", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_plans")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useStudentInterventions(studentId: string | undefined) {
  return useQuery({
    queryKey: ["interventions", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .eq("student_id", studentId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useParentMeetings(studentId: string | undefined) {
  return useQuery({
    queryKey: ["parent-meetings", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_meetings")
        .select("*")
        .eq("student_id", studentId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAlertSettings() {
  return useQuery({
    queryKey: ["alert-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// Mutations
export function useAddStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student: TablesInsert<"students">) => {
      const { data, error } = await supabase.from("students").insert(student).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم إضافة الطالب بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الطالب"),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: TablesUpdate<"students"> & { id: string }) => {
      const { error } = await supabase.from("students").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم تحديث بيانات الطالب");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم حذف الطالب");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });
}

export function useAddGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grade: TablesInsert<"grades">) => {
      const { data, error } = await supabase.from("grades").insert(grade).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      qc.invalidateQueries({ queryKey: ["all-grades"] });
      toast.success("تم إضافة الدرجة");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الدرجة"),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; exam_score?: number; homework_score?: number; participation_score?: number }) => {
      const { error } = await supabase.from("grades").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      qc.invalidateQueries({ queryKey: ["all-grades"] });
      toast.success("تم تحديث الدرجة");
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الدرجة"),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grades"] });
      qc.invalidateQueries({ queryKey: ["all-grades"] });
      toast.success("تم حذف الدرجة");
    },
    onError: () => toast.error("حدث خطأ"),
  });
}

export function useAddBehavior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: TablesInsert<"behaviors">) => {
      const { data, error } = await supabase.from("behaviors").insert(b).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["behaviors"] });
      qc.invalidateQueries({ queryKey: ["all-behaviors"] });
      toast.success("تم تسجيل السلوك");
    },
    onError: () => toast.error("حدث خطأ"),
  });
}

export function useAddAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alert: TablesInsert<"alerts">) => {
      const { data, error } = await supabase.from("alerts").insert(alert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useAddTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: TablesInsert<"treatment_plans">) => {
      const { data, error } = await supabase.from("treatment_plans").insert(plan).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      toast.success("تم إنشاء الخطة العلاجية");
    },
    onError: () => toast.error("حدث خطأ"),
  });
}

export function useUpdateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: TablesUpdate<"treatment_plans"> & { id: string }) => {
      const { error } = await supabase.from("treatment_plans").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      toast.success("تم تحديث الخطة");
    },
    onError: () => toast.error("حدث خطأ"),
  });
}

export function useDeleteTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatment_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      toast.success("تم حذف الخطة العلاجية");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });
}

export function useAddIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TablesInsert<"interventions">) => {
      const { error } = await supabase.from("interventions").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interventions"] });
      toast.success("تم تسجيل التدخل");
    },
  });
}

export function useAddParentMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TablesInsert<"parent_meetings">) => {
      const { error } = await supabase.from("parent_meetings").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-meetings"] });
      toast.success("تم تسجيل الاجتماع");
    },
  });
}
