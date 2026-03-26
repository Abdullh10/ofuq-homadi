import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Video, CheckCircle, XCircle } from "lucide-react";
import { type ChemistryTopic } from "@/data/chemistry-topics";

interface TopicContentProps {
  topic: ChemistryTopic;
  onQuizComplete?: (topicId: string, score: number, total: number) => void;
}

export function TopicContent({ topic, onQuizComplete }: TopicContentProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  const handleAnswer = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    setShowResults((prev) => ({ ...prev, [qIdx]: true }));

    const newAnswers = { ...answers, [qIdx]: optIdx };
    const newShown = { ...showResults, [qIdx]: true };

    // Check if all questions answered
    if (Object.keys(newShown).length === topic.questions.length && onQuizComplete) {
      const correct = topic.questions.filter((q, i) => newAnswers[i] === q.correctIndex).length;
      onQuizComplete(topic.id, correct, topic.questions.length);
    }
  };

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
        </CardContent>
      </Card>
    </div>
  );
}
