import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  grades: Tables<"grades">[];
}

export function WeeklyPerformanceChart({ grades }: Props) {
  // Group by week and compute class average
  const weekMap = new Map<number, number[]>();
  grades.forEach(g => {
    const avg = ((g.exam_score ?? 0) + (g.homework_score ?? 0) + (g.participation_score ?? 0)) / 3;
    const arr = weekMap.get(g.week_number) ?? [];
    arr.push(avg);
    weekMap.set(g.week_number, arr);
  });

  const data = Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, scores]) => ({
      week: `أسبوع ${week}`,
      average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }));

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">تطور الأداء الأسبوعي</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: number) => `${val}%`} />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(215, 80%, 28%)"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  name="متوسط الفصل"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              لا توجد بيانات بعد
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
