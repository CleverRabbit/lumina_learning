import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, Brain, ClipboardCheck } from 'lucide-react';
import { generateContent, READINESS_TEST_PROMPT, ANALYZE_READINESS_PROMPT } from '@/lib/llm';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { ReadinessTestResult } from '@/lib/types';

export function ReadinessTest({ onComplete }: { onComplete: () => void }) {
  const { settings, updateProfile, updateCurriculumPrompt, progress: storeProgress } = useStore();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<any>(null);
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    setLoading(true);
    try {
      const result = await generateContent(READINESS_TEST_PROMPT, {
        geminiKey: settings.geminiKey,
        openRouterKey: settings.openRouterKey,
        useOpenRouter: settings.useOpenRouter,
      });
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        setTestData(JSON.parse(jsonMatch[1]));
      } else {
        throw new Error("Failed to parse test data");
      }
    } catch (e) {
      logger.error("Readiness test load error", e);
      toast.error("Не удалось загрузить тест");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const nextCategory = () => {
    if (currentCategoryIdx + 1 < testData.categories.length) {
      setCurrentCategoryIdx(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    setIsAnalyzing(true);
    try {
      // Calculate results per category
      const results: ReadinessTestResult[] = testData.categories.map((cat: any) => {
        const catQuestions = cat.questions;
        const catAnswers = catQuestions.map((q: any) => answers[q.id] || 0);
        const maxScore = catQuestions.length * 2; // Assuming 3 options: 0, 1, 2
        const actualScore = catAnswers.reduce((a: number, b: number) => a + b, 0);
        const percentage = Math.round((actualScore / maxScore) * 100);
        
        return {
          category: cat.title,
          score: percentage,
          observations: percentage < 50 ? "Требует внимания" : percentage < 80 ? "Хороший уровень" : "Отличный уровень"
        };
      });

      updateProfile({ readinessAssessment: results, questionnaireCompleted: true });

      // Generate new curriculum prompt based on results
      const newPrompt = await generateContent(ANALYZE_READINESS_PROMPT(results, storeProgress.profile), {
        geminiKey: settings.geminiKey,
        openRouterKey: settings.openRouterKey,
        useOpenRouter: settings.useOpenRouter,
      });

      if (newPrompt) {
        updateCurriculumPrompt(newPrompt);
        toast.success("Диагностика завершена! Учебный план адаптирован.");
      }
      
      onComplete();
    } catch (e) {
      logger.error("Readiness analysis error", e);
      toast.error("Ошибка при анализе результатов");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Подготовка диагностического теста...</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center px-4">
        <Brain className="w-16 h-16 text-primary animate-pulse" />
        <h2 className="text-xl font-bold">ИИ анализирует результаты...</h2>
        <p className="text-muted-foreground max-w-xs">Мы создаем персональный путь обучения для вашего ребенка.</p>
      </div>
    );
  }

  const currentCategory = testData.categories[currentCategoryIdx];
  const progress = ((currentCategoryIdx + 1) / testData.categories.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-2 py-6">
      <Card className="bg-card border-border shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Диагностика готовности</Badge>
            <span className="text-[10px] font-mono">{currentCategoryIdx + 1} / {testData.categories.length}</span>
          </div>
          <CardTitle className="text-2xl font-black text-primary">{currentCategory.title}</CardTitle>
          <CardDescription>Ответьте на вопросы честно, чтобы мы могли лучше настроить обучение.</CardDescription>
          <Progress value={progress} className="h-1 mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {currentCategory.questions.map((q: any) => (
            <div key={q.id} className="space-y-3">
              <p className="font-bold text-sm md:text-base">{q.text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {q.options.map((opt: string, idx: number) => (
                  <Button
                    key={idx}
                    variant={answers[q.id] === idx ? "default" : "outline"}
                    className="h-auto py-3 text-xs"
                    onClick={() => handleAnswer(q.id, idx)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button 
            variant="ghost" 
            disabled={currentCategoryIdx === 0}
            onClick={() => setCurrentCategoryIdx(prev => prev - 1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
          <Button 
            className="flex-1"
            onClick={nextCategory}
          >
            {currentCategoryIdx + 1 === testData.categories.length ? 'Завершить' : 'Далее'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
