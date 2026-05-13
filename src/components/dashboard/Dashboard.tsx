import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Timer, 
  TrendingUp, 
  Trophy, 
  ArrowRight, 
  Play, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Target,
  ChevronRight,
  BrainCircuit,
  Medal,
  Dumbbell,
  Utensils
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

import { UserProfile, BodyMetrics } from '@/types';
import { calculateMetrics } from '@/lib/fitnessUtils';

const calorieData = [
  { name: 'Mon', calories: 2100 },
  { name: 'Tue', calories: 1800 },
  { name: 'Wed', calories: 2400 },
  { name: 'Thu', calories: 2000 },
  { name: 'Fri', calories: 2600 },
  { name: 'Sat', calories: 1500 },
  { name: 'Sun', calories: 1900 },
];

const weightHistory = [
  { week: 'W1', weight: 80.5 },
  { week: 'W2', weight: 79.8 },
  { week: 'W3', weight: 79.2 },
  { week: 'W4', weight: 78.5 },
  { week: 'W5', weight: 77.9 },
  { week: 'W6', weight: 77.4 },
];

const achievements = [
  { id: 1, title: 'Early Bird', desc: '5 workouts before 8AM', icon: Zap, color: 'text-yellow-500' },
  { id: 2, title: 'Form King', desc: '98% avg pose score', icon: BrainCircuit, color: 'text-primary' },
  { id: 3, title: 'Flame On', desc: '7 day calorie streak', icon: Flame, color: 'text-orange-600' },
];

