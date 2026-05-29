import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Home, Sparkles, ShieldCheck, Calculator, Flame, User, LogOut, Utensils, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'scanner', label: 'Food Scanner', icon: Utensils, path: '/scanner' },
  { id: 'pose', label: 'Live Form', icon: Activity, path: '/pose' },
  { id: 'fitness', label: 'Fitness', icon: Calculator, path: '/fitness' },
  { id: 'chat', label: 'AI Coach', icon: Sparkles, path: '/chat' },
  { id: 'diet', label: 'Diet', icon: Utensils, path: '/diet' },
  { id: 'tracker', label: 'Calories', icon: Flame, path: '/tracker' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
    toast.info("Neural Link Severed. Telemetry reset.");
  };

  const activeTab = navItems.find(item => location.pathname === item.path)?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black grid-bg">
      {/* Decorative Blur Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-24 flex-col items-center border-r border-white/5 bg-black/40 py-8 backdrop-blur-2xl md:flex z-50">
        <Link to="/" className="mb-14 group">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-black text-3xl italic tracking-tighter text-black shadow-2xl neon-glow transition-transform group-hover:scale-110 active:scale-95">
            F
          </div>
        </Link>
        
        <nav className="flex flex-1 flex-col gap-8">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "group relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                activeTab === item.id ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(234,88,12,0.1)]" : "text-white/20 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={22} className={cn("transition-transform group-hover:scale-110", activeTab === item.id && "drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]")} />
              {activeTab === item.id && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute -left-0.5 h-10 w-1 rounded-r-full bg-primary shadow-[0_0_15px_rgba(234,88,12,1)]"
                />
              )}
              {/* Tooltip */}
              <div className="absolute left-20 px-4 py-2 bg-black/90 border border-white/10 text-[10px] uppercase font-black tracking-widest text-white rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-[-10px] group-hover:translate-x-0 transition-all whitespace-nowrap z-50 glass">
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto h-14 w-14 flex items-center justify-center rounded-2xl text-white/20 hover:bg-red-500/10 hover:text-red-500 transition-all group relative border border-transparent hover:border-red-500/20"
        >
          <LogOut size={22} />
          <div className="absolute left-20 px-4 py-2 bg-black/90 border border-white/10 text-[10px] uppercase font-black tracking-widest text-red-500 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-[-10px] group-hover:translate-x-0 transition-all whitespace-nowrap z-50 glass">
            Sever Link
          </div>
        </button>
      </aside>

      {/* Header - Mobile */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/5 bg-black/40 p-5 backdrop-blur-2xl md:hidden glass">
        <Link to="/" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary font-black text-2xl italic tracking-tighter text-black shadow-lg">
            F
          </div>
          <span className="font-black tracking-widest italic text-2xl uppercase text-white/90">FLEXAI</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-black/98 pt-24 md:hidden backdrop-blur-3xl"
          >
            <nav className="flex flex-col p-8 gap-4 h-full overflow-y-auto">
              <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-4 text-center">Neural Interface</div>
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-6 rounded-3xl p-5 text-xl font-black uppercase italic tracking-tighter transition-all relative overflow-hidden group",
                    activeTab === item.id ? "bg-primary text-black shadow-2xl" : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  <item.icon size={28} />
                  {item.label}
                  {activeTab === item.id && (
                    <motion.div className="absolute right-6 h-2 w-2 rounded-full bg-black/40 animate-pulse" />
                  )}
                </Link>
              ))}
              <div className="mt-auto pt-8 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-6 rounded-3xl p-5 text-xl font-black uppercase italic tracking-tighter text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all"
                >
                  <LogOut size={28} />
                  Terminate Link
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="md:pl-24 pt-28 md:pt-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-10 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}

