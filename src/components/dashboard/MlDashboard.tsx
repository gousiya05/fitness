import React from 'react';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  Zap,
  Target,
  Loader2,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Scale,
  Flame,
  Dumbbell,
  Heart,
  Activity,
  Wifi,
  WifiOff,
  Sparkles,
  Clock,
  User,
  Ruler,
  Thermometer,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  checkHealth,
  predictBMI,
  predictCalories,
  recommendWorkout,
  type HealthResponse,
  type BMIPredictionResponse,
  type CaloriePredictionResponse,
  type WorkoutResponse,
} from '@/services/mlApiService';

export default function MlDashboard() {
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // BMI prediction state
  const [bmiInputs, setBmiInputs] = React.useState({ gender: 'Male', height: '175', weight: '75' });
  const [bmiResult, setBmiResult] = React.useState<BMIPredictionResponse | null>(null);
  const [bmiLoading, setBmiLoading] = React.useState(false);

  // Calorie prediction state
  const [calorieInputs, setCalorieInputs] = React.useState({
    gender: 'Male', age: '25', height: '175', weight: '75',
    duration: '30', heart_rate: '145', body_temp: '37.0',
  });
  const [calorieResult, setCalorieResult] = React.useState<CaloriePredictionResponse | null>(null);
  const [calorieLoading, setCalorieLoading] = React.useState(false);

  // Workout recommendation state
  const [workoutInputs, setWorkoutInputs] = React.useState({
    age: '25', gender: 'Male', weight: '75', height: '175',
    fitness_goal: 'muscle_gain', experience_level: 'intermediate',
  });
  const [workoutResult, setWorkoutResult] = React.useState<WorkoutResponse | null>(null);
  const [workoutLoading, setWorkoutLoading] = React.useState(false);

  // Check health on mount
  React.useEffect(() => {
    handleHealthCheck();
  }, []);

  async function handleHealthCheck() {
    setHealthLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleBmiPredict() {
    setBmiLoading(true); setError(null);
    try {
      const result = await predictBMI({
        gender: bmiInputs.gender,
        height: parseFloat(bmiInputs.height),
        weight: parseFloat(bmiInputs.weight),
      });
      setBmiResult(result);
    } catch (e: any) {
      setError(`BMI: ${e.message}`);
    } finally { setBmiLoading(false); }
  }

  async function handleCaloriePredict() {
    setCalorieLoading(true); setError(null);
    try {
      const result = await predictCalories({
        gender: calorieInputs.gender,
        age: parseFloat(calorieInputs.age),
        height: parseFloat(calorieInputs.height),
        weight: parseFloat(calorieInputs.weight),
        duration: parseFloat(calorieInputs.duration),
        heart_rate: parseFloat(calorieInputs.heart_rate),
        body_temp: parseFloat(calorieInputs.body_temp),
      });
      setCalorieResult(result);
    } catch (e: any) {
      setError(`Calories: ${e.message}`);
    } finally { setCalorieLoading(false); }
  }

  async function handleWorkoutPredict() {
    setWorkoutLoading(true); setError(null);
    try {
      const result = await recommendWorkout({
        age: parseInt(workoutInputs.age),
        gender: workoutInputs.gender,
        weight: parseFloat(workoutInputs.weight),
        height: parseFloat(workoutInputs.height),
        fitness_goal: workoutInputs.fitness_goal,
        experience_level: workoutInputs.experience_level,
      });
      setWorkoutResult(result);
    } catch (e: any) {
      setError(`Workout: ${e.message}`);
    } finally { setWorkoutLoading(false); }
  }

  return (
    <div className="space-y-10 pb-20 relative">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <section className="relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="h-14 w-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <BrainCircuit size={28} />
          </div>
          <div className="h-px w-16 bg-white/10" />
          <Badge className="bg-purple-600/10 text-purple-400 border-purple-500/20 uppercase font-black italic tracking-[0.2em] text-[10px] px-5 py-1.5 rounded-full">
            ML Pipeline: {backendOnline ? 'Active' : backendOnline === false ? 'Offline' : 'Checking…'}
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.85] text-white"
        >
          Neural <br /> <span className="text-purple-400">Prediction Lab</span>
        </motion.h1>
        <p className="mt-6 text-white/40 font-medium max-w-xl text-lg leading-relaxed">
          Pre-trained ML models for BMI prediction, calorie burn estimation, and workout recommendations.
          Powered by scikit-learn + FastAPI.
        </p>
      </section>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
        >
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
        </motion.div>
      )}

      {/* Backend Status & Model Health */}
      <div className="grid gap-6 lg:grid-cols-2 relative z-10">
        <Card className="glass-card p-8 border-purple-500/20 bg-purple-500/5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            {backendOnline ? <Wifi size={120} /> : <WifiOff size={120} />}
          </div>
          <div className="flex items-center gap-3 mb-6">
            {backendOnline ? (
              <Wifi size={20} className="text-green-400" />
            ) : (
              <WifiOff size={20} className="text-red-400" />
            )}
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Backend Status</h3>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-sm font-bold text-white/60">FastAPI Server</span>
              <Badge className={cn(
                "text-[8px] font-black uppercase",
                backendOnline ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
              )}>
                {backendOnline ? 'ONLINE' : backendOnline === false ? 'OFFLINE' : 'CHECKING'}
              </Badge>
            </div>

            {health && (
              <>
                {Object.entries(health.models_loaded).map(([name, loaded]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", loaded ? "bg-green-500" : "bg-red-500")} />
                      <span className="text-sm font-bold text-white/60">{name}.pkl</span>
                    </div>
                    <Badge className={cn(
                      "text-[8px] font-black uppercase",
                      loaded ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {loaded ? 'LOADED' : 'FAILED'}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>

          <Button
            onClick={handleHealthCheck}
            disabled={healthLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-2xl h-12 text-sm shadow-xl"
          >
            {healthLoading ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Checking…</>
            ) : (
              <><Activity size={16} className="mr-2" /> Refresh Status</>
            )}
          </Button>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-400">
              <BarChart3 size={28} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Total Models</div>
              <div className="text-4xl font-black italic tracking-tighter">{health?.total_loaded ?? '—'}<span className="text-lg text-white/30 ml-1">/5</span></div>
            </div>
          </Card>
          <Card className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-green-600/10 flex items-center justify-center text-green-400">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Endpoints</div>
              <div className="text-lg font-black italic text-white/70 space-x-3">
                <span className="text-green-400">/predict-bmi</span>
                <span className="text-green-400">/predict-calories</span>
                <span className="text-green-400">/recommend-workout</span>
              </div>
            </div>
          </Card>
          <Card className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400">
              <Sparkles size={28} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Stack</div>
              <div className="text-sm font-bold text-white/60">FastAPI + scikit-learn + joblib</div>
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Quick Predict Cards                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3 relative z-10">

        {/* ────── BMI Predict ────── */}
        <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Scale size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Scale size={20} className="text-blue-400" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-blue-400">BMI Predict</h3>
          </div>
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBmiInputs({ ...bmiInputs, gender: 'Male' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  bmiInputs.gender === 'Male' ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-white/40")}
              >Male</button>
              <button
                onClick={() => setBmiInputs({ ...bmiInputs, gender: 'Female' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  bmiInputs.gender === 'Female' ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "bg-white/5 border-white/10 text-white/40")}
              >Female</button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Ruler size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={bmiInputs.height} onChange={e => setBmiInputs({ ...bmiInputs, height: e.target.value })}
                  placeholder="Height cm" className="w-full h-10 rounded-lg bg-black/40 border border-white/10 pl-8 pr-3 text-white font-bold text-sm focus:border-blue-500/40 focus:outline-none" />
              </div>
              <div className="flex-1 relative">
                <Scale size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={bmiInputs.weight} onChange={e => setBmiInputs({ ...bmiInputs, weight: e.target.value })}
                  placeholder="Weight kg" className="w-full h-10 rounded-lg bg-black/40 border border-white/10 pl-8 pr-3 text-white font-bold text-sm focus:border-blue-500/40 focus:outline-none" />
              </div>
            </div>
          </div>
          <Button onClick={handleBmiPredict} disabled={bmiLoading || !backendOnline}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic rounded-xl h-10 text-sm shadow-xl disabled:opacity-30">
            {bmiLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" /> Predict</>}
          </Button>

          {bmiResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-5 rounded-2xl bg-black/60 border border-blue-500/20 text-center space-y-2">
              <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">BMI Score</div>
              <div className="text-4xl font-black italic tracking-tighter">{bmiResult.bmi_value}</div>
              <Badge className={cn("text-[8px] font-black uppercase",
                bmiResult.category === 'Healthy' ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
              )}>{bmiResult.category}</Badge>
              <div className="text-[10px] text-white/30 italic">{bmiResult.risk}</div>
              {bmiResult.model_used && (
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px]">
                  <BrainCircuit size={8} className="mr-1" /> ML Model
                </Badge>
              )}
            </motion.div>
          )}
        </Card>

        {/* ────── Calorie Predict ────── */}
        <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Flame size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Flame size={20} className="text-orange-400" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-orange-400">Calorie Burn</h3>
          </div>
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCalorieInputs({ ...calorieInputs, gender: 'Male' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  calorieInputs.gender === 'Male' ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-white/5 border-white/10 text-white/40")}
              >Male</button>
              <button
                onClick={() => setCalorieInputs({ ...calorieInputs, gender: 'Female' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  calorieInputs.gender === 'Female' ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "bg-white/5 border-white/10 text-white/40")}
              >Female</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={calorieInputs.age} onChange={e => setCalorieInputs({ ...calorieInputs, age: e.target.value })}
                  placeholder="Age" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
              <div className="relative">
                <Scale size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={calorieInputs.weight} onChange={e => setCalorieInputs({ ...calorieInputs, weight: e.target.value })}
                  placeholder="kg" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
              <div className="relative">
                <Ruler size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={calorieInputs.height} onChange={e => setCalorieInputs({ ...calorieInputs, height: e.target.value })}
                  placeholder="cm" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={calorieInputs.duration} onChange={e => setCalorieInputs({ ...calorieInputs, duration: e.target.value })}
                  placeholder="min" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
              <div className="relative">
                <Heart size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={calorieInputs.heart_rate} onChange={e => setCalorieInputs({ ...calorieInputs, heart_rate: e.target.value })}
                  placeholder="bpm" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
              <div className="relative">
                <Thermometer size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" step="0.1" value={calorieInputs.body_temp} onChange={e => setCalorieInputs({ ...calorieInputs, body_temp: e.target.value })}
                  placeholder="°C" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
              </div>
            </div>
          </div>
          <Button onClick={handleCaloriePredict} disabled={calorieLoading || !backendOnline}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black uppercase italic rounded-xl h-10 text-sm shadow-xl disabled:opacity-30">
            {calorieLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" /> Predict</>}
          </Button>

          {calorieResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-5 rounded-2xl bg-black/60 border border-orange-500/20 text-center space-y-2">
              <div className="text-[8px] font-black text-orange-400 uppercase tracking-[0.3em]">Calories Burned</div>
              <div className="text-4xl font-black italic tracking-tighter">{calorieResult.calories_burned}<span className="text-lg text-white/30 ml-1">kcal</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[7px] font-black text-white/20 uppercase">Fat Burn</div>
                  <div className="text-sm font-black italic">{calorieResult.fat_burn_grams}g</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[7px] font-black text-white/20 uppercase">Intensity</div>
                  <div className="text-sm font-black italic text-orange-400">{calorieResult.intensity}</div>
                </div>
              </div>
              {calorieResult.model_used && (
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px]">
                  <BrainCircuit size={8} className="mr-1" /> ML Model
                </Badge>
              )}
            </motion.div>
          )}
        </Card>

        {/* ────── Workout Recommend ────── */}
        <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Dumbbell size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Dumbbell size={20} className="text-green-400" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-green-400">Workout</h3>
          </div>
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWorkoutInputs({ ...workoutInputs, gender: 'Male' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  workoutInputs.gender === 'Male' ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-white/5 border-white/10 text-white/40")}
              >Male</button>
              <button
                onClick={() => setWorkoutInputs({ ...workoutInputs, gender: 'Female' })}
                className={cn("h-9 rounded-lg text-xs font-black uppercase border transition-all",
                  workoutInputs.gender === 'Female' ? "bg-pink-500/20 border-pink-500/40 text-pink-400" : "bg-white/5 border-white/10 text-white/40")}
              >Female</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={workoutInputs.age} onChange={e => setWorkoutInputs({ ...workoutInputs, age: e.target.value })}
                  placeholder="Age" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-green-500/40 focus:outline-none" />
              </div>
              <div className="relative">
                <Scale size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="number" value={workoutInputs.weight} onChange={e => setWorkoutInputs({ ...workoutInputs, weight: e.target.value })}
                  placeholder="kg" className="w-full h-9 rounded-lg bg-black/40 border border-white/10 pl-8 pr-2 text-white font-bold text-xs focus:border-green-500/40 focus:outline-none" />
              </div>
            </div>
            <select value={workoutInputs.fitness_goal} onChange={e => setWorkoutInputs({ ...workoutInputs, fitness_goal: e.target.value })}
              className="w-full h-9 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:border-green-500/40 focus:outline-none appearance-none">
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="lean_bulk">Lean Bulk</option>
              <option value="maintenance">Maintenance</option>
              <option value="weight_gain">Weight Gain</option>
            </select>
            <select value={workoutInputs.experience_level} onChange={e => setWorkoutInputs({ ...workoutInputs, experience_level: e.target.value })}
              className="w-full h-9 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:border-green-500/40 focus:outline-none appearance-none">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <Button onClick={handleWorkoutPredict} disabled={workoutLoading || !backendOnline}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase italic rounded-xl h-10 text-sm shadow-xl disabled:opacity-30">
            {workoutLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" /> Recommend</>}
          </Button>

          {workoutResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-5 rounded-2xl bg-black/60 border border-green-500/20 space-y-3">
              <div className="text-center">
                <div className="text-[8px] font-black text-green-400 uppercase tracking-[0.3em]">Workout Type</div>
                <div className="text-xl font-black italic tracking-tighter">{workoutResult.workout_type}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <div className="text-[7px] font-black text-white/20 uppercase">Intensity</div>
                  <div className="text-xs font-black italic text-green-400">{workoutResult.intensity}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <div className="text-[7px] font-black text-white/20 uppercase">Exercises</div>
                  <div className="text-xs font-black italic">{workoutResult.exercises.length}</div>
                </div>
              </div>
              <div className="text-[10px] text-white/30 italic text-center">{workoutResult.recommendation}</div>
              {workoutResult.model_used && (
                <div className="text-center">
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px]">
                    <BrainCircuit size={8} className="mr-1" /> ML Model
                  </Badge>
                </div>
              )}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
