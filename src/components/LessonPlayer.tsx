import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Lesson, ChecklistItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Copy, Check, Trophy, Baby, Edit3, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateContent, LESSON_PROMPT } from '@/lib/llm';
import { logger } from '@/lib/logger';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const ImageRenderer = ({ keyword, onUpdate }: { keyword: string, onUpdate?: (newUrl: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(`https://picsum.photos/seed/${encodeURIComponent(keyword)}/800/450`);
  const [tempUrl, setTempUrl] = useState(url);

  const handleSave = () => {
    setUrl(tempUrl);
    setIsEditing(false);
    if (onUpdate) onUpdate(tempUrl);
  };

  return (
    <div className="my-8 group relative rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl transition-all hover:border-primary/40">
      <img 
        src={url} 
        alt={keyword} 
        className="w-full h-auto object-cover aspect-video"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
          <Edit3 className="w-4 h-4 mr-2" /> Заменить картинку
        </Button>
      </div>
      <div className="bg-primary/10 p-3 text-center text-[10px] font-bold text-primary uppercase tracking-[0.3em]">
        {keyword}
      </div>

      {isEditing && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-6 z-10">
          <div className="w-full space-y-4">
            <h4 className="text-sm font-bold">Введите URL картинки</h4>
            <Input 
              value={tempUrl} 
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleSave}>Сохранить</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function LessonPlayer({ lessonId, onBack }: { lessonId: string, onBack: () => void }) {
  const { lessons, settings, updateLesson, completeLesson, progress } = useStore();
  const lesson = lessons.find(l => l.id === lessonId);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [checklistFinished, setChecklistFinished] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualUI, setShowManualUI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPromptApproval, setShowPromptApproval] = useState(!lesson?.content);
  const [currentPrompt, setCurrentPrompt] = useState(LESSON_PROMPT(lesson?.title || '', progress.profile));

  useEffect(() => {
    if (!lesson?.content) {
      setCurrentPrompt(LESSON_PROMPT(lesson?.title || '', progress.profile));
      setShowPromptApproval(true);
    }
  }, [lessonId]);

  const loadLessonContent = async () => {
    setLoading(true);
    setError(null);
    setShowPromptApproval(false);
    try {
      const result = await generateContent(currentPrompt, {
        geminiKey: settings.geminiKey,
        openRouterKey: settings.openRouterKey,
        useOpenRouter: settings.useOpenRouter,
      });

      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      let parentChecklist: ChecklistItem[] = [];
      let content = result;

      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          parentChecklist = data.parentChecklist || [];
          content = result.replace(jsonMatch[0], '');
        } catch (e) {
          logger.warn("Failed to parse checklist JSON from LLM", e);
        }
      }

      if (lesson) {
        updateLesson({ ...lesson, content, parentChecklist });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson content.");
      logger.error("Lesson generation error", err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\[IMAGE:.*?\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[IMAGE:(.*?)\]/);
      if (match) {
        return <ImageRenderer key={i} keyword={match[1].trim()} />;
      }
      return <ReactMarkdown key={i}>{part}</ReactMarkdown>;
    });
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    
    const jsonMatch = manualInput.match(/```json\n([\s\S]*?)\n```/);
    let parentChecklist: ChecklistItem[] = [];
    let content = manualInput;

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        parentChecklist = data.parentChecklist || [];
        content = manualInput.replace(jsonMatch[0], '');
      } catch (e) {}
    }

    if (lesson) {
      updateLesson({ ...lesson, content, parentChecklist });
      setShowManualUI(false);
      setShowPromptApproval(false);
    }
  };

  const toggleCheckItem = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const finishChecklist = () => {
    const allChecked = lesson?.parentChecklist?.every((_, idx) => checkedItems[idx]);
    if (allChecked) {
      confetti();
      completeLesson(lessonId, lesson?.xpReward || 0);
      toast.success(`Урок пройден! +${lesson?.xpReward} XP`);
      setChecklistFinished(true);
    } else {
      toast.error("Пожалуйста, отметьте все пункты чек-листа!");
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center px-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <Wand2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-black text-primary uppercase tracking-tighter">Сказочник пишет главу...</p>
          <p className="text-sm text-muted-foreground">Это будет волшебное приключение!</p>
        </div>
      </div>
    );
  }

  if (showPromptApproval) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-2">
        <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Подготовка урока</Badge>
              <Button variant="ghost" size="sm" onClick={onBack} className="h-7 text-[10px]">ОТМЕНА</Button>
            </div>
            <CardTitle className="text-xl font-black text-primary uppercase">Одобрение промпта</CardTitle>
            <CardDescription>Вы можете отредактировать запрос к ИИ перед генерацией урока.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Запрос к Сказочнику</Label>
              <textarea
                className="w-full h-64 p-4 rounded-xl border border-border bg-background font-mono text-xs text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
              />
            </div>
            
            {settings.offlineMode && (
              <div className="space-y-2 pt-4 border-t border-border/50">
                <Label className="text-[10px] font-bold uppercase text-primary">Оффлайн режим: Вставьте ответ ИИ</Label>
                <textarea
                  className="w-full h-48 p-4 rounded-xl border border-primary/30 bg-primary/5 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Скопируйте промпт выше, получите ответ от любой LLM и вставьте его сюда..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 font-bold" 
              onClick={copyPrompt}
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Копировать промпт
            </Button>
            <Button 
              className="flex-[2] h-12 font-black text-lg shadow-lg" 
              onClick={settings.offlineMode ? handleManualSubmit : loadLessonContent}
            >
              {settings.offlineMode ? 'Сохранить урок' : 'Начать генерацию'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Упс! Что-то пошло не так</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={onBack}>Назад</Button>
          <Button size="sm" onClick={loadLessonContent}>Повторить</Button>
        </div>
      </div>
    );
  }

  if (showChecklist && lesson?.parentChecklist) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-2">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setShowChecklist(false)} className="text-xs">
            <ArrowLeft className="w-3 h-3 mr-2" /> Вернуться к уроку
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono">Контроль для родителей</Badge>
        </div>

        {!checklistFinished ? (
          <Card className="bg-card border-border shadow-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl text-center text-primary">Чек-лист проверки знаний</CardTitle>
              <p className="text-center text-xs text-muted-foreground">Отметьте, что ребенок уже умеет делать после этого урока.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {lesson.parentChecklist.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      checkedItems[idx] ? 'bg-primary/5 border-primary' : 'bg-background border-border hover:border-primary/30'
                    }`}
                    onClick={() => toggleCheckItem(idx)}
                  >
                    <div className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      checkedItems[idx] ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {checkedItems[idx] && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm md:text-base">{item.task}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-14 text-lg font-bold shadow-lg" 
                onClick={finishChecklist}
              >
                Завершить проверку
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="text-center py-10 bg-card border-border shadow-2xl">
            <CardContent className="space-y-6">
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Trophy className="w-12 h-12 text-amber-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-primary">ОТЛИЧНАЯ РАБОТА!</h2>
                <p className="text-muted-foreground text-lg">Вы успешно прошли проверку знаний!</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button variant="outline" size="lg" className="font-bold" onClick={() => {
                  setChecklistFinished(false);
                  setCheckedItems({});
                }}>Пройти еще раз</Button>
                <Button size="lg" className="font-bold shadow-lg" onClick={onBack}>В меню</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 px-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs font-bold text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Trophy className="w-3 h-3 mr-1" />
          +{lesson?.xpReward} XP
        </Badge>
      </div>

      <Card className="bg-card/50 border-border shadow-xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-primary/5 border-b border-border/50 py-8">
          <CardTitle className="text-2xl md:text-4xl font-black text-center text-primary leading-tight">
            {lesson?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-10">
          <div className="prose prose-invert max-w-none prose-lg text-foreground/90 leading-relaxed">
            {renderContent(lesson?.content || '')}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-8">
        <Button size="lg" className="h-16 px-12 text-xl font-black shadow-2xl hover:scale-105 transition-transform" onClick={() => setShowChecklist(true)}>
          ПРОВЕРИТЬ ЗНАНИЯ (ДЛЯ РОДИТЕЛЕЙ)
          <ArrowRight className="w-6 h-6 ml-3" />
        </Button>
      </div>
    </div>
  );
}

