import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Activity, Zap, Scale, Clock, Heart, TrendingUp, Loader2, BrainCircuit, Sparkles, User, Thermometer } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { predictCalories } from '@/services/mlApiService';
import { toast } from 'sonner';


export default function CalorieTracker() {
  const [metrics, setMetrics] = useState({
    exercise: 'Running',
    duration: '30',
    heartRate: '145',
    weight: '75',
    age: '25',
    gender: 'Male',
    height: '175',
    bodyTemp: '37.0',
  });

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const p = JSON.parse(stored);
      setMetrics(prev => ({
        ...prev,
        weight: p.weight?.toString() || prev.weight,
        age: p.age?.toString() || prev.age,
        gender: p.gender === 'female' ? 'Female' : 'Male',
        height: p.height?.toString() || prev.height,
      }));
    }
  }, []);
  
  const [prediction, setPrediction] = useState<{
    burned: number,
    fatBurn: number,
    intensity: string,
    modelUsed: boolean,
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [calorieHistory, setCalorieHistory] = useState<Array<{ day: string; calories: number }>>([]); 

  // Load calorie history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('calorieHistory');
    if (stored) setCalorieHistory(JSON.parse(stored));
  }, []);

  const calculateBurn = async () => {
    const duration = parseFloat(metrics.duration);
    const hr = parseFloat(metrics.heartRate);
    const weight = parseFloat(metrics.weight);
    const age = parseFloat(metrics.age);
    const height = parseFloat(metrics.height);
    const bodyTemp = parseFloat(metrics.bodyTemp);

    if (!(duration > 0 && hr > 0 && weight > 0)) {
      toast.error('Enter valid exercise metrics.');
      return;
    }

    setLoading(true);
    try {
      const result = await predictCalories({
        gender: metrics.gender,
        age,
        height,
        weight,
        duration,
        heart_rate: hr,
        body_temp: bodyTemp,
      });
      setPrediction({
        burned: result.calories_burned,
        fatBurn: result.fat_burn_grams,
        intensity: result.intensity,
        modelUsed: result.model_used,
      });
      // Persist to localStorage history (keep last 7)
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const dayLabel = days[new Date().getDay()];
      const newEntry = { day: dayLabel, calories: result.calories_burned, ts: Date.now() };
      const existing: any[] = JSON.parse(localStorage.getItem('calorieHistory') || '[]');
      const updated = [...existing, newEntry].slice(-7);
      localStorage.setItem('calorieHistory', JSON.stringify(updated));
      setCalorieHistory(updated);
      toast.success(result.model_used ? 'ML Model prediction complete.' : 'Calorie estimate (fallback formula).');
    } catch (error) {
      // Fallback to local calculation
      console.warn('ML API unreachable, using local calculation:', error);
      const burned = parseFloat((duration * hr * weight * 0.0005).toFixed(1));
      const fatBurn = parseFloat((burned * 0.15).toFixed(1));
      setPrediction({
        burned,
        fatBurn,
        intensity: hr > 150 ? 'PEAK' : hr > 130 ? 'CARDIO' : 'FAT BURN',
        modelUsed: false,
      });
      toast.warning('Using offline calculation — ML backend unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase">
              <Zap size={20} className="text-primary" />
              Calorie AI
            </CardTitle>
            <CardDescription className="text-white/40 flex items-center gap-2">
              Predictive burn analysis
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5">
                <BrainCircuit size={10} className="mr-1" />
                ML Powered
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gender selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMetrics({ ...metrics, gender: 'Male' })}
                  className={cn(
                    "h-10 rounded-xl font-black uppercase text-xs transition-all border",
                    metrics.gender === 'Male'
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "glass border-white/5 text-white/40 hover:border-white/20"
                  )}
                >
                  Male
                </button>
                <button
                  onClick={() => setMetrics({ ...metrics, gender: 'Female' })}
                  className={cn(
                    "h-10 rounded-xl font-black uppercase text-xs transition-all border",
                    metrics.gender === 'Female'
                      ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                      : "glass border-white/5 text-white/40 hover:border-white/20"
                  )}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Age & Height */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Age (yrs)</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.age} onChange={(e) => setMetrics({...metrics, age: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Height (cm)</label>
                <div className="relative">
                  <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.height} onChange={(e) => setMetrics({...metrics, height: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" />
                </div>
              </div>
            </div>

            {/* Duration & Heart Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Duration (Min)</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.duration} onChange={(e) => setMetrics({...metrics, duration: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Heart Rate (Avg)</label>
                <div className="relative">
                  <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.heartRate} onChange={(e) => setMetrics({...metrics, heartRate: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" />
                </div>
              </div>
            </div>

            {/* Weight & Body Temp */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Body Weight (kg)</label>
                <div className="relative">
                  <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.weight} onChange={(e) => setMetrics({...metrics, weight: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Body Temp (°C)</label>
                <div className="relative">
                  <Thermometer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.bodyTemp} onChange={(e) => setMetrics({...metrics, bodyTemp: e.target.value})} className="pl-10 glass h-10 rounded-xl font-bold" type="number" step="0.1" />
                </div>
              </div>
            </div>

            <Button
              onClick={calculateBurn}
              disabled={loading}
              className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl neon-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Predicting...
                </>
              ) : (
                <>
                  <Sparkles size={20} className="mr-2" />
                  Run AI Inference
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
             <Card className="glass-card shadow-2xl overflow-hidden relative p-8 flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl" />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Total Burn Prediction</div>
                <div className="text-7xl font-black italic tracking-tighter text-white">{prediction?.burned || 0}</div>
                <div className="text-xs font-black uppercase text-primary mt-2">KCal Estimated</div>
                {prediction && (
                  <>
                    <Badge className="mt-4 bg-primary/20 text-primary border-primary/20 uppercase font-black text-[10px]">
                      {prediction.intensity} INTENSITY
                    </Badge>
                    {prediction.modelUsed && (
                      <Badge className="mt-2 bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] font-black uppercase tracking-wider px-3 py-1">
                        <BrainCircuit size={10} className="mr-1" />
                        ML Model
                      </Badge>
                    )}
                  </>
                )}
             </Card>

             <div className="space-y-4">
                <Card className="glass-card p-6 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-primary">
                      <Flame size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Fat Burn Estimate</div>
                      <div className="text-xl font-black italic">{prediction?.fatBurn || 0} <span className="text-xs text-white/40">Grams</span></div>
                   </div>
                </Card>
                <Card className="glass-card p-6 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                      <TrendingUp size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Efficiency Rank</div>
                      <div className="text-xl font-black italic">TOP 15%</div>
                   </div>
                </Card>
             </div>
          </div>

          <Card className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black uppercase italic tracking-tighter">Weekly Burn Matrix</h3>
              <div className="flex gap-2">
                 <div className="h-3 w-3 rounded-full bg-primary" />
                 <span className="text-[10px] font-black uppercase text-white/30">Active Calories</span>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={calorieHistory.length > 0 ? calorieHistory : [{day:'—', calories:0}]}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#ea580c', fontWeight: '900' }}
                  />
                  <Area type="monotone" dataKey="calories" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorCal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
