import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Brain, Video, MessageCircle, CheckCircle, XCircle, Send, Loader2, Sparkles } from "lucide-react";
import { chemistryTopics, type ChemistryTopic, type QuizQuestion } from "@/data/chemistry-topics";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chemistry-ai-chat`;

function TopicContent({ topic }: { topic: ChemistryTopic }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  const handleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    setShowResults((prev) => ({ ...prev, [qIdx]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
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

      {/* Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            فيديو تعليمي
          </CardTitle>
          <CardDescription>{topic.videoTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={topic.videoUrl}
              title={topic.videoTitle}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz */}
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
                      disabled={showResult}
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
        </CardContent>
      </Card>
    </div>
  );
}

function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "خطأ في الخدمة");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "اشرح لي الحرارة النوعية بأسلوب مبسط",
    "ما الفرق بين الألكانات والألكينات؟",
    "كيف أحسب ΔH باستخدام قانون هس؟",
    "ما هو مبدأ لوشاتلييه؟",
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          المساعد الذكي للكيمياء
        </CardTitle>
        <CardDescription>اسأل أي سؤال في الكيمياء وسأساعدك</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-center text-sm text-muted-foreground">جرب أحد هذه الأسئلة:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => { setInput(s); }}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button size="icon" onClick={send} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickSupport() {
  const [selectedTopic, setSelectedTopic] = useState(chemistryTopics[0].id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الدعم السريع للطلاب</h1>
          <p className="text-muted-foreground text-sm">محتوى دراسي وأسئلة تدريبية وفيديوهات ومساعد ذكي</p>
        </div>

        <Tabs defaultValue="topics" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics" className="gap-2">
              <BookOpen className="h-4 w-4" />
              المحتوى الدراسي
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              المساعد الذكي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Topic list */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">المواضيع</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1">
                      {chemistryTopics.map((t) => (
                        <Button
                          key={t.id}
                          variant={selectedTopic === t.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-right h-auto py-2.5 text-xs"
                          onClick={() => setSelectedTopic(t.id)}
                        >
                          {t.title}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Topic content */}
              <div className="lg:col-span-3">
                <ScrollArea className="h-[600px]">
                  {chemistryTopics
                    .filter((t) => t.id === selectedTopic)
                    .map((t) => (
                      <TopicContent key={t.id} topic={t} />
                    ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <AiChat />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
