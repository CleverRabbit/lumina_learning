import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { User, Baby, Heart, Brain, Save, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_INTERESTS = [
  'Животные', 'Космос', 'Рисование', 'Сказки', 'Машинки', 
  'Динозавры', 'Природа', 'Музыка', 'Спорт', 'Лего'
];

export function Profile() {
  const { progress, updateProfile, lessons } = useStore();
  
  const defaultProfile: any = {
    name: '',
    age: 6,
    gender: 'other',
    interests: [],
    targetLevel: 'beginner',
    questionnaireCompleted: false,
  };

  const profile = progress.profile || defaultProfile;

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [targetLevel, setTargetLevel] = useState(profile.targetLevel);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || []);

  const handleSave = () => {
    updateProfile({
      name,
      age,
      gender,
      targetLevel,
      interests: selectedInterests,
      questionnaireCompleted: true
    });
    toast.success("Профиль обновлен!");
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const getLearningStatus = () => {
    const completed = progress.completedLessons.length;
    const total = lessons.length;
    const readiness = profile.readinessAssessment;
    
    if (total === 0) return { label: 'Ожидание плана', percent: 0, readiness: 'Не определена' };
    
    const progressPercent = Math.round((completed / total) * 100);
    
    let readinessLabel = 'Начальная';
    if (readiness && readiness.length > 0) {
      const avgScore = readiness.reduce((acc: number, curr: any) => acc + curr.score, 0) / readiness.length;
      if (avgScore > 80) readinessLabel = 'Высокая';
      else if (avgScore > 50) readinessLabel = 'Средняя';
      else readinessLabel = 'Базовая';
    }

    return {
      label: completed === 0 ? 'Начало пути' : completed === total ? 'Курс завершен!' : 'В процессе',
      percent: progressPercent,
      readiness: readinessLabel
    };
  };

  const status = getLearningStatus();

  if (!profile.questionnaireCompleted && !name) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-10 px-4">
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Baby className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Добро пожаловать в Lumina!</CardTitle>
            <CardDescription>Давайте познакомимся поближе, чтобы составить лучший план обучения.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Как зовут маленького ученика?</Label>
              <Input 
                placeholder="Введите имя..." 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Возраст</Label>
                <Input 
                  type="number" 
                  min="3" 
                  max="8" 
                  value={isNaN(age) ? '' : age} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setAge(isNaN(val) ? 0 : val);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Пол</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                >
                  <option value="male">Мальчик</option>
                  <option value="female">Девочка</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Целевой уровень (к чему стремимся)</Label>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                  <Button
                    key={lvl}
                    variant={targetLevel === lvl ? 'default' : 'outline'}
                    className="text-xs h-12"
                    onClick={() => setTargetLevel(lvl as any)}
                  >
                    {lvl === 'beginner' ? 'Базовый' : lvl === 'intermediate' ? 'Уверенный' : 'Продвинутый'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Интересы ребенка</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map(interest => (
                  <Badge 
                    key={interest} 
                    variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer py-1.5 px-3"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 text-lg font-bold" onClick={handleSave}>
              Начать приключение!
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
          <User className="w-6 h-6 md:w-8 md:h-8" />
          Профиль ученика
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">Персональные данные и настройки обучения.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Анкета ученика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Возраст</Label>
                <Input type="number" value={isNaN(age) ? '' : age} onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAge(isNaN(val) ? 0 : val);
                }} />
              </div>
              <div className="space-y-2">
                <Label>Пол</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                >
                  <option value="male">Мальчик</option>
                  <option value="female">Девочка</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Целевой уровень</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value as any)}
                >
                  <option value="beginner">Базовый</option>
                  <option value="intermediate">Уверенный</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Интересы</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map(interest => (
                  <Badge 
                    key={interest} 
                    variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Сохранить изменения
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Статус обучения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold">Прогресс курса</p>
                  <p className="text-[10px] text-muted-foreground">{status.label} ({status.percent}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-bold">Готовность (диагностика)</p>
                  <p className="text-[10px] text-muted-foreground">{status.readiness}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold">Текущий уровень</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{progress.level} УРОВЕНЬ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Выбранные интересы</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {selectedInterests.length > 0 ? selectedInterests.map(interest => (
                <Badge key={interest} variant="secondary" className="text-[10px]">
                  <Heart className="w-3 h-3 mr-1 fill-current" />
                  {interest}
                </Badge>
              )) : (
                <p className="text-[10px] text-muted-foreground italic">Интересы не выбраны</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
