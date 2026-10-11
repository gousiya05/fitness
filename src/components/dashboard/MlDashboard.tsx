import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit, Zap, Target, Loader2, BarChart3, CheckCircle2,
  AlertCircle, Scale, Flame, Dumbbell, Heart, Activity, Wifi,
  WifiOff, Sparkles, Clock, User, Ruler, Thermometer, FlaskConical,
  Play, Database, ChevronDown, RefreshCw, Trash2, TrendingUp, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  checkHealth, predictBMI, predictCalories, recommendWorkout,
  type HealthResponse, type BMIPredictionResponse,
  type CaloriePredictionResponse, type WorkoutResponse,
} from '@/services/mlApiService';

const ML_API = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ─── helpers ───────────────────────────────────────────────────────────────
async function labFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${ML_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
    throw new Error(err.detail || JSON.stringify(err));
  }
  return r.json();
}

// ─── types ─────────────────────────────────────────────────────────────────
interface Dataset { id: string; name: string; task: string; samples: number; features: number }
interface Algorithm { id: string; name: string; hyperparams: string[] }
interface TrainResult {
  model_id: string; dataset: string; algorithm: string; task: string;
  metrics: Record<string, any>; train_samples: number; test_samples: number;
  training_time_s: number; feature_names: string[]; target_names: string[];
}
interface RegistryModel {
  id: string; dataset: string; algorithm: string; task: string;
  metrics: Record<string, any>; trained_at: string; training_time_s: number;
  feature_names: string[]; target_names: string[];
}
interface PredictResult {
  model_id: string; prediction: number; task: string;
  predicted_class?: string; probabilities?: Record<string, number>;
}

