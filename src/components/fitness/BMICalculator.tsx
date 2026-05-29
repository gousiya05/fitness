import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Scale, Ruler, Activity, TrendingUp, AlertCircle, Apple, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const dummyHistory = [
  { day: 'Mon', bmi: 24.5 },
  { day: 'Tue', bmi: 24.4 },
  { day: 'Wed', bmi: 24.2 },
  { day: 'Thu', bmi: 24.1 },
  { day: 'Fri', bmi: 23.9 },
  { day: 'Sat', bmi: 23.8 },
  { day: 'Sun', bmi: 23.6 },
];

export default function BMICalculator() {
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('180');
  const [age, setAge] = useState<string>('25');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [risk, setRisk] = useState<string>('');
  const [calorieIntake, setCalorieIntake] = useState<number>(0);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    const a = parseInt(age);
    if (w > 0 && h > 0) {
      const result = w / (h * h);
      const roundedBmi = parseFloat(result.toFixed(1));
      setBmi(roundedBmi);
      
      // Calculate BMR (Mifflin-St Jeor) - simple version
      const bmr = 10 * w + 6.25 * (h * 100) - 5 * a + 5;
      setCalorieIntake(Math.round(bmr * 1.55)); // Moderately active

      if (result < 18.5) {
        setCategory('Underweight');
        setRisk('High vulnerability to immune issues.');
      } else if (result < 25) {
        setCategory('Healthy');
        setRisk('Low metabolic risk profile.');
      } else if (result < 30) {
        setCategory('Overweight');
        setRisk('Increased hypertension risk.');
      } else {
        setCategory('Obese');
        setRisk('High cardiovascular warning.');
      }
    }
  };

  const getGaugePosition = () => {
    if (!bmi) return 0;
    const pos = ((bmi - 15) / (35 - 15)) * 100;
    return Math.min(Math.max(pos, 0), 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase">
              <Calculator className="text-primary" />
              BMI Intel
            </CardTitle>
            <CardDescription className="text-white/40">Neural biometric assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Weight (kg)</label>
                <div className="relative">
                  <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="pl-10 h-12 glass border-white/5 rounded-xl text-lg font-bold" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Height (cm)</label>
                <div className="relative">
                  <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                  <Input value={height} onChange={(e) => setHeight(e.target.value)} className="pl-10 h-12 glass border-white/5 rounded-xl text-lg font-bold" type="number" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Age (years)</label>
              <div className="relative">
                <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                <Input value={age} onChange={(e) => setAge(e.target.value)} className="pl-10 h-12 glass border-white/5 rounded-xl text-lg font-bold" type="number" />
              </div>
            </div>
            <Button onClick={calculateBMI} className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black uppercase italic rounded-2xl neon-glow">
              Engage Neural Scan
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {bmi ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid gap-6 md:grid-cols-2"
              >
                <Card className="glass-card shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -z-10" />
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Neural Score</div>
                      <div className="text-8xl font-black text-white italic tracking-tighter">{bmi}</div>
                      <Badge className={cn(
                        "mt-4 text-xs font-black uppercase px-6 py-2 rounded-full",
                        category === 'Healthy' ? "bg-green-500/20 text-green-500" : "bg-orange-500/20 text-orange-500"
                      )}>
                        {category} Range
                      </Badge>
                    </div>

                    <div className="mt-12 space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-white/20 uppercase">
                        <span>Under</span>
                        <span>Normal</span>
                        <span>Over</span>
                        <span>Obese</span>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 opacity-20" />
                        <motion.div 
                          className="absolute h-full w-1.5 bg-white shadow-[0_0_10px_white] z-10"
                          initial={{ left: 0 }}
                          animate={{ left: `${getGaugePosition()}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="glass-card p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-600/10 text-primary">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Health Risk Prediction</div>
                        <div className="font-bold text-sm">{risk}</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="glass-card p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500">
                        <Apple size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Target Daily Fuel</div>
                        <div className="font-bold text-xl">{calorieIntake} <span className="text-xs text-white/40">KCAL</span></div>
                      </div>
                    </div>
                  </Card>
                  <Card className="glass-card p-6 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-600/10 text-primary">
                        <Dumbbell size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">Optimizer Note</div>
                        <div className="text-sm font-medium">Focus on {bmi > 25 ? 'Steady Cardio' : 'Heavy Compounds'}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <Card className="glass-card h-[400px] flex items-center justify-center border-dashed text-center p-12">
                <div>
                  <TrendingUp size={48} className="mx-auto text-white/10 mb-6" />
                  <h3 className="text-2xl font-bold text-white/20 uppercase italic italic">Awaiting Telemetry Data</h3>
                  <p className="text-white/10 mt-2">Enter your dimensions to start historical tracking</p>
                </div>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Card className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black italic uppercase tracking-tighter">BMI Delta History</h3>
           <Badge variant="outline" className="border-white/5 glass">Syncing Local</Badge>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dummyHistory}>
              <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[20, 30]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="bmi" stroke="#ea580c" strokeWidth={4} dot={{ r: 4, fill: '#ea580c' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
