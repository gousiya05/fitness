import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Dumbbell, 
  BrainCircuit, 
  Trophy, 
  ShieldCheck, 
  Target, 
  Flame, 
  Play,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary overflow-x-hidden grid-bg">
      {/* Cinematic Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 blur-[180px] rounded-full" />
      </div>

      {/* Hero Section */}
      <header className="relative pt-32 pb-24 md:pt-48 md:pb-52 z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <Badge className="bg-primary/5 text-primary border-primary/20 px-6 py-2 rounded-full uppercase font-black italic tracking-[0.3em] text-[10px] mb-10 shadow-[0_0_20px_rgba(234,88,12,0.1)]">
              Next-Gen Neural Training
            </Badge>
            <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter italic uppercase leading-[0.8] mb-10">
              Future of <br/> <span className="text-primary text-neon">Fitness</span>
            </h1>
            <p className="max-w-2xl text-white/40 text-lg md:text-xl font-medium leading-relaxed mb-14 text-balance">
              Experience the world's most advanced AI-human fitness interface. Real-time skeletal mapping, metabolic prediction, and neural workout synthesis.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Button 
                onClick={() => navigate('/auth')}
                className="h-20 px-12 bg-primary text-black hover:bg-white rounded-[2rem] font-black text-xl italic uppercase tracking-tighter shadow-2xl neon-glow transition-all active:scale-95"
              >
                Establish Neural Link
                <ArrowRight className="ml-2" size={24} />
              </Button>
              <Button 
                variant="outline"
                className="h-20 px-12 glass border-white/10 hover:border-primary/20 rounded-[2rem] font-black text-xl italic uppercase tracking-tighter transition-all"
              >
                Watch Protocol 01
                <Play className="ml-2 fill-current" size={20} />
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Feature Matrix */}
      <section className="relative py-32 z-10">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 md:grid-cols-3">
             <Card className="glass-card p-10 border-white/5 group hover:border-primary/20 transition-all duration-700">
                <div className="h-16 w-16 rounded-[2rem] bg-white/5 flex items-center justify-center text-primary mb-10 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-xl">
                   <BrainCircuit size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Neural Posture AI</h3>
                <p className="text-white/30 font-medium leading-relaxed text-sm">Real-time computer vision analyzes every degree of movement to eliminate technical failures and maximize fiber recruitment.</p>
             </Card>

             <Card className="glass-card p-10 border-white/5 border-primary/20 bg-primary/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Sparkles size={120} />
                </div>
                <div className="h-16 w-16 rounded-[2rem] bg-primary flex items-center justify-center text-black mb-10 shadow-2xl neon-glow">
                   <Target size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-primary">Metabolic Engine</h3>
                <p className="text-white/40 font-medium leading-relaxed text-sm">Predictive calorie modeling using linear regression protocols. Sync your metabolic output with precision diet synthesis.</p>
             </Card>

             <Card className="glass-card p-10 border-white/5 group hover:border-primary/20 transition-all duration-700">
                <div className="h-16 w-16 rounded-[2rem] bg-white/5 flex items-center justify-center text-primary mb-10 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-xl">
                   <Trophy size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Evolution Tracking</h3>
                <p className="text-white/30 font-medium leading-relaxed text-sm">Comprehensive biometric data visualization. Monitor skeletal mass delta and volume efficiency over holographic timelines.</p>
             </Card>
          </div>
        </div>
      </section>

      {/* Social Verification */}
      <section className="relative py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-md">
                 <div className="text-primary font-black uppercase italic tracking-widest text-[10px] mb-4">Neural Network Stats</div>
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">Battle Tested <br/> Worldwide</h2>
                 <p className="text-white/40 font-medium leading-relaxed">Join 200k+ elite athletes optimizing their biological hardware with FlexAI.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 {[
                   { label: 'Neural Links', val: '200k+' },
                   { label: 'Reps Detected', val: '1.4B' },
                   { label: 'Calories Burned', val: '800M' },
                   { label: 'Global Rank', val: '#1' },
                 ].map((stat, i) => (
                   <div key={i} className="glass p-8 rounded-[2rem] border border-white/5 text-center min-w-[160px]">
                      <div className="text-3xl font-black italic text-white tracking-widest">{stat.val}</div>
                      <div className="text-[10px] font-black uppercase text-primary tracking-widest mt-2">{stat.label}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Final Call */}
      <section className="relative py-40 bg-primary/10 overflow-hidden border-y border-primary/20">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="container mx-auto px-6 relative z-10 text-center">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="flex flex-col items-center"
           >
             <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] mb-10">Start Your <br/> <span className="text-primary text-neon">Evolution</span></h2>
             <Button 
                onClick={() => navigate('/auth')}
                className="h-24 px-16 bg-white text-black hover:bg-primary rounded-[3rem] font-black text-2xl italic uppercase tracking-tighter shadow-2xl transition-all group"
             >
                Initialize Profile
                <ChevronRight className="ml-4 group-hover:translate-x-2 transition-transform" size={32} />
             </Button>
           </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 z-10 border-t border-white/5">
        <div className="container mx-auto px-6">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-black italic text-xl text-black">F</div>
                 <span className="font-black italic tracking-widest uppercase text-white/50">FlexAI Systems v4.2.0</span>
              </div>
              <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/20">
                 <a href="#" className="hover:text-primary transition-colors">Neural Security</a>
                 <a href="#" className="hover:text-primary transition-colors">Privacy Hash</a>
                 <a href="#" className="hover:text-primary transition-colors">API Console</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