// ─── main component ────────────────────────────────────────────────────────
export default function MlDashboard() {
  // ── existing state ──
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [bmiInputs, setBmiInputs] = React.useState({ gender: 'Male', height: '175', weight: '75' });
  const [bmiResult, setBmiResult] = React.useState<BMIPredictionResponse | null>(null);
  const [bmiLoading, setBmiLoading] = React.useState(false);

  const [calorieInputs, setCalorieInputs] = React.useState({
    gender: 'Male', age: '25', height: '175', weight: '75',
    duration: '30', heart_rate: '145', body_temp: '37.0',
  });
  const [calorieResult, setCalorieResult] = React.useState<CaloriePredictionResponse | null>(null);
  const [calorieLoading, setCalorieLoading] = React.useState(false);

  const [workoutInputs, setWorkoutInputs] = React.useState({
    age: '25', gender: 'Male', weight: '75', height: '175',
    fitness_goal: 'muscle_gain', experience_level: 'intermediate',
  });
  const [workoutResult, setWorkoutResult] = React.useState<WorkoutResponse | null>(null);
  const [workoutLoading, setWorkoutLoading] = React.useState(false);

  // ── tab ──
  const [activeTab, setActiveTab] = React.useState<'predictions' | 'lab'>('predictions');

  // ── lab state ──
  const [datasets, setDatasets] = React.useState<Dataset[]>([]);
  const [algorithms, setAlgorithms] = React.useState<{ classification: Algorithm[]; regression: Algorithm[] }>({ classification: [], regression: [] });
  const [registry, setRegistry] = React.useState<RegistryModel[]>([]);
  const [labLoading, setLabLoading] = React.useState(false);

  const [selectedDataset, setSelectedDataset] = React.useState('iris');
  const [selectedAlgo, setSelectedAlgo] = React.useState('random_forest');
  const [testSize, setTestSize] = React.useState('0.2');
  const [scaleFeatures, setScaleFeatures] = React.useState(true);
  const [hyperparams, setHyperparams] = React.useState<Record<string, string>>({ n_estimators: '100', max_depth: '5' });

  const [trainResult, setTrainResult] = React.useState<TrainResult | null>(null);
  const [trainLoading, setTrainLoading] = React.useState(false);
  const [trainError, setTrainError] = React.useState<string | null>(null);

  // ── prediction panel ──
  const [selectedModelId, setSelectedModelId] = React.useState('');
  const [predictFeatures, setPredictFeatures] = React.useState('');
  const [predictResult, setPredictResult] = React.useState<PredictResult | null>(null);
  const [predictLoading, setPredictLoading] = React.useState(false);

  // ── init ──────────────────────────────────────────────────────────────────
  React.useEffect(() => { handleHealthCheck(); }, []);
  React.useEffect(() => {
    if (activeTab === 'lab' && datasets.length === 0) loadLabMeta();
  }, [activeTab]);

  async function handleHealthCheck() {
    setHealthLoading(true); setError(null);
    try {
      const data = await checkHealth();
      setHealth(data); setBackendOnline(true);
    } catch {
      setBackendOnline(false); setHealth(null);
    } finally { setHealthLoading(false); }
  }

  async function loadLabMeta() {
    setLabLoading(true);
    try {
      const [ds, algs, reg] = await Promise.all([
        labFetch<{ datasets: Dataset[] }>('/lab/datasets'),
        labFetch<{ classification: Algorithm[]; regression: Algorithm[] }>('/lab/algorithms'),
        labFetch<{ models: RegistryModel[] }>('/lab/models'),
      ]);
      setDatasets(ds.datasets);
      setAlgorithms(algs);
      setRegistry(reg.models);
    } catch (e: any) {
      setTrainError(`Lab meta: ${e.message}`);
    } finally { setLabLoading(false); }
  }

  // Existing prediction handlers
  async function handleBmiPredict() {
    setBmiLoading(true); setError(null);
    try {
      const result = await predictBMI({ gender: bmiInputs.gender, height: parseFloat(bmiInputs.height), weight: parseFloat(bmiInputs.weight) });
      setBmiResult(result);
    } catch (e: any) { setError(`BMI: ${e.message}`); }
    finally { setBmiLoading(false); }
  }

  async function handleCaloriePredict() {
    setCalorieLoading(true); setError(null);
    try {
      const result = await predictCalories({
        gender: calorieInputs.gender, age: parseFloat(calorieInputs.age),
        height: parseFloat(calorieInputs.height), weight: parseFloat(calorieInputs.weight),
        duration: parseFloat(calorieInputs.duration), heart_rate: parseFloat(calorieInputs.heart_rate),
        body_temp: parseFloat(calorieInputs.body_temp),
      });
      setCalorieResult(result);
    } catch (e: any) { setError(`Calories: ${e.message}`); }
    finally { setCalorieLoading(false); }
  }

  async function handleWorkoutPredict() {
    setWorkoutLoading(true); setError(null);
    try {
      const result = await recommendWorkout({
        age: parseInt(workoutInputs.age), gender: workoutInputs.gender,
        weight: parseFloat(workoutInputs.weight), height: parseFloat(workoutInputs.height),
        fitness_goal: workoutInputs.fitness_goal, experience_level: workoutInputs.experience_level,
      });
      setWorkoutResult(result);
    } catch (e: any) { setError(`Workout: ${e.message}`); }
    finally { setWorkoutLoading(false); }
  }

  // Lab handlers
  const currentTask = datasets.find(d => d.id === selectedDataset)?.task || 'classification';
  const currentAlgos = currentTask === 'classification' ? algorithms.classification : algorithms.regression;

  async function handleTrain() {
    setTrainLoading(true); setTrainError(null); setTrainResult(null);
    try {
      const hp: Record<string, any> = {};
      Object.entries(hyperparams).forEach(([k, v]) => { if (v !== '') hp[k] = isNaN(Number(v)) ? v : Number(v); });
      const result = await labFetch<TrainResult>('/lab/train', {
        method: 'POST',
        body: JSON.stringify({ dataset: selectedDataset, algorithm: selectedAlgo, test_size: parseFloat(testSize), scale_features: scaleFeatures, hyperparams: hp }),
      });
      setTrainResult(result);
      // Refresh registry
      const reg = await labFetch<{ models: RegistryModel[] }>('/lab/models');
      setRegistry(reg.models);
      setSelectedModelId(result.model_id);
    } catch (e: any) { setTrainError(e.message); }
    finally { setTrainLoading(false); }
  }

  async function handlePredict() {
    if (!selectedModelId) return;
    setPredictLoading(true); setPredictResult(null);
    try {
      const model = registry.find(m => m.id === selectedModelId);
      const features = predictFeatures.split(',').map(v => parseFloat(v.trim()));
      if (model && features.length !== model.feature_names.length) {
        throw new Error(`Expected ${model.feature_names.length} features, got ${features.length}`);
      }
      const result = await labFetch<PredictResult>('/lab/predict', { method: 'POST', body: JSON.stringify({ model_id: selectedModelId, features }) });
      setPredictResult(result);
    } catch (e: any) { setTrainError(e.message); }
    finally { setPredictLoading(false); }
  }

  async function handleDeleteModel(id: string) {
    await labFetch(`/lab/model/${id}`, { method: 'DELETE' });
    setRegistry(r => r.filter(m => m.id !== id));
    if (selectedModelId === id) setSelectedModelId('');
  }

  function MetricBadge({ label, value, color = 'purple' }: { label: string; value: any; color?: string }) {
    if (value == null) return null;
    const disp = typeof value === 'number' ? (value < 10 ? (value * 100).toFixed(2) + '%' : value.toFixed(3)) : String(value);
    return (
      <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
        <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</div>
        <div className={`text-lg font-black italic text-${color}-400`}>{disp}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <section className="relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <BrainCircuit size={28} />
          </div>
          <div className="h-px w-16 bg-white/10" />
          <Badge className="bg-purple-600/10 text-purple-400 border-purple-500/20 uppercase font-black italic tracking-[0.2em] text-[10px] px-5 py-1.5 rounded-full">
            ML Pipeline: {backendOnline ? 'Active' : backendOnline === false ? 'Offline' : 'Checking…'}
          </Badge>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.85] text-white">
          Neural <br /><span className="text-purple-400">Prediction Lab</span>
        </motion.h1>
        <p className="mt-4 text-white/40 font-medium max-w-xl text-lg leading-relaxed">
          Pre-trained pkl models + full sklearn Algorithm Lab. Real datasets, real metrics.
        </p>
      </section>

      {/* Error Banner */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={20} />
          <span className="text-sm font-bold flex-1">{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 relative z-10">
        {(['predictions', 'lab'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-6 py-3 rounded-2xl font-black uppercase italic tracking-widest text-sm border transition-all',
              activeTab === tab
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10')}>
            {tab === 'predictions' ? '🔮 ML Predictions' : '🧪 Algorithm Lab'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'predictions' && (
          <motion.div key="predictions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Status row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card p-8 border-purple-500/20 bg-purple-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  {backendOnline ? <Wifi size={120} /> : <WifiOff size={120} />}
                </div>
                <div className="flex items-center gap-3 mb-6">
                  {backendOnline ? <Wifi size={20} className="text-green-400" /> : <WifiOff size={20} className="text-red-400" />}
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Backend Status</h3>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-bold text-white/60">FastAPI Server</span>
                    <Badge className={cn('text-[8px] font-black uppercase', backendOnline ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                      {backendOnline ? 'ONLINE' : backendOnline === false ? 'OFFLINE' : 'CHECKING'}
                    </Badge>
                  </div>
                  {health && Object.entries(health.models_loaded).map(([name, loaded]) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', loaded ? 'bg-green-500' : 'bg-red-500')} />
                        <span className="text-sm font-bold text-white/60">{name}.pkl</span>
                      </div>
                      <Badge className={cn('text-[8px] font-black uppercase', loaded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                        {loaded ? 'LOADED' : 'FAILED'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button onClick={handleHealthCheck} disabled={healthLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-2xl h-12 text-sm">
                  {healthLoading ? <><Loader2 className="animate-spin mr-2" size={16} />Checking…</> : <><Activity size={16} className="mr-2" />Refresh Status</>}
                </Button>
              </Card>

              <div className="space-y-4">
                {[
                  { icon: BarChart3, color: 'purple', label: 'Total Models', val: `${health?.total_loaded ?? '—'}/5` },
                  { icon: CheckCircle2, color: 'green', label: 'Active Endpoints', val: '/predict-bmi  /predict-calories  /recommend-workout' },
                  { icon: Sparkles, color: 'blue', label: 'Stack', val: 'FastAPI + scikit-learn + XGBoost + joblib' },
                ].map(({ icon: Icon, color, label, val }) => (
                  <Card key={label} className="glass-card p-6 border-white/5 flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-2xl bg-${color}-600/10 flex items-center justify-center text-${color}-400`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">{label}</div>
                      <div className="text-sm font-black italic text-white/70">{val}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3 prediction cards */}
            <div className="grid gap-6 lg:grid-cols-3">

              {/* BMI */}
              <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={120} /></div>
                <div className="flex items-center gap-3 mb-6">
                  <Scale size={20} className="text-blue-400" />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-blue-400">BMI Predict</h3>
                  <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px]">RandomForest</Badge>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    {['Male', 'Female'].map(g => (
                      <button key={g} onClick={() => setBmiInputs({ ...bmiInputs, gender: g })}
                        className={cn('h-9 rounded-lg text-xs font-black uppercase border transition-all',
                          bmiInputs.gender === g ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/40')}>
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[['height', 'Height cm'], ['weight', 'Weight kg']].map(([key, ph]) => (
                      <input key={key} type="number" value={(bmiInputs as any)[key]}
                        onChange={e => setBmiInputs({ ...bmiInputs, [key]: e.target.value })}
                        placeholder={ph}
                        className="flex-1 h-10 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-sm focus:border-blue-500/40 focus:outline-none" />
                    ))}
                  </div>
                </div>
                <Button onClick={handleBmiPredict} disabled={bmiLoading || !backendOnline}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic rounded-xl h-10 text-sm disabled:opacity-30">
                  {bmiLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" />Predict BMI</>}
                </Button>
                {!backendOnline && <p className="text-[10px] text-red-400/60 text-center mt-2">Start FastAPI on port 8000</p>}
                {bmiResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-5 rounded-2xl bg-black/60 border border-blue-500/20 text-center space-y-2">
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">BMI Score</div>
                    <div className="text-4xl font-black italic tracking-tighter">{bmiResult.bmi_value}</div>
                    <Badge className={cn('text-[8px] font-black uppercase', bmiResult.category === 'Healthy' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400')}>
                      {bmiResult.category}
                    </Badge>
                    <div className="text-[10px] text-white/30 italic">{bmiResult.risk}</div>
                    {bmiResult.model_used && <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px]"><BrainCircuit size={8} className="mr-1" />ML Model</Badge>}
                  </motion.div>
                )}
              </Card>

              {/* Calorie */}
              <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Flame size={120} /></div>
                <div className="flex items-center gap-3 mb-6">
                  <Flame size={20} className="text-orange-400" />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-orange-400">Calorie Burn</h3>
                  <Badge className="ml-auto bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px]">XGBoost</Badge>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    {['Male', 'Female'].map(g => (
                      <button key={g} onClick={() => setCalorieInputs({ ...calorieInputs, gender: g })}
                        className={cn('h-9 rounded-lg text-xs font-black uppercase border transition-all',
                          calorieInputs.gender === g ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/10 text-white/40')}>
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['age', 'Age'], ['weight', 'kg'], ['height', 'cm']].map(([k, ph]) => (
                      <input key={k} type="number" value={(calorieInputs as any)[k]}
                        onChange={e => setCalorieInputs({ ...calorieInputs, [k]: e.target.value })}
                        placeholder={ph}
                        className="h-9 rounded-lg bg-black/40 border border-white/10 px-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['duration', 'min'], ['heart_rate', 'bpm'], ['body_temp', '°C']].map(([k, ph]) => (
                      <input key={k} type="number" step="0.1" value={(calorieInputs as any)[k]}
                        onChange={e => setCalorieInputs({ ...calorieInputs, [k]: e.target.value })}
                        placeholder={ph}
                        className="h-9 rounded-lg bg-black/40 border border-white/10 px-2 text-white font-bold text-xs focus:border-orange-500/40 focus:outline-none" />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCaloriePredict} disabled={calorieLoading || !backendOnline}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black uppercase italic rounded-xl h-10 text-sm disabled:opacity-30">
                  {calorieLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" />Predict</>}
                </Button>
                {calorieResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-5 rounded-2xl bg-black/60 border border-orange-500/20 text-center space-y-2">
                    <div className="text-[8px] font-black text-orange-400 uppercase tracking-[0.3em]">Calories Burned</div>
                    <div className="text-4xl font-black italic tracking-tighter">{calorieResult.calories_burned}<span className="text-lg text-white/30 ml-1">kcal</span></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-white/5"><div className="text-[7px] text-white/20 uppercase">Fat Burn</div><div className="text-sm font-black italic">{calorieResult.fat_burn_grams}g</div></div>
                      <div className="p-2 rounded-lg bg-white/5"><div className="text-[7px] text-white/20 uppercase">Zone</div><div className="text-sm font-black italic text-orange-400">{calorieResult.intensity}</div></div>
                    </div>
                    {calorieResult.model_used && <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px]"><BrainCircuit size={8} className="mr-1" />ML Model</Badge>}
                  </motion.div>
                )}
              </Card>

              {/* Workout */}
              <Card className="glass-card p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Dumbbell size={120} /></div>
                <div className="flex items-center gap-3 mb-6">
                  <Dumbbell size={20} className="text-green-400" />
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-green-400">Workout</h3>
                  <Badge className="ml-auto bg-green-500/10 text-green-400 border-green-500/20 text-[8px]">DataFrame</Badge>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    {['Male', 'Female'].map(g => (
                      <button key={g} onClick={() => setWorkoutInputs({ ...workoutInputs, gender: g })}
                        className={cn('h-9 rounded-lg text-xs font-black uppercase border transition-all',
                          workoutInputs.gender === g ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/40')}>
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['age', 'Age'], ['weight', 'kg']].map(([k, ph]) => (
                      <input key={k} type="number" value={(workoutInputs as any)[k]}
                        onChange={e => setWorkoutInputs({ ...workoutInputs, [k]: e.target.value })}
                        placeholder={ph}
                        className="h-9 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:border-green-500/40 focus:outline-none" />
                    ))}
                  </div>
                  <select value={workoutInputs.fitness_goal} onChange={e => setWorkoutInputs({ ...workoutInputs, fitness_goal: e.target.value })}
                    className="w-full h-9 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:outline-none">
                    {['weight_loss', 'muscle_gain', 'lean_bulk', 'maintenance', 'weight_gain'].map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                  </select>
                  <select value={workoutInputs.experience_level} onChange={e => setWorkoutInputs({ ...workoutInputs, experience_level: e.target.value })}
                    className="w-full h-9 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:outline-none">
                    {['beginner', 'intermediate', 'advanced'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <Button onClick={handleWorkoutPredict} disabled={workoutLoading || !backendOnline}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase italic rounded-xl h-10 text-sm disabled:opacity-30">
                  {workoutLoading ? <Loader2 className="animate-spin" size={16} /> : <><Target size={14} className="mr-2" />Recommend</>}
                </Button>
                {workoutResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-5 rounded-2xl bg-black/60 border border-green-500/20 space-y-3">
                    <div className="text-center">
                      <div className="text-[8px] font-black text-green-400 uppercase tracking-[0.3em]">Workout Type</div>
                      <div className="text-xl font-black italic tracking-tighter">{workoutResult.workout_type}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-white/5 text-center"><div className="text-[7px] text-white/20 uppercase">Intensity</div><div className="text-xs font-black italic text-green-400">{workoutResult.intensity}</div></div>
                      <div className="p-2 rounded-lg bg-white/5 text-center"><div className="text-[7px] text-white/20 uppercase">Exercises</div><div className="text-xs font-black italic">{Array.isArray(workoutResult.exercises) ? workoutResult.exercises.length : workoutResult.exercises}</div></div>
                    </div>
                    <div className="text-[10px] text-white/30 italic text-center line-clamp-3">{workoutResult.recommendation}</div>
                  </motion.div>
                )}
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'lab' && (
          <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Offline notice */}
            {backendOnline === false && (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                <WifiOff size={24} className="text-red-400 shrink-0" />
                <div>
                  <div className="font-black text-red-400 uppercase italic">ML Backend Offline</div>
                  <div className="text-sm text-white/40">Start the FastAPI server: <code className="text-white/60">cd backend && python -m uvicorn main:app --port 8000</code></div>
                </div>
                <Button onClick={handleHealthCheck} variant="outline" className="ml-auto border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl"><RefreshCw size={14} className="mr-2" />Retry</Button>
              </div>
            )}

            {labLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Loader2 size={20} className="animate-spin text-purple-400" />
                <span className="text-sm font-bold text-white/60">Loading datasets & algorithms…</span>
              </div>
            )}

            {trainError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={18} />
                <span className="text-sm font-bold flex-1">{trainError}</span>
                <button onClick={() => setTrainError(null)}><X size={14} /></button>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* ── Config Panel ── */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="glass-card p-6 border-white/5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Database size={18} className="text-purple-400" />
                    <h3 className="font-black italic uppercase tracking-tighter text-purple-400">Configure</h3>
                  </div>

                  {/* Dataset */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Dataset</label>
                    <select value={selectedDataset} onChange={e => { setSelectedDataset(e.target.value); setSelectedAlgo(e.target.value.includes('regress') || e.target.value === 'california_housing' ? 'random_forest' : 'random_forest'); }}
                      className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-bold text-sm focus:border-purple-500/40 focus:outline-none">
                      {datasets.length > 0 ? datasets.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.task}) — {d.samples} rows</option>
                      )) : (
                        <>
                          <option value="iris">Iris (classification) — 150 rows</option>
                          <option value="breast_cancer">Breast Cancer (classification) — 569 rows</option>
                          <option value="wine">Wine (classification) — 178 rows</option>
                          <option value="california_housing">California Housing (regression) — 20640 rows</option>
                          <option value="synthetic_classification">Synthetic Classification — 1000 rows</option>
                          <option value="synthetic_regression">Synthetic Regression — 1000 rows</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Algorithm */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Algorithm ({currentTask})</label>
                    <select value={selectedAlgo} onChange={e => setSelectedAlgo(e.target.value)}
                      className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-bold text-sm focus:border-purple-500/40 focus:outline-none">
                      {currentAlgos.length > 0 ? currentAlgos.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      )) : (
                        currentTask === 'classification' ? (
                          <>
                            <option value="logistic_regression">Logistic Regression</option>
                            <option value="decision_tree">Decision Tree</option>
                            <option value="random_forest">Random Forest</option>
                            <option value="knn">K-Nearest Neighbors</option>
                            <option value="svm">Support Vector Machine</option>
                            <option value="naive_bayes">Gaussian Naive Bayes</option>
                            <option value="gradient_boosting">Gradient Boosting</option>
                          </>
                        ) : (
                          <>
                            <option value="linear_regression">Linear Regression</option>
                            <option value="ridge">Ridge Regression</option>
                            <option value="decision_tree">Decision Tree Regressor</option>
                            <option value="random_forest">Random Forest Regressor</option>
                            <option value="gradient_boosting">Gradient Boosting</option>
                          </>
                        )
                      )}
                    </select>
                  </div>

                  {/* Hyperparams */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Hyperparameters</label>
                    <div className="space-y-2">
                      {['n_estimators', 'max_depth', 'n_neighbors', 'C', 'alpha', 'learning_rate'].map(key => {
                        const algoObj = currentAlgos.find(a => a.id === selectedAlgo);
                        const show = !algoObj || algoObj.hyperparams.includes(key);
                        if (!show) return null;
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-white/30 w-32 uppercase">{key}</label>
                            <input type="text" value={hyperparams[key] ?? ''} onChange={e => setHyperparams(h => ({ ...h, [key]: e.target.value }))}
                              placeholder={key === 'n_estimators' ? '100' : key === 'max_depth' ? '5' : key === 'C' ? '1.0' : '0.1'}
                              className="flex-1 h-8 rounded-lg bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:border-purple-500/40 focus:outline-none" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Split */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Test Split</label>
                      <select value={testSize} onChange={e => setTestSize(e.target.value)}
                        className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-bold text-sm focus:outline-none">
                        {['0.10', '0.15', '0.20', '0.25', '0.30'].map(v => <option key={v} value={v}>{(parseFloat(v) * 100).toFixed(0)}% test</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Scale Features</label>
                      <button onClick={() => setScaleFeatures(s => !s)}
                        className={cn('w-full h-10 rounded-xl border font-black uppercase text-xs transition-all',
                          scaleFeatures ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/10 text-white/30')}>
                        {scaleFeatures ? 'StandardScaler ✓' : 'Raw Features'}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handleTrain} disabled={trainLoading || backendOnline === false}
                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-2xl text-sm shadow-xl disabled:opacity-30">
                    {trainLoading ? <><Loader2 className="animate-spin mr-2" size={16} />Training…</> : <><Play size={16} className="mr-2" />Train Model</>}
                  </Button>
                </Card>
              </div>

              {/* ── Results Panel ── */}
              <div className="lg:col-span-2 space-y-4">
                {trainLoading && (
                  <Card className="glass-card p-10 border-purple-500/20 flex flex-col items-center gap-4">
                    <Loader2 size={40} className="animate-spin text-purple-400" />
                    <div className="text-white/60 font-black uppercase italic tracking-widest text-sm">Training on real data…</div>
                  </Card>
                )}

                {trainResult && !trainLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="glass-card p-6 border-purple-500/20 bg-purple-500/5 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-400 mb-1">Training Complete ✓</div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter">{trainResult.algorithm.replace(/_/g, ' ')}</h3>
                          <div className="text-sm text-white/40">{trainResult.dataset} · {trainResult.task} · {trainResult.train_samples} train / {trainResult.test_samples} test · {trainResult.training_time_s}s</div>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-black text-xs uppercase">ID: {trainResult.model_id}</Badge>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {trainResult.task === 'classification' ? (
                          <>
                            <MetricBadge label="Accuracy" value={trainResult.metrics.accuracy} color="green" />
                            <MetricBadge label="Precision" value={trainResult.metrics.precision} color="blue" />
                            <MetricBadge label="Recall" value={trainResult.metrics.recall} color="orange" />
                            <MetricBadge label="F1 Score" value={trainResult.metrics.f1_score} color="purple" />
                            {trainResult.metrics.roc_auc != null && <MetricBadge label="ROC-AUC" value={trainResult.metrics.roc_auc} color="pink" />}
                          </>
                        ) : (
                          <>
                            <MetricBadge label="MAE" value={trainResult.metrics.mae} color="green" />
                            <MetricBadge label="MSE" value={trainResult.metrics.mse} color="orange" />
                            <MetricBadge label="RMSE" value={trainResult.metrics.rmse} color="red" />
                            <MetricBadge label="R²" value={trainResult.metrics.r2} color="purple" />
                          </>
                        )}
                      </div>

                      {/* Confusion Matrix */}
                      {trainResult.metrics.confusion_matrix && (
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Confusion Matrix</div>
                          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${trainResult.metrics.confusion_matrix[0].length}, 1fr)` }}>
                            {trainResult.metrics.confusion_matrix.flat().map((val: number, i: number) => (
                              <div key={i} className="w-14 h-14 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 font-black text-lg text-purple-300">
                                {val}
                              </div>
                            ))}
                          </div>
                          <div className="text-[9px] text-white/20 mt-2">Rows = actual classes, Cols = predicted classes</div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}

                {/* Predict with model */}
                {registry.length > 0 && (
                  <Card className="glass-card p-6 border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Zap size={18} className="text-yellow-400" />
                      <h3 className="font-black italic uppercase tracking-tighter text-yellow-400">Interactive Prediction</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Select Trained Model</label>
                        <select value={selectedModelId} onChange={e => { setSelectedModelId(e.target.value); setPredictFeatures(''); setPredictResult(null); }}
                          className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:outline-none">
                          <option value="">— choose model —</option>
                          {registry.map(m => (
                            <option key={m.id} value={m.id}>{m.id} | {m.algorithm.replace(/_/g, ' ')} on {m.dataset}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">
                          Feature Values (comma-separated)
                          {selectedModelId && registry.find(m => m.id === selectedModelId) && (
                            <span className="ml-2 text-purple-400">({registry.find(m => m.id === selectedModelId)?.feature_names.length} features)</span>
                          )}
                        </label>
                        <input value={predictFeatures} onChange={e => setPredictFeatures(e.target.value)}
                          placeholder="e.g. 5.1, 3.5, 1.4, 0.2"
                          className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-3 text-white font-bold text-xs focus:border-yellow-500/40 focus:outline-none" />
                      </div>
                    </div>
                    {selectedModelId && registry.find(m => m.id === selectedModelId) && (
                      <div className="text-[9px] text-white/20 font-mono">
                        Features: {registry.find(m => m.id === selectedModelId)?.feature_names.join(', ')}
                      </div>
                    )}
                    <Button onClick={handlePredict} disabled={predictLoading || !selectedModelId || !predictFeatures}
                      className="h-12 px-8 bg-yellow-600 hover:bg-yellow-500 text-black font-black uppercase italic rounded-xl text-sm disabled:opacity-30">
                      {predictLoading ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={14} className="mr-2" />Predict</>}
                    </Button>
                    {predictResult && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl bg-black/60 border border-yellow-500/20 space-y-3">
                        <div className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.3em]">Prediction Result</div>
                        <div className="text-3xl font-black italic tracking-tighter">
                          {predictResult.predicted_class ?? predictResult.prediction.toFixed(4)}
                        </div>
                        {predictResult.probabilities && (
                          <div className="space-y-2">
                            <div className="text-[9px] text-white/30 uppercase font-black">Class Probabilities</div>
                            {Object.entries(predictResult.probabilities).map(([cls, prob]) => (
                              <div key={cls} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-white/60 w-28 truncate">{cls}</span>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(Number(prob) * 100).toFixed(1)}%` }} />
                                </div>
                                <span className="text-xs font-black text-yellow-400 w-12 text-right">{(Number(prob) * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </Card>
                )}

                {/* Model Registry */}
                {registry.length > 0 && (
                  <Card className="glass-card p-6 border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp size={18} className="text-green-400" />
                        <h3 className="font-black italic uppercase tracking-tighter text-green-400">Model Registry</h3>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[8px]">{registry.length} models</Badge>
                    </div>
                    <div className="space-y-3">
                      {registry.map(m => (
                        <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-[8px] text-purple-400 font-mono">{m.id}</code>
                              <Badge className="text-[7px] bg-white/5 border-white/10 uppercase">{m.task}</Badge>
                            </div>
                            <div className="font-black text-sm uppercase italic truncate">{m.algorithm.replace(/_/g, ' ')}</div>
                            <div className="text-[9px] text-white/30">{m.dataset} · {m.training_time_s}s</div>
                          </div>
                          <div className="text-right">
                            {m.task === 'classification' ? (
                              <div className="text-lg font-black text-green-400">{((m.metrics.accuracy || 0) * 100).toFixed(1)}%</div>
                            ) : (
                              <div className="text-lg font-black text-blue-400">R²={m.metrics.r2?.toFixed(3)}</div>
                            )}
                            <div className="text-[8px] text-white/20">{m.task === 'classification' ? 'accuracy' : 'r-squared'}</div>
                          </div>
                          <button onClick={() => handleDeleteModel(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {!trainResult && !trainLoading && registry.length === 0 && (
                  <Card className="glass-card p-12 border-white/5 flex flex-col items-center gap-4 text-center">
                    <FlaskConical size={48} className="text-purple-400/30" />
                    <div className="font-black italic uppercase tracking-widest text-white/20">Configure and train a model to see results</div>
                    <div className="text-sm text-white/20">Choose a dataset, algorithm, and hyperparameters on the left, then click Train Model.</div>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
