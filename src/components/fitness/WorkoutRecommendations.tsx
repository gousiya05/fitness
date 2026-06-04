import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  Dumbbell, 
  Calendar, 
  Target, 
  Clock, 
  BrainCircuit, 
  Activity,
  Trophy,
  Zap,
  Info,
  Timer
} from 'lucide-react';
import { generateContent } from '@/services/geminiService';
import { recommendWorkout, type WorkoutResponse } from '@/services/mlApiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, BodyMetrics } from '@/types';
import { calculateMetrics } from '@/lib/fitnessUtils';

interface WorkoutPlan {
  recommendation: string;
  duration: string;
  calories_target: string;
  intensity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  exercises: Array<{
    name: string;
    sets: string;
    reps: string;
    instructions: string;
    muscle: string;
  }>;
  weekly_schedule: Array<{
    day: string;
    focus: string;
    rest: boolean;
  }>;
  recovery_suggestions: string[];
}

export default function WorkoutRecommendations() {
  const [loading, setLoading] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<BodyMetrics | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [mlPlan, setMlPlan] = useState<WorkoutResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ml' | 'ai'>('ml');

  const exercises = activeTab === 'ml' && mlPlan
    ? mlPlan.exercises
    : plan?.exercises ?? [];
  const weeklySchedule = activeTab === 'ml' && mlPlan
    ? mlPlan.weekly_plan
    : plan?.weekly_schedule ?? [];
  const recoverySuggestions = plan?.recovery_suggestions ?? [];

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const p = JSON.parse(stored) as UserProfile;
      setProfile(p);
      setMetrics(calculateMetrics(p));
    }
  }, []);

  // ML Model-based recommendation
  const getMlWorkoutPlan = async () => {
    if (!profile) {
      toast.error("User context missing.");
      return;
    }
    setMlLoading(true);
    try {
      const result = await recommendWorkout({
        age: profile.age,
        gender: profile.gender === 'female' ? 'Female' : 'Male',
        weight: profile.weight,
        height: profile.height,
        fitness_goal: profile.fitnessGoal,
        experience_level: profile.workoutExperience,
      });
      setMlPlan(result);
      setActiveTab('ml');
      toast.success(result.model_used
        ? 'ML Model workout generated.'
        : 'Workout plan generated (rule-based).');
    } catch (error) {
      console.error(error);
      toast.error("ML backend unavailable. Try Gemini AI instead.");
    } finally {
      setMlLoading(false);
    }
  };

  // Gemini AI-based recommendation
  const getWorkoutPlan = async () => {
    if (!profile) {
      toast.error("User context missing.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Generate a personalized high-performance workout plan for:
      Goal: ${profile.fitnessGoal}, Experience: ${profile.workoutExperience}, 
      Age: ${profile.age}, Gender: ${profile.gender}, Weight: ${profile.weight}kg, 
      Activity Level: ${profile.activityLevel}.
      
      Return ONLY a JSON object: 
      { 
        "recommendation": "Technical analysis of the training phase", 
        "duration": "e.g. 45-60 min", 
        "calories_target": "approx burn per session",
        "intensity": "High",
        "exercises": [
          { "name": "Exercise", "sets": "3", "reps": "12", "instructions": "Technical tip", "muscle": "Chest" },
          ...include 6-8 exercises focusing on body type and goal
        ],
        "weekly_schedule": [
          { "day": "Monday", "focus": "Push / Hypertrophy", "rest": false },
          ...include 7 days with specific rest days
        ],
        "recovery_suggestions": ["tip 1", "tip 2"]
      }`;
      
      const result = await generateContent(prompt, "You are a world-class AI fitness architect specializing in hypertrophy and neural conditioning. Provide precision data in JSON format.");
      setPlan(result);
      setActiveTab('ai');
      toast.success("Workout protocols synced.");
    } catch (error) {
      console.error(error);
      toast.error("Neural link failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <Badge className="bg-primary/5 text-primary border-primary/20 mb-4 px-4 py-1.5 uppercase font-black italic tracking-widest text-[10px]">Neural Protocol Engine v6.0</Badge>
           <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">Neural <br/> <span className="text-primary text-neon">Training</span></h1>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={getMlWorkoutPlan} 
            className="h-16 px-8 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-2xl text-lg shadow-2xl active:scale-95 transition-all group"
            disabled={mlLoading || !profile}
          >
            {mlLoading ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit size={24} className="mr-2 group-hover:scale-125 transition-transform" />}
            {mlLoading ? "Predicting..." : "ML Model"}
          </Button>
          <Button 
            onClick={getWorkoutPlan} 
            className="h-16 px-8 bg-primary text-black font-black uppercase italic rounded-2xl text-lg shadow-2xl neon-glow active:scale-95 transition-all group"
            disabled={loading || !profile}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={24} className="mr-2 group-hover:scale-125 transition-transform" />}
            {loading ? "Calculating Load..." : "Gemini AI"}
          </Button>
        </div>
      </section>

      {/* Active source indicator */}
      {(mlPlan || plan) && (
        <div className="flex gap-2">
          <button
            onClick={() => mlPlan && setActiveTab('ml')}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase transition-all",
              activeTab === 'ml'
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
            disabled={!mlPlan}
          >
            <BrainCircuit size={12} className="inline mr-1.5" />
            ML Model
          </button>
          <button
            onClick={() => plan && setActiveTab('ai')}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase transition-all",
              activeTab === 'ai'
                ? "bg-primary text-black shadow-lg"
                : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
            disabled={!plan}
          >
            <Sparkles size={12} className="inline mr-1.5" />
            Gemini AI
          </button>
        </div>
      )}

      {profile && metrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           <Card className="glass-card p-8 border-primary/20 bg-primary/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Target size={64} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Subject Objective</div>
              <div className="text-3xl font-black italic tracking-tighter uppercase">{profile.fitnessGoal?.replace('_', ' ') || 'MAINTENANCE'}</div>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-primary" />
                 </div>
                 <span className="text-[10px] font-black italic">85%</span>
              </div>
           </Card>

           <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <BrainCircuit size={64} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Neural Grade</div>
              <div className="text-3xl font-black italic tracking-tighter uppercase">{profile.workoutExperience}</div>
              <Badge variant="outline" className="mt-4 border-white/5 text-[8px] font-black uppercase tracking-widest text-white/30">LEVEL_XP_SYNC</Badge>
           </Card>

           <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Zap size={64} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Daily Threshold</div>
              <div className="text-3xl font-black italic tracking-tighter uppercase">{metrics.tdee} KCAL</div>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mt-4 italic">Estimated Burn Profile</div>
           </Card>
        </div>
      )}

      {/* ML Plan Summary */}
      {mlPlan && activeTab === 'ml' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="glass-card p-6 border-purple-500/20 bg-purple-500/5">
            <div className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">Workout Type</div>
            <div className="text-xl font-black italic uppercase tracking-tighter">{mlPlan.workout_type}</div>
          </Card>
          <Card className="glass-card p-6 border-purple-500/20 bg-purple-500/5">
            <div className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">Intensity</div>
            <div className="text-xl font-black italic uppercase tracking-tighter">{mlPlan.intensity}</div>
          </Card>
          <Card className="glass-card p-6 border-purple-500/20 bg-purple-500/5">
            <div className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">Source</div>
            <div className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
              <BrainCircuit size={20} />
              {mlPlan.model_used ? 'ML Model' : 'Rule Engine'}
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Weekly Timeline */}
        <div className="lg:col-span-4 space-y-8">
           {(activeTab === 'ml' ? mlPlan : plan) ? (
             <Card className="glass-card p-8 border-white/5">
                <div className="flex items-center gap-3 mb-8">
                   <Calendar className="text-primary" size={24} />
                   <h3 className="text-xl font-black italic uppercase tracking-tighter">Mission Timeline</h3>
                </div>
                <div className="space-y-3">
                   {weeklySchedule.map((day, i) => (
                     <div key={i} className={cn(
                       "flex items-center justify-between p-4 rounded-2xl border transition-all group",
                       day.rest ? "bg-white/[0.02] border-white/5 opacity-50" : "glass border-white/10 hover:border-primary/40 hover:bg-white/[0.05]"
                     )}>
                        <div className="space-y-1">
                           <div className="text-[10px] font-black text-primary uppercase tracking-widest">{day.day}</div>
                           <div className="text-sm font-black italic uppercase tracking-tighter text-white/80">{day.focus}</div>
                        </div>
                        {day.rest ? (
                          <Badge className="bg-blue-500/10 text-blue-500 border-transparent text-[8px] font-black">REST</Badge>
                        ) : (
                          <Badge className="bg-primary/10 text-primary border-transparent text-[8px] font-black">ACTIVE</Badge>
                        )}
                     </div>
                   ))}
                </div>
             </Card>
           ) : (
             <Card className="glass-card p-8 h-[500px] flex flex-col items-center justify-center text-center border-dashed">
                <Calendar size={48} className="text-white/10 mb-6" />
                <p className="text-white/20 font-black uppercase italic tracking-widest">Protocol Stasis</p>
             </Card>
           )}

           {plan && activeTab === 'ai' && (
             <Card className="glass-card p-8 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3 mb-6">
                   <Info size={20} className="text-primary" />
                   <h3 className="text-xl font-black italic uppercase tracking-tighter">System Recovery</h3>
                </div>
                <div className="space-y-4">
                   {recoverySuggestions.map((tip, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                        <Activity size={16} className="text-primary mt-0.5 shrink-0" />
                        <p className="text-[10px] font-black text-white/60 uppercase leading-relaxed">{tip}</p>
                     </div>
                   ))}
                </div>
             </Card>
           )}
        </div>

        {/* Exercises */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {!(activeTab === 'ml' ? mlPlan : plan) ? (
               <Card className="glass-card h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-white/10">
                  <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/10 mb-8 border border-white/5">
                    <Dumbbell size={48} />
                  </div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white/20">Pending Optimization</h3>
                  <p className="text-white/10 font-bold uppercase tracking-widest text-[10px] mt-2">Initialize neural link for exercise synthesis.</p>
               </Card>
             ) : (
               <motion.div 
                 key={`exercises-${activeTab}`}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/30">Movement Matrix</h3>
                    <div className="flex items-center gap-6">
                       {activeTab === 'ai' && plan && (
                         <>
                           <div className="flex items-center gap-2">
                              <Timer size={14} className="text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{plan.duration}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Activity size={14} className="text-orange-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{plan.calories_target} KCAL</span>
                           </div>
                         </>
                       )}
                       {activeTab === 'ml' && mlPlan && (
                         <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] font-black uppercase tracking-wider px-3 py-1">
                           <BrainCircuit size={10} className="mr-1" />
                           {mlPlan.model_used ? 'ML Prediction' : 'Rule Engine'}
                         </Badge>
                       )}
                    </div>
                 </div>

                 <div className="grid gap-4">
                   {exercises.map((ex, i) => (
                     <motion.div
                       key={`${activeTab}-${i}`}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                     >
                        <Card className="glass-card group hover:bg-white/[0.04] transition-all border-none relative overflow-hidden">
                           <div className={cn(
                             "absolute top-0 left-0 h-full w-1.5 group-hover:bg-primary transition-all",
                             activeTab === 'ml' ? "bg-purple-500/20 group-hover:bg-purple-500" : "bg-primary/20"
                           )} />
                           <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                              <div className="flex items-center gap-6">
                                 <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-xl">
                                    <Dumbbell size={28} />
                                 </div>
                                 <div>
                                    <div className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-1">{ex.muscle}</div>
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">{ex.name}</h4>
                                    <p className="text-[10px] font-bold text-white/30 uppercase mt-1 tracking-widest line-clamp-1">{ex.instructions}</p>
                                 </div>
                              </div>
                              <div className="flex gap-4 text-center">
                                 <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/5 min-w-[100px]">
                                    <div className="text-[8px] font-black text-white/20 uppercase mb-1">Sets</div>
                                    <div className="text-2xl font-black italic">{ex.sets}</div>
                                 </div>
                                 <div className="px-6 py-3 rounded-2xl bg-black/40 border border-white/5 min-w-[100px]">
                                    <div className="text-[8px] font-black text-white/20 uppercase mb-1">Reps</div>
                                    <div className="text-2xl font-black italic">{ex.reps}</div>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>
                   ))}
                 </div>

                 <div className="pt-8">
                    <Card className="glass-card p-10 border-primary/10 overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                          <Trophy size={160} />
                       </div>
                       <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                          <div className={cn(
                            "h-20 w-20 rounded-[2rem] flex items-center justify-center text-black shadow-2xl",
                            activeTab === 'ml' ? "bg-purple-500" : "bg-primary"
                          )}>
                             {activeTab === 'ml' ? <BrainCircuit size={40} /> : <Sparkles size={40} />}
                          </div>
                          <div>
                             <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
                               {activeTab === 'ml' ? 'ML Recommendation' : 'Neural Recommendation'}
                             </h4>
                             <p className="text-white/40 font-medium max-w-2xl leading-relaxed italic">
                               {activeTab === 'ml' && mlPlan
                                 ? mlPlan.recommendation
                                 : plan?.recommendation}
                             </p>
                          </div>
                       </div>
                    </Card>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
