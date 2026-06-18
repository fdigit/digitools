import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from 'next-themes';
import { DownloadTask, VideoInfo } from './types';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { Trash2, DownloadCloud, Moon, Sun, Monitor, AlertCircle, PlusCircle, CheckCircle2, Cloud, Download, Github, Key } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

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
    // Load preference from local storage to mock "login"
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
  
  // Auth State
  const [authStatus, setAuthStatus] = useState<'checking' | 'completed' | 'none'>('checking');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authUrl, setAuthUrl] = useState('');

  // Check auth status on load
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/auth/status`);
        const data = await res.json();
        if (data.status === 'completed' || data.hasToken) {
          setAuthStatus('completed');
        } else {
          setAuthStatus('none');
        }
      } catch (e) {
        setAuthStatus('none');
      }
    };
    checkStatus();
  }, []);

  // Poll auth status while modal is open
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuthModalOpen && authStatus !== 'completed') {
      interval = setInterval(async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiUrl}/api/auth/status`);
          const data = await res.json();
          if (data.status === 'completed' || data.hasToken) {
            setAuthStatus('completed');
            setIsAuthModalOpen(false);
            toast.success('Server Successfully Authenticated!');
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAuthModalOpen, authStatus]);

  const handleInitiateAuth = async () => {
    setIsAuthModalOpen(true);
    setAuthCode('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/init`, { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setAuthCode(data.code);
        setAuthUrl(data.url || 'https://www.google.com/device');
      } else {
        toast.error('Failed to generate code.');
        setIsAuthModalOpen(false);
      }
    } catch (e: any) {
      toast.error(`Error initiating auth: ${e.message}`);
      setIsAuthModalOpen(false);
    }
  };

  // When a URL is added, fetch info
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
          // Default select the best available quality
          const bestFormat = data.formats[0];
          return {
            ...t,
            videoInfo: data,
            selectedItag: bestFormat?.itag,
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

  const handleDownload = async (task: DownloadTask) => {
    if (!task.selectedItag) return;
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'downloading', progress: 10 } : t));

    try {
      // Create a simulated progress effect since actual download progress from browser fetch is complex
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/download?url=${encodeURIComponent(task.url)}&itag=${task.selectedItag}`);
      
      if (!res.ok) {
        throw new Error('Download failed on server');
      }

      const contentLength = res.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      let loaded = 0;
      
      const reader = res.body?.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            
            loaded += value.byteLength;
            if (total) {
              const currentProgress = Math.round((loaded / total) * 100);
              // Throttle UI updates in a real app, here we just set it
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: currentProgress } : t));
            }
            
            controller.enqueue(value);
          }
          controller.close();
          reader!.releaseLock();
        }
      });

      const responseStream = new Response(stream);
      const blob = await responseStream.blob();
      const blobUrl = URL.createObjectURL(blob);

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed', progress: 100, blobUrl } : t));

      // Auto trigger download
      const title = task.videoInfo?.title.replace(/[^\w\s-]/g, '') || 'video';
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Download completed!');

    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', error: err.message } : t));
      toast.error('Download failed');
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
            {authStatus !== 'checking' && (
              <Button 
                onClick={authStatus === 'completed' ? undefined : handleInitiateAuth} 
                variant="outline" 
                size="sm" 
                className={`hidden sm:flex text-xs h-8 font-semibold ${authStatus === 'completed' ? 'border-green-500/30 text-green-400 bg-green-500/10 cursor-default hover:bg-green-500/10 hover:text-green-400' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 hover:text-yellow-300'}`}
              >
                <Key className="mr-2 h-3 w-3" />
                {authStatus === 'completed' ? 'Server Authenticated' : 'Authenticate Server'}
              </Button>
            )}
            <AccountSync />
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hidden sm:flex text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <ThemeToggle />
          </div>
        </header>

        {/* Auth Modal Overlay */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-[#111] border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Key className="text-yellow-500 h-5 w-5" />
                  Authenticate Server
                </CardTitle>
                <CardDescription className="text-white/60">
                  Because Render uses shared datacenter IPs, YouTube requires this server to log in as a Smart TV to prove it's not a bot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!authCode ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="bg-black border border-white/5 rounded-xl p-4 text-center space-y-2">
                      <p className="text-sm text-white/50">Visit this URL on your phone or computer:</p>
                      <a href={authUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline block truncate">
                        {authUrl}
                      </a>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center space-y-2">
                      <p className="text-sm text-yellow-500/70 uppercase tracking-widest font-bold">Enter Code</p>
                      <p className="text-4xl font-black text-yellow-400 tracking-wider font-mono">{authCode}</p>
                    </div>
                    <p className="text-xs text-center text-white/40 animate-pulse">Waiting for approval...</p>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-white/5 pt-4">
                <Button variant="ghost" onClick={() => setIsAuthModalOpen(false)}>Cancel</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-12 space-y-8">
          
          {/* Input Section */}
          <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center">
            <CardHeader className="pb-6 px-0 text-center">
              <CardTitle className="text-3xl font-light text-white mb-2">Convert <span className="font-semibold italic text-red-500">Any</span> Video</CardTitle>
              <CardDescription className="text-white/40 mb-2 max-w-md mx-auto text-sm leading-relaxed">Enter a URL to fetch video qualities and download as MP4. Add multiple for batching.</CardDescription>
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
                      ) : task.status === 'downloading' ? (
                        <div className="space-y-2 mt-2">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-300" 
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-red-500 font-bold tracking-tighter">DOWNLOADING {task.progress}%</span>
                          </div>
                        </div>
                      ) : task.status === 'completed' ? (
                        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 flex justify-between items-center text-green-500 font-medium w-full mt-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="text-[10px] text-green-500/50 uppercase font-bold tracking-tighter">Completed</span>
                          </div>
                          <a href={task.blobUrl} download={`${task.videoInfo?.title.replace(/[^\w\s-]/g, '') || 'video'}.mp4`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs bg-black/40 text-white/80 border-white/10 hover:bg-white/10">Save Again</Button>
                          </a>
                        </div>
                      ) : task.status === 'ready' && task.videoInfo ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                          <div className="flex-1 w-full flex flex-col gap-2">
                            <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Resolution Quality</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-9 items-center justify-between rounded-md border border-white/5 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors w-full">
                                  {task.selectedItag 
                                    ? task.videoInfo.formats.find(f => f.itag === task.selectedItag)?.qualityLabel 
                                    : "Select resolution"}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[200px] border-white/10 bg-black/90 text-white backdrop-blur-xl">
                                {task.videoInfo.formats.map(f => (
                                  <DropdownMenuItem 
                                    key={f.itag}
                                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, selectedItag: f.itag } : t))}
                                    className={`${task.selectedItag === f.itag ? "bg-white/10 font-bold" : "text-white/60"} focus:bg-white/20`}
                                  >
                                    {f.qualityLabel} {f.hasAudio ? '' : '(No Audio)'} 
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <Button 
                            className="w-full sm:w-auto py-3 bg-red-600/20 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-600/40 transition-all h-10 mt-auto"
                            disabled={!task.selectedItag}
                            onClick={() => handleDownload(task)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Start Download
                          </Button>
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
