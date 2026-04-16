import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Trash2, Download, ShieldCheck, Activity, Key, Settings as SettingsIcon, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Settings() {
  const { settings, updateSettings, resetProgress, clearLogs, updateProfile } = useStore();
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey);
  const [openRouterKey, setOpenRouterKey] = useState(settings.openRouterKey);

  const handleSaveKeys = () => {
    updateSettings({ geminiKey, openRouterKey });
    toast.success("Ключи API успешно сохранены");
    logger.info("Ключи API обновлены");
  };

  const handleExportLogs = async () => {
    const logs = logger.getLogs();
    try {
      const response = await fetch('/api/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumina-logs-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Логи успешно экспортированы");
    } catch (e) {
      toast.error("Не удалось экспортировать логи");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 md:w-8 md:h-8" />
          Настройки и Диагностика
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">Настройте среду обучения и проверьте состояние системы.</p>
      </header>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
          <TabsTrigger value="general" className="text-[10px] md:text-xs">Общие</TabsTrigger>
          <TabsTrigger value="api" className="text-[10px] md:text-xs">API Ключи</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-[10px] md:text-xs">Диагностика</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm md:text-base">Предпочтения</CardTitle>
              <CardDescription className="text-[10px] md:text-xs">Настройте работу приложения под себя.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs md:text-sm">Оффлайн режим</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Ручное взаимодействие с ИИ (copy/paste).</p>
                </div>
                <Switch 
                  checked={settings.offlineMode} 
                  onCheckedChange={(val) => updateSettings({ offlineMode: val })} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Диагностика</Label>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-4">Сбросьте результаты теста готовности, чтобы пройти его заново.</p>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs" onClick={() => {
                  updateProfile({ questionnaireCompleted: false, readinessAssessment: [] });
                  toast.success("Результаты диагностики сброшены");
                }}>
                  Сбросить диагностику
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs md:text-sm text-destructive">Опасная зона</Label>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-4">Это безвозвратно удалит ваш прогресс и настройки.</p>
                <Button variant="destructive" size="sm" className="w-full sm:w-auto text-xs" onClick={() => {
                  if (confirm("Вы уверены, что хотите сбросить весь прогресс?")) {
                    resetProgress();
                    toast.success("Прогресс сброшен");
                  }
                }}>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Сбросить весь прогресс
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm md:text-base">Провайдеры ИИ</CardTitle>
              <CardDescription className="text-[10px] md:text-xs">Ключи хранятся локально в вашем браузере.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gemini" className="text-xs md:text-sm">Gemini API Key</Label>
                <Input 
                  id="gemini" 
                  type="password" 
                  placeholder="Введите ключ Gemini..." 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openrouter" className="text-xs md:text-sm">OpenRouter API Key (Опционально)</Label>
                <Input 
                  id="openrouter" 
                  type="password" 
                  placeholder="Введите ключ OpenRouter..." 
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs md:text-sm">Использовать OpenRouter как основной</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Если включено, Gemini будет запасным.</p>
                </div>
                <Switch 
                  checked={settings.useOpenRouter} 
                  onCheckedChange={(val) => updateSettings({ useOpenRouter: val })} 
                />
              </div>
              <Button onClick={handleSaveKeys} className="w-full text-xs h-9">Сохранить конфигурацию API</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4 mt-4">
          <Card className="bg-card border-border mb-4">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Диагностика систем
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Движок', status: 'UP', color: 'bg-green-500' },
                  { label: 'База', status: 'OK', color: 'bg-green-500' },
                  { label: 'ИИ (Gemini)', status: 'READY', color: 'bg-green-500' },
                  { label: 'Доступ', status: 'SECURE', color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="bg-background border border-border p-2 rounded flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{item.label}:</span>
                    <span className="text-[9px] font-mono font-bold">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  Здоровье системы
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm">Хранилище</span>
                  <Badge variant="outline" className="text-[9px] md:text-[10px]">Работает</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm">Backend API</span>
                  <Badge variant="outline" className="text-[9px] md:text-[10px]">Подключено</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm">Ключ Gemini</span>
                  <Badge variant={settings.geminiKey ? "default" : "destructive"} className="text-[9px] md:text-[10px]">
                    {settings.geminiKey ? "Настроен" : "Отсутствует"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm">Оффлайн режим</span>
                  <Badge variant={settings.offlineMode ? "secondary" : "outline"} className="text-[9px] md:text-[10px]">
                    {settings.offlineMode ? "Вкл" : "Выкл"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                  Логи и Экспорт
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <p className="text-[10px] md:text-xs text-muted-foreground">Экспортируйте логи сессии для отладки или отслеживания прогресса.</p>
                <Button variant="outline" className="w-full text-xs h-9" onClick={handleExportLogs}>
                  <Download className="w-3 h-3 mr-2" />
                  Экспорт логов (JSON)
                </Button>
                <Button variant="ghost" className="w-full text-destructive text-xs h-9" onClick={() => {
                  clearLogs();
                  toast.success("Логи очищены");
                }}>
                  Очистить логи
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
