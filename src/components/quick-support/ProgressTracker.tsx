import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trophy, Target } from "lucide-react";
import { chemistryTopics, chapters } from "@/data/chemistry-topics";

export interface TopicProgress {
  topicId: string;
  score: number;
  total: number;
  completedAt: string;
}

interface ProgressTrackerProps {
  progress: TopicProgress[];
}

export function ProgressTracker({ progress }: ProgressTrackerProps) {
  const totalTopics = chemistryTopics.length;
  const completedTopics = progress.length;
  const totalQuestions = progress.reduce((s, p) => s + p.total, 0);
  const totalCorrect = progress.reduce((s, p) => s + p.score, 0);
  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const completionPercent = Math.round((completedTopics / totalTopics) * 100);

  const getProgressForTopic = (topicId: string) => progress.find((p) => p.topicId === topicId);

  const getScoreColor = (score: number, total: number) => {
    const pct = (score / total) * 100;
    if (pct >= 80) return "text-green-600 bg-green-100";
    if (pct >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTopics}/{totalTopics}</p>
              <p className="text-xs text-muted-foreground">موضوع مكتمل</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallPercent}%</p>
              <p className="text-xs text-muted-foreground">نسبة الإجابات الصحيحة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCorrect}/{totalQuestions}</p>
              <p className="text-xs text-muted-foreground">إجابة صحيحة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">التقدم الكلي</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{completionPercent}% مكتمل</p>
        </CardContent>
      </Card>

      {/* Per-Chapter Breakdown */}
      {chapters.map((ch) => {
        const chTopics = chemistryTopics.filter((t) => t.chapterId === ch.id);
        const chCompleted = chTopics.filter((t) => getProgressForTopic(t.id)).length;
        return (
          <Card key={ch.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>الباب {ch.id}: {ch.title}</span>
                <Badge variant="secondary" className="text-xs">{chCompleted}/{chTopics.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {chTopics.map((topic) => {
                const tp = getProgressForTopic(topic.id);
                return (
                  <div key={topic.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground flex-1">{topic.title}</span>
                    {tp ? (
                      <Badge className={`text-xs ${getScoreColor(tp.score, tp.total)}`}>
                        {tp.score}/{tp.total}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">لم يُكمل</Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
