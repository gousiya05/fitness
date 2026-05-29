import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Activity, Zap, Scale, Clock, Heart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const weeklyData = [
  { day: 'Mon', calories: 2100 },
  { day: 'Tue', calories: 1850 },
  { day: 'Wed', calories: 2300 },
  { day: 'Thu', calories: 2000 },
  { day: 'Fri', calories: 1900 },
  { day: 'Sat', calories: 2500 },
  { day: 'Sun', calories: 2200 },
];

export default function CalorieTracker() {
  const [metrics, setMetrics] = useState({
    exercise: 'Running',
    duration: '30',
    heartRate: '145',
    weight: '75'
  });

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const p = JSON.parse(stored);
      setMetrics(prev => ({ ...prev, weight: p.weight.toString() }));
    }
  }, []);
  
  const [prediction, setPrediction] = useState<{
    burned: number,
    fatBurn: number,
    intensity: string
  } | null>(null);

  const calculateBurn = () => {
    const duration = parseFloat(metrics.duration);
    const hr = parseFloat(metrics.heartRate);
    const weight = parseFloat(metrics.weight);
    
    // Simple MET-like calculation
    const burned = (duration * hr * weight * 0.0005).toFixed(1);
    const fatBurn = (parseFloat(burned) * 0.15).toFixed(1);
    
    setPrediction({
      burned: parseFloat(burned),
      fatBurn: parseFloat(fatBurn),
      intensity: hr > 150 ? 'PEAK' : hr > 130 ? 'CARDIO' : 'FAT BURN'
    });
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
            <CardDescription className="text-white/40">Predictive burn analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Exercise Protocol</label>
              <div className="relative">
                 <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                 <Input 
                   value={metrics.exercise} 
                   onChange={(e) => setMetrics({...metrics, exercise: e.target.value})}
                   className="pl-10 glass h-12 rounded-xl font-bold"
                 />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Duration (Min)</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.duration} onChange={(e) => setMetrics({...metrics, duration: e.target.value})} className="pl-10 glass h-12 rounded-xl font-bold" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Heart Rate (Avg)</label>
                <div className="relative">
                  <Heart size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={metrics.heartRate} onChange={(e) => setMetrics({...metrics, heartRate: e.target.value})} className="pl-10 glass h-12 rounded-xl font-bold" type="number" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Body Weight (kg)</label>
              <div className="relative">
                <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                <Input value={metrics.weight} onChange={(e) => setMetrics({...metrics, weight: e.target.value})} className="pl-10 glass h-12 rounded-xl font-bold" type="number" />
              </div>
            </div>

            <Button onClick={calculateBurn} className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl neon-glow">
               Run AI Inference
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
                   <Badge className="mt-4 bg-primary/20 text-primary border-primary/20 uppercase font-black text-[10px]">
                     {prediction.intensity} INTENSITY
                   </Badge>
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
                <AreaChart data={weeklyData}>
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
