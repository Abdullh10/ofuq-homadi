import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageCircle, BarChart3 } from "lucide-react";
import { chemistryTopics, chapters } from "@/data/chemistry-topics";
import { TopicContent } from "@/components/quick-support/TopicContent";
import { AiChat } from "@/components/quick-support/AiChat";
import { ProgressTracker, type TopicProgress } from "@/components/quick-support/ProgressTracker";
import { toast } from "sonner";

export default function QuickSupport() {
  const [selectedTopic, setSelectedTopic] = useState(chemistryTopics[0].id);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [progress, setProgress] = useState<TopicProgress[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("quiz-progress") || "[]");
    } catch { return []; }
  });

  const handleQuizComplete = useCallback((topicId: string, score: number, total: number) => {
    setProgress((prev) => {
      const existing = prev.filter((p) => p.topicId !== topicId);
      const updated = [...existing, { topicId, score, total, completedAt: new Date().toISOString() }];
      localStorage.setItem("quiz-progress", JSON.stringify(updated));
      return updated;
    });
    const pct = Math.round((score / total) * 100);
    if (pct >= 80) toast.success(`ممتاز! ${score}/${total} إجابات صحيحة`);
    else if (pct >= 50) toast("جيد! حاول تحسين نتيجتك");
    else toast.error(`${score}/${total} — راجع الموضوع وحاول مرة أخرى`);
  }, []);

  const filteredTopics = selectedChapter
    ? chemistryTopics.filter((t) => t.chapterId === selectedChapter)
    : chemistryTopics;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الدعم السريع للطلاب</h1>
          <p className="text-muted-foreground text-sm">محتوى دراسي وأسئلة تدريبية وفيديوهات ومساعد ذكي</p>
        </div>

        <Tabs defaultValue="topics" dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topics" className="gap-2">
              <BookOpen className="h-4 w-4" />
              المحتوى الدراسي
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              المساعد الذكي
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              تقدم الطالب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">المواضيع</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {/* Chapter filter */}
                  <div className="flex flex-wrap gap-1 mb-2 px-1">
                    <Badge
                      variant={selectedChapter === null ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => setSelectedChapter(null)}
                    >
                      الكل
                    </Badge>
                    {chapters.map((ch) => (
                      <Badge
                        key={ch.id}
                        variant={selectedChapter === ch.id ? "default" : "outline"}
                        className="cursor-pointer text-[10px]"
                        onClick={() => setSelectedChapter(ch.id)}
                      >
                        باب {ch.id}
                      </Badge>
                    ))}
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1">
                      {filteredTopics.map((t) => {
                        const done = progress.find((p) => p.topicId === t.id);
                        return (
                          <Button
                            key={t.id}
                            variant={selectedTopic === t.id ? "default" : "ghost"}
                            size="sm"
                            className="w-full justify-start text-right h-auto py-2.5 text-xs gap-1"
                            onClick={() => setSelectedTopic(t.id)}
                          >
                            {done && <span className="text-green-500">✓</span>}
                            {t.title}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="lg:col-span-3">
                <ScrollArea className="h-[600px]">
                  {chemistryTopics
                    .filter((t) => t.id === selectedTopic)
                    .map((t) => (
                      <TopicContent key={t.id} topic={t} onQuizComplete={handleQuizComplete} />
                    ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <AiChat />
          </TabsContent>

          <TabsContent value="progress" className="mt-4">
            <ProgressTracker progress={progress} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
