import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Info, AlertTriangle, XCircle, Clock, BookOpen, Zap, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useStore } from '@/lib/store';
import { generateContent, ANALYZE_PROGRESS_PROMPT } from '@/lib/llm';
import { toast } from 'sonner';

export function Diary() {
  const { progress, lessons, clearLogs, settings, updateProgress } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const logs = logger.getLogs();

  const handleUpdateAnalysis = async () => {
    if (!settings.geminiKey && !settings.openRouterKey) {
      toast.error("Настройте API ключи для получения рекомендаций ИИ");
      return;
    }

    setIsUpdating(true);
    try {
      const prompt = ANALYZE_PROGRESS_PROMPT(progress, lessons);
      const result = await generateContent(prompt, {
        geminiKey: settings.geminiKey,
        openRouterKey: settings.openRouterKey,
        useOpenRouter: settings.useOpenRouter,
      });

      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        updateProgress({
          aiRecommendations: data.recommendations,
          forecast: data.forecast
        });
        toast.success("Рекомендации обновлены");
      }
    } catch (e) {
      logger.error("Analysis update error", e);
      toast.error("Не удалось обновить рекомендации");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (progress.completedLessons.length > 0 && (!progress.aiRecommendations || progress.aiRecommendations.length === 0)) {
      handleUpdateAnalysis();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Системный журнал</h1>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Дневник и Планирование</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">{logs.length} ЗАПИСЕЙ</Badge>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase" onClick={() => clearLogs()}>Очистить</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Адаптивный учебный план
              </CardTitle>
              <CardDescription>План подготовки к 1 классу, подстроенный под {progress.profile?.name || 'ученика'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-background/30">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    progress.completedLessons.includes(lesson.id) ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{lesson.title}</p>
                    <p className="text-[10px] text-muted-foreground">{lesson.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {progress.completedLessons.includes(lesson.id) ? 'Пройдено' : 'В плане'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Логи активности</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="divide-y divide-border/50">
                  {logs.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 opacity-20" />
                      <p className="text-xs font-mono">Журнал пуст.</p>
                    </div>
                  ) : (
                    [...logs].reverse().map((log: any, idx: number) => (
                      <div key={idx} className="p-3 flex gap-3 font-mono text-[10px]">
                        <span className="text-muted-foreground shrink-0">{format(new Date(log.timestamp), 'HH:mm')}</span>
                        <span className="flex-1 break-words">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Прогноз обучения
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={handleUpdateAnalysis}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.forecast && progress.forecast.length > 0 ? (
                progress.forecast.map((f, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    i === 0 ? 'bg-primary/5 border-primary/20' : 
                    i === 1 ? 'bg-green-500/5 border-green-500/20' : 
                    'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${
                      i === 0 ? 'text-primary' : 
                      i === 1 ? 'text-green-500' : 
                      'text-amber-500'
                    }`}>{f.category}</p>
                    <p className="text-xs">{f.prediction}</p>
                    <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${
                        i === 0 ? 'bg-primary' : 
                        i === 1 ? 'bg-green-500' : 
                        'bg-amber-500'
                      }`} style={{ width: `${f.progress}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] text-muted-foreground">Нажмите на иконку обновления для получения прогноза.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Рекомендации ИИ</CardTitle>
            </CardHeader>
            <CardContent>
              {progress.aiRecommendations && progress.aiRecommendations.length > 0 ? (
                <ul className="space-y-2">
                  {progress.aiRecommendations.map((rec, i) => (
                    <li key={i} className="text-[10px] flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-4">Рекомендации появятся после анализа прогресса.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
