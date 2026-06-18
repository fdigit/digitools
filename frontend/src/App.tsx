import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from 'next-themes';
import { DownloadTask, VideoInfo } from './types';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { Trash2, DownloadCloud, Moon, Sun, AlertCircle, PlusCircle, Cloud, Download, Github } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"

function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 hover:bg-white/10 h-10 w-10 transition-colors">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simulated User Account Sync component
function AccountSync() {
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const synced = localStorage.getItem('yt_account_sync');
    if (synced === 'true') {
      setIsSynced(true);
    }
  }, []);

  const toggleSync = () => {
    const newState = !isSynced;
    setIsSynced(newState);
    localStorage.setItem('yt_account_sync', String(newState));
    if (newState) {
      toast.success('Account connection established. Preferences will sync.');
    } else {
      toast.info('Account disconnected. Operating in local mode.');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Cloud className={`h-5 w-5 ${isSynced ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch id="sync-mode" checked={isSynced} onCheckedChange={toggleSync} />
      <Label htmlFor="sync-mode" className="text-sm">Cloud Sync</Label>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // When a URL is added, fetch info via our backend's oEmbed proxy
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newId = Date.now().toString();
    const newTask: DownloadTask = {
      id: newId,
      url: urlInput.trim(),
      progress: 0,
      status: 'fetching'
    };

    setTasks(prev => [newTask, ...prev]);
    setUrlInput('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/info?url=${encodeURIComponent(newTask.url)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch video information.');
      }
      const data: VideoInfo = await res.json();
      
      setTasks(prev => prev.map(t => {
        if (t.id === newId) {
          return {
            ...t,
            videoInfo: data,
            status: 'ready'
          };
        }
        return t;
      }));

    } catch (err: any) {
      setTasks(prev => prev.map(t => {
        if (t.id === newId) {
          return { ...t, status: 'error', error: err.message };
        }
        return t;
      }));
      toast.error(`Error processing video: ${err.message}`);
    }
  };

  const handleRemove = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col relative overflow-y-auto overflow-x-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
        </div>
        <Toaster position="bottom-center" />
        
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-md bg-black/20 w-full sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-red-600 to-orange-400 rounded-lg flex items-center justify-center">
              <DownloadCloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Digi<span className="text-red-500">Tools</span></h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <AccountSync />
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hidden sm:flex text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-12 space-y-8">
          
          {/* Input Section */}
          <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center">
            <CardHeader className="pb-6 px-0 text-center">
              <CardTitle className="text-3xl font-light text-white mb-2">Convert <span className="font-semibold italic text-red-500">Any</span> Video</CardTitle>
              <CardDescription className="text-white/40 mb-2 max-w-md mx-auto text-sm leading-relaxed">Enter a URL to fetch video details and download directly from reliable third-party servers.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleAddUrl} className="relative flex flex-col sm:flex-row gap-3 items-center w-full">
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 sm:py-7 px-6 text-lg focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all placeholder:text-white/20 shadow-inner text-white h-auto"
                  type="url"
                  required
                />
                <Button type="submit" size="lg" className="sm:absolute right-2 sm:right-3 sm:top-2 sm:bottom-2 h-auto py-3 bg-red-600 hover:bg-red-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95 w-full sm:w-auto mt-2 sm:mt-0 border-0">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Task
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-4 w-full">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <Card key={task.id} className="overflow-hidden bg-black/40 border border-white/5 rounded-2xl transition-all shadow-none">
                  <CardHeader className="p-4 bg-transparent border-b border-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {task.status === 'fetching' ? (
                          <div className="animate-pulse flex items-center space-x-3">
                            <div className="h-12 w-20 bg-muted rounded-md shrink-0"></div>
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        ) : task.status === 'error' ? (
                          <div className="flex items-center text-red-500 space-x-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span className="font-medium truncate text-sm">{task.url}</span>
                          </div>
                        ) : task.videoInfo ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <img 
                              src={task.videoInfo.thumbnail} 
                              alt="thumbnail" 
                              className="h-10 w-16 object-cover rounded-md shadow-sm shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-white truncate" title={task.videoInfo.title}>
                                {task.videoInfo.title}
                              </h3>
                              <p className="text-[10px] text-white/40 truncate">{task.videoInfo.author}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemove(task.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Status & Controls */}
                  {task.status !== 'fetching' && (
                    <CardContent className="p-4 bg-transparent">
                      {task.status === 'error' ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 text-red-400 mt-2">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="text-[10px] sm:text-xs font-bold truncate">{task.error}</p>
                        </div>
                      ) : task.status === 'ready' && task.videoInfo ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                          <a href={`https://cobalt.tools/?u=${encodeURIComponent(task.url)}`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full py-3 bg-blue-600/20 rounded-xl text-xs font-semibold border border-blue-500/30 text-blue-400 hover:bg-blue-600/40 transition-all h-10">
                              <DownloadCloud className="mr-2 h-4 w-4" />
                              Download with Cobalt (Ad-Free)
                            </Button>
                          </a>
                          <a href={`https://ssyoutube.com/en183x/youtube-video-downloader?url=${encodeURIComponent(task.url)}`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full py-3 bg-red-600/20 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-600/40 transition-all h-10">
                              <Download className="mr-2 h-4 w-4" />
                              Download with SaveFrom
                            </Button>
                          </a>
                        </div>
                      ) : null}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-16 px-4 bg-white/5 border border-dashed rounded-xl border-white/10">
                <DownloadCloud className="mx-auto h-12 w-12 text-white/10 mb-4" />
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/50">Batch Queue Empty</h3>
                <p className="text-sm text-white/30 mt-2">Paste a YouTube link above to get started.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
