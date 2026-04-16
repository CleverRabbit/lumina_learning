import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, BookOpen, CheckCircle2, Lock, Wand2, Edit3, Save, ClipboardCheck, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { generateContent } from '@/lib/llm';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { ReadinessTest } from './ReadinessTest';
import { CURRICULUM_JSON_FORMAT } from '@/lib/store';

export function Dashboard({ onSelectLesson }: { onSelectLesson: (id: string) => void }) {
  const { progress, lessons, curriculumPrompt, updateCurriculumPrompt, reorderLessons, settings } = useStore();
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(curriculumPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReadinessTest, setShowReadinessTest] = useState(false);
  
  const completedCount = progress.completedLessons.length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleGenerateCurriculum = async () => {
    setIsGenerating(true);
    const fullPrompt = `${tempPrompt}\n\n${CURRICULUM_JSON_FORMAT}`;
    logger.info("Generating curriculum with full prompt", { prompt: fullPrompt });
    
    try {
      const result = await generateContent(fullPrompt, {
        geminiKey: settings.geminiKey,
        openRouterKey: settings.openRouterKey,
        useOpenRouter: settings.useOpenRouter,
      });

      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const newLessons = JSON.parse(jsonMatch[1]);
        // All lessons available by default now
        const formattedLessons = newLessons.map((l: any) => ({
          ...l,
          status: 'available'
        }));
        reorderLessons(formattedLessons);
        toast.success("Учебный план успешно обновлен!");
        setIsEditingPrompt(false);
      } else {
        logger.error("JSON not found in LLM response", { result });
        throw new Error("Не удалось найти JSON в ответе ИИ");
      }
    } catch (e: any) {
      toast.error("Ошибка при генерации плана: " + e.message);
      logger.error("Curriculum generation error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'hard': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (showReadinessTest) {
    return <ReadinessTest onComplete={() => setShowReadinessTest(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary uppercase">Уроки и Обучение</h1>
          <p className="text-sm text-muted-foreground">Сказочный путь к знаниям для вашего ребенка.</p>
        </div>
        <Button 
          variant="outline" 
          className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
          onClick={() => setShowReadinessTest(true)}
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Диагностика готовности
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Left Column: Lessons Grid */}
        <div className="space-y-6">
          <Card className="bg-card border-border rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Учебный план: {lessons.length} уроков
                </CardTitle>
                <span className="text-[9px] md:text-[10px] font-mono text-primary">{Math.round(progressPercent)}% ЗАВЕРШЕНО</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lessons.map((lesson, idx) => {
                  const isCompleted = progress.completedLessons.includes(lesson.id);
                  
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div 
                        className={`group p-4 rounded-xl border-2 bg-background/50 transition-all cursor-pointer hover:border-primary/50 hover:shadow-lg ${
                          isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                        }`}
                        onClick={() => onSelectLesson(lesson.id)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={`text-[9px] font-mono uppercase ${getDifficultyColor(lesson.difficulty)}`}>
                            {lesson.difficulty === 'easy' ? 'Легко' : lesson.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                          </Badge>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </div>
                        <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{lesson.title}</h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">
                          {lesson.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                          <span className="text-[10px] font-mono text-primary">{lesson.xpReward} XP</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase group-hover:text-primary">Начать →</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Diary Preview */}
          <Card className="bg-card border-border rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Последняя запись в дневнике</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-l-2 border-primary/30 pl-4 py-1 italic text-xs md:text-sm text-muted-foreground">
                "Система инициализирована. Адаптивное перепланирование завершено. Готов к следующему циклу обучения."
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Curriculum Management */}
        <div className="space-y-6">
          <Card className="bg-card border-border rounded-xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Учебный план ИИ
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingPrompt ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full h-48 p-3 rounded-lg border border-border bg-background font-mono text-[10px] text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 text-[10px] h-8" 
                      onClick={() => {
                        updateCurriculumPrompt(tempPrompt);
                        setIsEditingPrompt(false);
                      }}
                    >
                      <Save className="w-3 h-3 mr-2" /> Сохранить промпт
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-[10px] h-8" 
                      onClick={handleGenerateCurriculum}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Генерация...' : 'Перегенерировать план'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground">
                    Ваш учебный план генерируется ИИ на основе стандартов подготовки к школе. Вы можете изменить промпт, чтобы добавить специфические темы.
                  </p>
                  <div className="bg-background border border-border p-3 rounded font-mono text-[9px] md:text-[10px] text-primary max-h-[150px] overflow-y-auto space-y-2">
                    <div className="border-b border-border/50 pb-2">
                      <span className="text-muted-foreground uppercase text-[8px] block mb-1">Редактируемая часть:</span>
                      {curriculumPrompt}
                    </div>
                    <div>
                      <span className="text-muted-foreground uppercase text-[8px] block mb-1">Формат (авто):</span>
                      <pre className="whitespace-pre-wrap opacity-60">{CURRICULUM_JSON_FORMAT}</pre>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] h-8 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                    onClick={() => setIsEditingPrompt(true)}
                  >
                    Редактировать промпт
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Star className="w-4 h-4" />
                Награды ученика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {progress.badges.length === 0 ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center opacity-30">
                        <Trophy className="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  progress.badges.map(badge => (
                    <div key={badge} className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/50 flex items-center justify-center" title={badge}>
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-black border border-border rounded-lg p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 font-mono text-[9px] md:text-[10px]">
        <div className="flex items-center gap-2 overflow-hidden w-full">
          <span className="text-green-500 shrink-0">[ИНФО]</span>
          <span className="text-muted-foreground truncate">
            {logger.getLogs()[0]?.message || `Система готова. Ученик: ${progress.profile?.name || 'Гость'}. Прогресс: ${Math.round(progressPercent)}%`} :: {JSON.stringify(logger.getLogs()[0]?.context || {})}
          </span>
        </div>
        <div 
          className="text-primary cursor-pointer hover:underline uppercase shrink-0"
          onClick={() => {
            const logs = logger.getLogs();
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-log-${new Date().getTime()}.json`;
            a.click();
          }}
        >
          DEBUG_EXPORT.JSON
        </div>
      </footer>
    </div>
  );
}