export default function Dashboard() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [metrics, setMetrics] = React.useState<BodyMetrics | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const p = JSON.parse(stored) as UserProfile;
      setProfile(p);
      setMetrics(calculateMetrics(p));
    }
  }, []);

  const stats = [
    { label: 'Body Mass Index', val: metrics?.bmi || '24.2', icon: Activity, sub: 'HEALTH_INDEX', color: 'text-primary' },
    { label: 'Energy Expenditure', val: metrics ? `${metrics.tdee}` : '2.4k', unit: 'KCAL', icon: Flame, sub: 'Daily Target', color: 'text-orange-500' },
    { label: 'Mass Goal', val: profile ? (profile.fitnessGoal === 'muscle_gain' ? 'Gain' : profile.fitnessGoal === 'fat_loss' ? 'Shred' : 'Stasis') : 'Cut', icon: TrendingUp, sub: 'Objective', color: 'text-blue-500' },
    { label: 'Hydration Target', val: metrics?.water || '3.5', unit: 'LITERS', icon: Target, sub: 'Optimal Fluid', color: 'text-cyan-500' },
  ];

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Neural Link Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-[0_0_30px_rgba(234,88,12,0.3)]">
              <BrainCircuit size={28} />
            </div>
            <div className="h-px w-16 bg-white/10" />
            <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black italic tracking-[0.2em] text-[10px] px-5 py-1.5 rounded-full">
              Neural Link Status: Optimized
            </Badge>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-[0.85] text-white"
          >
            System <br/> <span className="text-primary text-neon">Active</span>
          </motion.h1>
          <p className="mt-6 text-white/40 font-medium max-w-xl text-lg leading-relaxed text-balance">
            {profile ? `Greetings, subject. Analyzing biomechanic telemetry for current weight of ${profile.weight}kg. ` : 'Analyzing biomechanic telemetry. '}
            Your metabolic output is optimized for {profile?.fitnessGoal.replace('_', ' ') || 'maintenance'}. 
            Engaging hypertrophy protocols for maximum fiber recruitment.
          </p>
        </div>

        <div className="flex gap-6">
           <Card className="glass-card p-8 border-primary/20 bg-primary/5 min-w-[240px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={100} className="-rotate-12" />
              </div>
              <div className="text-[10px] font-black uppercase text-primary mb-2 tracking-[0.3em]">Neural Streak</div>
              <div className="flex items-end gap-3">
                 <span className="text-6xl font-black italic tracking-tighter">14</span>
                 <span className="text-xs font-black text-white/30 pb-2">DAYS</span>
              </div>
              <div className="mt-6 flex gap-1.5">
                 {[1,2,3,4,5,6,7].map(i => (
                   <div key={i} className={cn("h-1.5 w-full rounded-full transition-colors", i < 6 ? "bg-primary shadow-[0_0_10px_rgba(234,88,12,0.5)]" : "bg-white/5")} />
                 ))}
              </div>
           </Card>
        </div>
      </section>

      {/* Analytics Matrix */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card group overflow-hidden border-white/5 hover:border-primary/20 transition-all duration-500 h-full">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
               <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                     <div className={cn("p-3 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-colors", stat.color)}>
                        <stat.icon size={20} />
                     </div>
                     <Badge variant="outline" className="border-white/5 text-[8px] font-black tracking-widest text-white/40 px-2">{stat.sub}</Badge>
                  </div>
                  <div className="text-4xl font-black italic flex items-baseline gap-2 tracking-tighter">
                     {stat.val}
                     {stat.unit && <span className="text-sm font-bold text-white/30 uppercase">{stat.unit}</span>}
                  </div>
                  <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mt-2 italic">{stat.label}</div>
               </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Protocol Summary */}
      <section className="grid gap-8 lg:grid-cols-2 relative z-10">
         <Card className="glass-card p-10 border-primary/20 bg-primary/5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Utensils size={120} />
            </div>
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Active Fuel Protocol</h3>
                  <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-widest">Optimized for {profile?.fitnessGoal.replace('_', ' ') || 'maintenance'}</p>
               </div>
               <Button 
                  onClick={() => window.location.href = '/diet'}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:border-primary/40 bg-white/5 font-black uppercase italic text-[10px] tracking-widest"
               >
                  Full Menu
               </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
               <div className="glass p-5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[8px] font-black text-white/20 uppercase mb-2">Proteins</div>
                  <div className="text-2xl font-black italic text-primary">{metrics?.macros.protein}g</div>
               </div>
               <div className="glass p-5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[8px] font-black text-white/20 uppercase mb-2">Carbs</div>
                  <div className="text-2xl font-black italic">{metrics?.macros.carbs}g</div>
               </div>
               <div className="glass p-5 rounded-2xl border border-white/5 text-center">
                  <div className="text-[8px] font-black text-white/20 uppercase mb-2">Fats</div>
                  <div className="text-2xl font-black italic">{metrics?.macros.fat}g</div>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black italic text-xs">01</div>
                  <div className="flex-1">
                     <div className="text-[8px] font-black text-white/20 uppercase">Next Meal Recommendation</div>
                     <div className="text-sm font-black italic uppercase text-white/80">Hyper-Alpha Protein Synthesis Meal</div>
                  </div>
                  <ChevronRight size={16} className="text-white/20" />
               </div>
            </div>
         </Card>

         <Card className="glass-card p-10 border-white/5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Dumbbell size={120} />
            </div>
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Neural Training Protocol</h3>
                  <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-widest">Experience Level: {profile?.workoutExperience || 'Standard'}</p>
               </div>
               <Button 
                  onClick={() => window.location.href = '/fitness'}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:border-primary/40 bg-white/5 font-black uppercase italic text-[10px] tracking-widest"
               >
                  Load Routine
               </Button>
            </div>

            <div className="flex items-center gap-6 mb-8">
               <div className="flex items-center gap-2">
                  <Timer size={16} className="text-primary" />
                  <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">60 MIN SESSION</span>
               </div>
               <div className="flex items-center gap-2">
                  <Target size={16} className="text-orange-500" />
                  <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{metrics?.tdee} KCAL BURN TARGET</span>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 font-black italic text-xs">M</div>
                  <div className="flex-1">
                     <div className="text-[8px] font-black text-white/20 uppercase">Today's Focus Focus</div>
                     <div className="text-sm font-black italic uppercase text-white/80">{profile && (profile.fitnessGoal === 'muscle_gain' ? 'Hypertrophy / Push Phase' : profile.fitnessGoal === 'fat_loss' ? 'High Intensity Kinetic' : 'Neural Conditioning')}</div>
                  </div>
                  <Badge className="bg-primary text-black font-black italic text-[8px]">RECOMMENDED</Badge>
               </div>
            </div>
         </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 relative z-10">
        {/* Burn History */}
        <Card className="lg:col-span-2 glass-card p-10 border-white/5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
             <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Metabolic Intensity</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-widest">Neural flux sensor visualization</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <Badge className="bg-primary/20 text-primary border-primary/20 font-black italic text-[10px] px-4 py-1.5 rounded-full">LIVE_FEED</Badge>
             </div>
          </div>
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calorieData}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '24px', padding: '16px', fontSize: '10px' }}
                  itemStyle={{ color: '#ea580c', fontWeight: '900' }}
                  cursor={{ stroke: '#ea580c', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#ea580c" 
                  strokeWidth={6} 
                  fillOpacity={1} 
                  fill="url(#colorCalories)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insight Engine */}
        <Card className="glass-card p-10 bg-primary/5 border-primary/20 relative overflow-hidden group">
          <div className="absolute -bottom-20 -right-20 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
            <BrainCircuit size={400} className="rotate-45" />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Neural Insights</h3>
          <div className="space-y-8 relative z-10">
             <div className="p-6 rounded-[2rem] bg-black/60 border border-white/5 space-y-4 hover:border-primary/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-2 text-primary">
                   <Target size={18} />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Alpha-1</span>
                </div>
                <h4 className="font-black text-xl leading-none uppercase italic tracking-tight">Postural Symmetry detected low at W6.</h4>
                <p className="text-sm text-white/40 leading-relaxed font-medium">Neural scans indicate a 4.2% imbalance in posterior chain recruitment. Auto-correcting routine starting in 04:12m.</p>
                <Button className="w-full bg-primary text-black font-black uppercase italic rounded-2xl mt-4 h-12 text-sm shadow-xl neon-glow">
                   INITIATE CORRECTION
                </Button>
             </div>

             <div className="space-y-4">
                <div className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Achievements Unlocked</div>
                <div className="flex flex-wrap gap-3">
                   {achievements.map(a => (
                     <div key={a.id} className="h-14 w-14 rounded-2xl glass border-white/5 flex items-center justify-center group/icon relative hover:border-primary/20 transition-all cursor-help shadow-lg">
                        <a.icon size={22} className={a.color} />
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/icon:opacity-100 transition-all whitespace-nowrap z-50 shadow-2xl border-white/10 pointer-events-none">
                           {a.title}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 relative z-10">
          {/* Weight Matrix */}
          <Card className="glass-card p-10 border-white/5">
             <div className="mb-10 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Mass Delta</h3>
                  <p className="text-[10px] font-bold text-white/20 uppercase mt-1 tracking-widest">Skeletal Mass Matrix</p>
                </div>
                <div className="text-right">
                   <div className="text-2xl font-black italic text-primary">-1.2kg</div>
                   <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">MTD CHANGE</div>
                </div>
             </div>
             <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={weightHistory}>
                      <XAxis dataKey="week" stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <Tooltip 
                        cursor={{fill: '#ffffff05'}}
                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '20px', padding: '12px' }}
                      />
                      <Bar dataKey="weight" radius={[6, 6, 0, 0]} barSize={24}>
                         {weightHistory.map((_, index) => (
                           <Cell key={index} className="transition-all duration-500" fill={index === weightHistory.length - 1 ? '#ea580c' : '#ffffff10'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          {/* Training Load */}
          <Card className="glass-card p-10 lg:col-span-2 border-white/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4">
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Current Neural Load</h3>
                  <div className="flex items-center gap-3 text-primary mt-1">
                     <Dumbbell size={16} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hypertrophy Engine: Enabled</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-5xl font-black italic tracking-tighter">84%</div>
                   <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">System Capacity</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-3 gap-10">
                {[
                  { label: 'Volume Efficiency', val: 78, color: 'bg-primary' },
                  { label: 'Metabolic Recov', val: 62, color: 'bg-blue-500' },
                  { label: 'Neuromuscular Drv', val: 89, color: 'bg-green-500' }
                ].map((l, i) => (
                  <div key={i} className="space-y-4">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase text-white/20 tracking-widest leading-none">{l.label}</span>
                        <span className="text-xl font-black italic tracking-tighter leading-none">{l.val}%</span>
                     </div>
                     <div className="h-3 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${l.val}%` }}
                          transition={{ delay: 0.5 + i * 0.2, duration: 1.5, ease: "easeOut" }}
                          className={cn("h-full shadow-[0_0_15px_rgba(255,255,255,0.05)]", l.color, l.val > 80 && "shadow-[0_0_15px_rgba(234,88,12,0.3)]")} 
                        />
                     </div>
                  </div>
                ))}
             </div>
          </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
