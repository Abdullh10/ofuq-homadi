import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, XCircle, Lightbulb, Brain, ArrowRight, GraduationCap, Trophy, FlaskConical } from "lucide-react";
import { remedialTopics, sections, type RemedialTopic } from "@/data/remedial-topics";
import { toast } from "sonner";

function TopicContentView({ topic, onComplete }: { topic: RemedialTopic; onComplete: (score: number, total: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});
  const [allDone, setAllDone] = useState(false);

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (showResults[qIdx]) return;
    const newAnswers = { ...answers, [qIdx]: optIdx };
    const newShown = { ...showResults, [qIdx]: true };
    setAnswers(newAnswers);
    setShowResults(newShown);

    if (Object.keys(newShown).length === topic.questions.length) {
      const correct = topic.questions.filter((q, i) => newAnswers[i] === q.correctIndex).length;
      setAllDone(true);
      onComplete(correct, topic.questions.length);
    }
  };

  const score = topic.questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const pct = allDone ? Math.round((score / topic.questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            الملخص
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-7 text-muted-foreground">{topic.summary}</p>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">النقاط الرئيسية:</h4>
            <ul className="space-y-1.5">
              {topic.keyPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            شرح تفصيلي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topic.detailedExplanation.map((paragraph, i) => (
            <p key={i} className="leading-7 text-sm text-muted-foreground">{paragraph}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            أسئلة تدريبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topic.questions.map((q, qIdx) => (
            <div key={qIdx} className="border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">{qIdx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => {
                  const selected = answers[qIdx] === oIdx;
                  const isCorrect = q.correctIndex === oIdx;
                  const showResult = showResults[qIdx];
                  let variant: "outline" | "default" | "destructive" = "outline";
                  if (showResult && selected && isCorrect) variant = "default";
                  if (showResult && selected && !isCorrect) variant = "destructive";

                  return (
                    <Button
                      key={oIdx}
                      variant={variant}
                      size="sm"
                      className={`justify-start text-right h-auto py-2 px-3 ${
                        showResult && isCorrect && !selected ? "border-primary text-primary" : ""
                      }`}
                      disabled={!!showResult}
                      onClick={() => handleAnswer(qIdx, oIdx)}
                    >
                      {showResult && isCorrect && <CheckCircle className="h-4 w-4 ml-1 shrink-0" />}
                      {showResult && selected && !isCorrect && <XCircle className="h-4 w-4 ml-1 shrink-0" />}
                      {opt}
                    </Button>
                  );
                })}
              </div>
              {showResults[qIdx] && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  💡 {q.explanation}
                </p>
              )}
            </div>
          ))}

          {allDone && (
            <div className={`p-4 rounded-lg text-center space-y-2 ${pct >= 80 ? "bg-green-50 border border-green-200" : pct >= 50 ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
              <Trophy className={`h-8 w-8 mx-auto ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`} />
              <p className="font-bold text-lg">{score} / {topic.questions.length}</p>
              <p className="text-sm text-muted-foreground">
                {pct >= 80 ? "ممتاز! أحسنت 🎉" : pct >= 50 ? "جيد، حاول تحسين نتيجتك" : "راجع المحتوى وحاول مرة أخرى"}
              </p>
              <Progress value={pct} className="h-2 mt-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentRemedial() {
  const [studentName, setStudentName] = useState("");
  const [section, setSection] = useState("");
  const [registered, setRegistered] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Record<string, { score: number; total: number }>>({});

  const handleRegister = () => {
    if (!studentName.trim() || !section) {
      toast.error("الرجاء إدخال الاسم واختيار الشعبة");
      return;
    }
    setRegistered(true);
    toast.success(`مرحباً ${studentName}! اختر الموضوع الذي تريد مراجعته`);
  };

  const handleTopicComplete = useCallback((score: number, total: number) => {
    if (!selectedTopicId) return;
    setCompletedTopics(prev => ({ ...prev, [selectedTopicId]: { score, total } }));
    const pct = Math.round((score / total) * 100);
    if (pct >= 80) toast.success(`ممتاز! ${score}/${total} إجابات صحيحة`);
    else if (pct >= 50) toast("جيد! حاول تحسين نتيجتك");
    else toast.error(`${score}/${total} — راجع الموضوع وحاول مرة أخرى`);
  }, [selectedTopicId]);

  const selectedTopic = remedialTopics.find(t => t.id === selectedTopicId);
  const completedCount = Object.keys(completedTopics).length;

  // Registration screen
  if (!registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <FlaskConical className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">برنامج التعزيز الأكاديمي</CardTitle>
            <p className="text-sm text-muted-foreground">
              مراجعة المحتوى وحل الأسئلة لتقوية مستواك في الكيمياء
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الطالب</Label>
              <Input
                id="name"
                placeholder="أدخل اسمك الكامل"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>الشعبة</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s} value={s}>الشعبة {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" size="lg" onClick={handleRegister}>
              <ArrowRight className="h-4 w-4 ml-2" />
              ابدأ المراجعة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Topic selection / content view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold">برنامج التعزيز الأكاديمي</h1>
              <p className="text-xs text-muted-foreground">{studentName} — الشعبة {section}</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {completedCount}/{remedialTopics.length} مكتمل
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {!selectedTopicId ? (
          // Topic selection
          <div className="space-y-4">
            <div className="text-center py-4">
              <h2 className="text-lg font-bold">اختر الموضوع الذي تريد مراجعته</h2>
              <p className="text-sm text-muted-foreground">اقرأ المحتوى ثم حل الأسئلة التدريبية</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {remedialTopics.map(topic => {
                const done = completedTopics[topic.id];
                const pct = done ? Math.round((done.score / done.total) * 100) : 0;
                return (
                  <Card
                    key={topic.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${done ? "border-primary/30" : ""}`}
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm">{topic.title}</h3>
                        {done && (
                          <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"} className="text-[10px]">
                            {done.score}/{done.total}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{topic.summary}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Brain className="h-3.5 w-3.5" />
                        {topic.questions.length} أسئلة
                      </div>
                      {done && <Progress value={pct} className="h-1.5" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          // Topic content
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTopicId(null)} className="gap-1">
              <ArrowRight className="h-4 w-4" />
              العودة للمواضيع
            </Button>
            <h2 className="text-lg font-bold">{selectedTopic?.title}</h2>
            <ScrollArea className="h-[calc(100vh-160px)]">
              {selectedTopic && (
                <TopicContentView
                  key={selectedTopicId}
                  topic={selectedTopic}
                  onComplete={handleTopicComplete}
                />
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
