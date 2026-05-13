import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  Zap, 
  Dumbbell, 
  BrainCircuit, 
  Activity,
  ArrowRight,
  User,
  Ruler,
  Weight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserProfile } from '@/types';

const steps = [
  { id: 'basics', title: 'Biological Data', icon: User },
  { id: 'metrics', title: 'Body Metrics', icon: Activity },
  { id: 'fitness', title: 'Mission Objective', icon: Target },
  { id: 'diet', title: 'Fuel Protocols', icon: Zap },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    gender: 'male',
    height: 180,
    weight: 75,
    fitnessGoal: 'muscle_gain',
    activityLevel: 'moderate',
    dietPreference: 'omnivore',
    allergies: '',
    workoutExperience: 'intermediate',
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to synchronize profile');
      
      localStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('onboarded', 'true');
      
      toast.success("Neural Integration Complete.");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="h-32 w-32 bg-primary rounded-[3rem] flex items-center justify-center text-black shadow-[0_0_80px_rgba(234,88,12,0.4)] mb-12"
        >
          <BrainCircuit size={64} />
        </motion.div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Synthesizing Protocol</h2>
        <p className="text-primary font-black uppercase tracking-[0.4em] animate-pulse">Analyzing body metrics and generating AI fitness plan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-primary grid-bg relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-xl w-full relative z-10">
        <header className="mb-12 text-center">
           <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black font-black italic text-2xl shadow-xl neon-glow mb-6">F</div>
           <h1 className="text-5xl font-black italic uppercase tracking-wider mb-2">Neural Link <span className="text-primary">Establishment</span></h1>
           <p className="text-white/30 text-xs font-black uppercase tracking-[0.3em]">Phase {currentStep + 1} of 4: {steps[currentStep].title}</p>
        </header>

        <div className="flex justify-between mb-8 px-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
               <div className={`h-1.5 w-16 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-primary shadow-[0_0_10px_rgba(234,88,12,0.8)]' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>

        <Card className="glass-card p-10 border-white/5 shadow-2xl relative overflow-hidden">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-8"
             >
               {currentStep === 0 && (
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Select Gender</label>
                       <div className="grid grid-cols-2 gap-4">
                          {['male', 'female'].map((g) => (
                            <button
                              key={g}
                              onClick={() => setProfile({...profile, gender: g as any})}
                              className={`h-16 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all ${profile.gender === g ? 'bg-primary text-black shadow-xl neon-glow border-transparent' : 'glass border-white/5 text-white/40 hover:border-primary/30'}`}
                            >
                              {g}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Age (Standard Earth Years)</label>
                       <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary" size={20} />
                          <Input 
                            type="number" 
                            value={profile.age} 
                            onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                            className="h-16 pl-12 glass border-transparent focus:border-primary/50 rounded-2xl font-black text-xl italic" 
                          />
                       </div>
                    </div>
                 </div>
               )}

               {currentStep === 1 && (
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Stature (CM)</label>
                       <div className="relative group">
                          <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary" size={20} />
                          <Input 
                            type="number" 
                            value={profile.height} 
                            onChange={(e) => setProfile({...profile, height: parseInt(e.target.value)})}
                            className="h-16 pl-12 glass border-transparent focus:border-primary/50 rounded-2xl font-black text-xl italic" 
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Mass Index (KG)</label>
                       <div className="relative group">
                          <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary" size={20} />
                          <Input 
                            type="number" 
                            value={profile.weight} 
                            onChange={(e) => setProfile({...profile, weight: parseInt(e.target.value)})}
                            className="h-16 pl-12 glass border-transparent focus:border-primary/50 rounded-2xl font-black text-xl italic" 
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Current Activity Level</label>
                       <select 
                         value={profile.activityLevel} 
                         onChange={(e) => setProfile({...profile, activityLevel: e.target.value as any})}
                         className="h-16 w-full glass border-transparent focus:border-primary/50 rounded-2xl font-black text-xs uppercase tracking-widest px-6"
                       >
                          <option value="sedentary">Sedentary (Work from Desk)</option>
                          <option value="light">Light (Active 1-2 days/week)</option>
                          <option value="moderate">Moderate (3-5 days/week)</option>
                          <option value="active">Active (Daily Training)</option>
                          <option value="very_active">Elite (Pro Training)</option>
                       </select>
                    </div>
                 </div>
               )}

               {currentStep === 2 && (
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Primary Mission</label>
                       <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'muscle_gain', label: 'Hypertrophy (Muscle Gain)' },
                            { id: 'fat_loss', label: 'Lipid Reduction (Fat Loss)' },
                            { id: 'maintenance', label: 'Stasis (Maintenance)' },
                            { id: 'strength', label: 'Neural Force (Pure Strength)' },
                            { id: 'endurance', label: 'Sustained Output (Endurance)' },
                          ].map((g) => (
                            <button
                              key={g.id}
                              onClick={() => setProfile({...profile, fitnessGoal: g.id as any})}
                              className={`h-14 px-6 rounded-2xl font-black uppercase italic tracking-tighter text-left text-xs transition-all ${profile.fitnessGoal === g.id ? 'bg-primary text-black shadow-lg border-transparent' : 'glass border-white/5 text-white/40 hover:border-primary/30'}`}
                            >
                              {g.label}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Experience Grade</label>
                       <div className="grid grid-cols-3 gap-2">
                          {['beginner', 'intermediate', 'advanced'].map((lv) => (
                            <button
                              key={lv}
                              onClick={() => setProfile({...profile, workoutExperience: lv as any})}
                              className={`h-12 rounded-xl font-black uppercase italic tracking-tighter text-[10px] transition-all ${profile.workoutExperience === lv ? 'bg-white/10 text-white shadow-lg border-white/20' : 'glass border-white/5 text-white/20 hover:border-primary/30'}`}
                            >
                              {lv}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {currentStep === 3 && (
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Dietary Preference</label>
                       <div className="grid grid-cols-2 gap-2">
                          {['omnivore', 'vegan', 'vegetarian', 'keto', 'paleo'].map((d) => (
                            <button
                              key={d}
                              onClick={() => setProfile({...profile, dietPreference: d as any})}
                              className={`h-14 rounded-2xl font-black uppercase italic tracking-tighter text-xs transition-all ${profile.dietPreference === d ? 'bg-primary text-black shadow-lg border-transparent' : 'glass border-white/5 text-white/40 hover:border-primary/30'}`}
                            >
                              {d}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Allergies / Critical Contaminants</label>
                       <Input 
                         placeholder="e.g. GLUTEN, PEANUTS, LACTOSE..." 
                         value={profile.allergies}
                         onChange={(e) => setProfile({...profile, allergies: e.target.value})}
                         className="h-16 glass border-transparent focus:border-primary/50 rounded-2xl font-black text-xs uppercase tracking-widest px-6" 
                       />
                    </div>
                 </div>
               )}
             </motion.div>
           </AnimatePresence>

           <div className="mt-12 flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={handlePrev} 
                className={`h-14 px-8 rounded-2xl font-black uppercase italic tracking-widest text-[10px] transition-all hover:bg-white/5 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ChevronLeft className="mr-2" size={16} /> Back
              </Button>
              <Button 
                onClick={handleNext}
                className="h-16 flex-1 bg-primary text-black hover:bg-white rounded-[1.5rem] font-black uppercase italic tracking-tighter text-lg shadow-xl neon-glow transition-all group"
              >
                {currentStep === steps.length - 1 ? 'Execute Protocol' : 'Sync Phase'}
                <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={20} />
              </Button>
           </div>
        </Card>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
          Biometric synchronization is encrypted at 256-bit metabolic hash.
        </p>
      </div>
    </div>
  );
}
