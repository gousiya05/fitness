import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Utensils, Droplets, Target, Calendar, Info, BrainCircuit, Activity } from 'lucide-react';
import { generateContent } from '@/services/geminiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, BodyMetrics } from '@/types';
import { calculateMetrics } from '@/lib/fitnessUtils';

interface DietPlan {
  summary: string;
  protein_target: string;
  water_intake: string;
  daily_calories: string;
  macros: {
    p: string;
    c: string;
    f: string;
  };
  meals: Array<{
    type: string;
    name: string;
    calories: string;
    macros: string;
    time: string;
  }>;
  weekly_planner: Array<{
    day: string;
    theme: string;
  }>;
  recovery_tips: string[];
}

export default function DietRecommendation() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<BodyMetrics | null>(null);
  const [plan, setPlan] = useState<DietPlan | null>(null);

  // Ensure plan fields have default empty arrays when undefined
  const recoveryTips = plan?.recovery_tips ?? [];
  const weeklyPlanner = plan?.weekly_planner ?? [];
  const meals = plan?.meals ?? [];

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const p = JSON.parse(stored) as UserProfile;
      setProfile(p);
      setMetrics(calculateMetrics(p));
    }
  }, []);

  const getDietPlan = async () => {
    if (!profile || !metrics) {
      toast.error("Telemetry data unavailable.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Generate a detailed futuristic diet plan for: 
      Gender: ${profile.gender}, Age: ${profile.age}, Height: ${profile.height}cm, Weight: ${profile.weight}kg, 
      Goal: ${profile.fitnessGoal}, Activity: ${profile.activityLevel}, Diet: ${profile.dietPreference}, Allergies: ${profile.allergies || 'none'}.
      Target Calories: ${metrics.tdee}kcal.
      
      Return ONLY a JSON object: 
      { 
        "summary": "Short scientific analysis of metabolic needs", 
        "protein_target": "${metrics.macros.protein}g",
        "water_intake": "${metrics.water} Liters",
        "daily_calories": "${metrics.tdee} kcal",
        "macros": { "p": "${metrics.macros.protein}g", "c": "${metrics.macros.carbs}g", "f": "${metrics.macros.fat}g" },
        "meals": [
          { "type": "Breakfast", "name": "Meal name", "calories": "approx kcal", "macros": "P/C/F", "time": "08:00" },
          { "type": "Pre-Workout", "name": "Meal name", "calories": "approx kcal", "macros": "P/C/F", "time": "16:00" },
          { "type": "Dinner", "name": "Meal name", "calories": "approx kcal", "macros": "P/C/F", "time": "20:00" },
          ...include lunch, snacks, and post-workout
        ],
        "weekly_planner": [{ "day": "Monday", "theme": "High Carb Re-feed" }, ...7 days],
        "recovery_tips": ["hydration tip", "metabolic tip", "sleep tip"]
      }`;
      
      const result = await generateContent(prompt, "You are a specialized AI sports nutritionist from the year 2088. Provide scientific, data-driven diet protocols in JSON format.");
      setPlan(result);
      toast.success("Nutrition protocols synchronized!");
    } catch (error) {
      console.error(error);
      toast.error("Metabolic link failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <Badge className="bg-primary/5 text-primary border-primary/20 mb-4 px-4 py-1.5 uppercase font-black italic tracking-widest text-[10px]">Neural Macro Engine v4.0</Badge>
           <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">Fuel <br/> <span className="text-primary text-neon">Protocols</span></h1>
        </div>
        <Button 
          onClick={getDietPlan} 
          className="h-16 px-12 bg-primary text-black font-black uppercase italic rounded-2xl text-xl shadow-2xl neon-glow active:scale-95 transition-all group"
          disabled={loading || !profile}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={24} className="mr-2 group-hover:scale-125 transition-transform" />}
          {loading ? "Synthesizing..." : "Initialize Synthesis"}
        </Button>
      </section>

      {profile && metrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           {[
             { label: 'Body Mass Index', val: metrics.bmi, icon: Activity, sub: 'METRIC_BM', color: 'text-blue-500' },
             { label: 'Energy Expenditure', val: `${metrics.tdee}kcal`, icon: Target, sub: 'DAILY_TDEE', color: 'text-primary' },
             { label: 'Basal Metabolism', val: `${metrics.bmr}kcal`, icon: BrainCircuit, sub: 'REST_STATE', color: 'text-purple-500' },
             { label: 'Water Reservoir', val: `${metrics.water}L`, icon: Droplets, sub: 'OPTIMAL_FLUID', color: 'text-cyan-500' },
           ].map((stat, i) => (
             <Card key={i} className="glass-card p-6 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <stat.icon size={48} />
                </div>
                <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">{stat.label}</div>
                <div className="text-3xl font-black italic tracking-tighter">{stat.val}</div>
                <Badge variant="outline" className="mt-4 border-white/5 text-[8px] font-black uppercase tracking-widest text-white/30">{stat.sub}</Badge>
             </Card>
           ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Macros & History */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="glass-card p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-5">
                 <Target size={200} />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 text-primary">Biometric Targets</h3>
              <div className="space-y-6">
                 {[
                   { label: 'Proteins', val: metrics?.macros.protein || '?', color: 'bg-primary' },
                   { label: 'Carbohydrates', val: metrics?.macros.carbs || '?', color: 'bg-blue-500' },
                   { label: 'Lipids (Fats)', val: metrics?.macros.fat || '?', color: 'bg-green-500' },
                 ].map((m, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{m.label}</span>
                         <span className="text-xl font-black italic">{m.val}g</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: m.val !== '?' ? '75%' : '0%' }} // Just for viz
                           className={cn("h-full", m.color)} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>

           {plan && (
             <Card className="glass-card p-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                   <Info size={20} className="text-primary" />
                   Health Intelligence
                </h3>
                <div className="space-y-4">
                   {recoveryTips.map((tip, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1 shadow-[0_0_8px_var(--color-primary)]" />
                        <p className="text-xs font-bold text-white/60 leading-relaxed uppercase">{tip}</p>
                     </div>
                   ))}
                </div>
             </Card>
           )}
        </div>

        {/* Right: Meals Table */}
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
             {!plan ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                  <Card className="glass-card h-[600px] flex flex-col items-center justify-center text-center border-dashed border-white/10 p-12">
                     <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5 shadow-2xl">
                        <Utensils size={48} />
                     </div>
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white/30 mb-4">Neural Data Required</h2>
                     <p className="text-white/20 font-medium max-w-sm mb-12">System is standing by. Click the synthesis button to initialize daily fuel protocols based on your biological signature.</p>
                     <div className="flex gap-4">
                        <div className="h-3 w-12 rounded-full bg-white/5" />
                        <div className="h-3 w-12 rounded-full bg-white/5" />
                        <div className="h-3 w-12 rounded-full bg-white/5" />
                     </div>
                  </Card>
               </motion.div>
             ) : (
               <motion.div 
                 key="diet-plan"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-8"
               >
                 <div className="grid gap-4 md:grid-cols-2">
                    {meals.map((meal, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="glass-card group overflow-hidden border-none hover:bg-white/[0.03] transition-all cursor-default">
                           <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                           <CardContent className="p-8">
                              <div className="flex justify-between items-start mb-6">
                                 <Badge className="bg-primary/10 text-primary border-primary/20 font-black italic text-[10px] uppercase px-4 py-1.5 rounded-xl">
                                    {meal.type}
                                 </Badge>
                                 <div className="text-right">
                                    <div className="text-sm font-black italic text-white/20">{meal.time}</div>
                                    <div className="text-[10px] font-black uppercase text-primary">{meal.calories}</div>
                                 </div>
                              </div>
                              <h4 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-primary transition-colors leading-none mb-4">{meal.name}</h4>
                              <div className="flex items-center gap-3 text-[10px] font-black uppercase text-white/40 tracking-widest bg-black/40 p-3 rounded-xl border border-white/5">
                                 <Activity size={12} className="text-primary" />
                                 PROT/CARB/FAT: {meal.macros}
                              </div>
                           </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                 </div>

                 <Card className="glass-card p-10 border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                       <Calendar size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-10">
                       <Calendar className="text-primary" size={28} />
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter">Hyper-Caloric Timeline</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                       {weeklyPlanner.map((day, i) => (
                         <div key={i} className="glass p-5 rounded-2xl border border-white/5 group hover:border-primary/40 transition-all text-center">
                            <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-[0.2em]">{day.day}</div>
                            <div className="text-[9px] font-bold text-white/40 uppercase leading-relaxed group-hover:text-white transition-colors">{day.theme}</div>
                         </div>
                       ))}
                    </div>
                 </Card>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
