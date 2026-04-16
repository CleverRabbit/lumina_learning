import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Dashboard } from './components/Dashboard';
import { LessonPlayer } from './components/LessonPlayer';
import { Settings } from './components/Settings';
import { Diary } from './components/Diary';
import { Profile } from './components/Profile';
import { Toaster } from '@/components/ui/sonner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X,
  Zap,
  History,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'lesson' | 'diary' | 'profile'>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { progress } = useStore();

  const handleSelectLesson = (id: string) => {
    setSelectedLessonId(id);
    setActiveTab('lesson');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'diary', label: 'Дневник', icon: History },
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'settings', label: 'Настройки', icon: SettingsIcon },
  ];

  // Force profile if questionnaire not completed
  const currentTab = (!progress.profile?.questionnaireCompleted && activeTab !== 'settings') ? 'profile' : activeTab;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-[240px] border-r bg-sidebar flex flex-col z-50 lg:relative"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-extrabold text-lg text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-primary" />
                  <span>LUMINA_KIDS</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 py-4">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-10 px-6 rounded-none border-l-4 transition-all ${
                      currentTab === item.id 
                        ? "bg-primary/10 text-primary border-primary" 
                        : "text-muted-foreground border-transparent hover:bg-accent/50"
                    }`}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSelectedLessonId(null);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                ))}
              </div>

              <div className="mt-10 px-6">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Статистика</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Уровень</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{progress.level}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Опыт</span>
                    <span className="text-xs font-bold font-mono">{progress.xp}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Серия</span>
                    <span className="text-xs font-bold font-mono">{progress.streak} дн.</span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{progress.profile?.name || 'Ученик'}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Детский аккаунт</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <header className="h-14 border-b bg-background/50 backdrop-blur-md flex items-center px-4 md:px-6 sticky top-0 z-40">
          {!isSidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="mr-4">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Lumina Kids :: Подготовка к школе</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex gap-1 md:gap-2 scale-90 md:scale-100 origin-right">
              <Badge variant="outline" className="bg-card border-border text-[9px] md:text-[10px] font-mono py-0.5 px-2">
                LVL: <span className="text-amber-500 ml-1">{progress.level}</span>
              </Badge>
              <Badge variant="outline" className="bg-card border-border text-[9px] md:text-[10px] font-mono py-0.5 px-2">
                XP: <span className="text-primary ml-1">{progress.xp}</span>
              </Badge>
              <Badge variant="outline" className="bg-card border-border text-[9px] md:text-[10px] font-mono py-0.5 px-2">
                🔥 {progress.streak}
              </Badge>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
            <AnimatePresence mode="wait">
              {currentTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Dashboard onSelectLesson={handleSelectLesson} />
                </motion.div>
              )}

              {currentTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Settings />
                </motion.div>
              )}

              {currentTab === 'diary' && (
                <motion.div
                  key="diary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Diary />
                </motion.div>
              )}

              {currentTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Profile />
                </motion.div>
              )}

              {currentTab === 'lesson' && selectedLessonId && (
                <motion.div
                  key="lesson"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <LessonPlayer 
                    lessonId={selectedLessonId} 
                    onBack={() => setActiveTab('dashboard')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </main>
      
      <Toaster position="top-center" />
    </div>
  );
}
