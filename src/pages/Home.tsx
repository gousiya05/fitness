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
  ChevronRight,
  Search,
  Activity,
  Scale,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Sandbox States
  const [activeTab, setActiveTab] = React.useState<'metabolic' | 'food' | 'workout'>('metabolic');
  
  // Metabolic Synthesis States
  const [weight, setWeight] = React.useState<number>(75);
  const [height, setHeight] = React.useState<number>(180);
  const [age, setAge] = React.useState<number>(25);
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [goal, setGoal] = React.useState<'cut' | 'maintain' | 'bulk'>('maintain');

  // Food Indexer States
  const [foodQuery, setFoodQuery] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<any>(null);

  // Workout Matrix States
  const [selectedMuscle, setSelectedMuscle] = React.useState<'chest' | 'legs' | 'back' | 'shoulders'>('chest');

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!(user && token));
  }, []);

  // Metabolic Logic
  const calculateBmr = () => {
    if (gender === 'male') {
      return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else {
      return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    }
  };

  const bmr = calculateBmr();
  const tdee = Math.round(bmr * 1.375); // moderate activity multiplier
  
  const getTargetCalories = () => {
    if (goal === 'cut') return tdee - 500;
    if (goal === 'bulk') return tdee + 300;
    return tdee;
  };
  const targetCalories = getTargetCalories();
  const targetProtein = Math.round(weight * 2.2); // 2.2g per kg
  const targetFat = Math.round((targetCalories * 0.25) / 9); // 25% of calories
  const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

  // Food Indexer Logic with Procedural AI Generation
  const handleFoodScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const normalizedQuery = foodQuery.toLowerCase().trim();
      
      // Preset database
      const database: Record<string, any> = {
        'chicken breast': { name: 'Grilled Chicken Breast', calories: 165, protein: '31g', carbs: '0g', fat: '3.6g', fiber: '0g', sugar: '0g', portion: '100g', grade: 'A+ Elite Fuel', color: 'text-emerald-400' },
        'avocado': { name: 'Ripe Avocado', calories: 160, protein: '2g', carbs: '9g', fat: '15g', fiber: '7g', sugar: '0.7g', portion: '100g', grade: 'A Healthy Fat', color: 'text-emerald-400' },
        'double cheeseburger': { name: 'Double Cheeseburger', calories: 535, protein: '30g', carbs: '40g', fat: '28g', fiber: '2g', sugar: '7g', portion: '1 item', grade: 'D+ Cheat Fuel', color: 'text-rose-400' },
        'salmon': { name: 'Atlantic Salmon Filet', calories: 208, protein: '22g', carbs: '0g', fat: '13g', fiber: '0g', sugar: '0g', portion: '100g', grade: 'A+ Clean Protein', color: 'text-emerald-400' },
        'egg': { name: 'Whole Boiled Egg', calories: 78, protein: '6.3g', carbs: '0.6g', fat: '5.3g', fiber: '0g', sugar: '0.6g', portion: '1 Large', grade: 'A Bio-available', color: 'text-emerald-400' },
        'banana': { name: 'Organic Banana', calories: 89, protein: '1.1g', carbs: '23g', fat: '0.3g', fiber: '2.6g', sugar: '12g', portion: '100g', grade: 'B+ Quick Glycogen', color: 'text-amber-400' },
        'whey protein': { name: 'Whey Protein Isolate', calories: 120, protein: '25g', carbs: '2g', fat: '1g', fiber: '0g', sugar: '1g', portion: '1 scoop (30g)', grade: 'A+ Optimized Anabolic', color: 'text-emerald-400' },
        'pizza': { name: 'Pepperoni Pizza Slice', calories: 290, protein: '12g', carbs: '32g', fat: '12g', fiber: '1.5g', sugar: '3g', portion: '1 slice (107g)', grade: 'C- High Sodium', color: 'text-rose-400' },
      };

      // Match preset or procedurally generate based on string hashing
      if (database[normalizedQuery]) {
        setScanResult(database[normalizedQuery]);
      } else {
        // Simple hash function for consistent procedural values
        let hash = 0;
        for (let i = 0; i < normalizedQuery.length; i++) {
          hash = normalizedQuery.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        const calories = (hash % 380) + 70;
        const proteinNum = (hash % 28) + 1;
        const fatNum = (hash % 20) + 1;
        const carbsNum = Math.abs(Math.round((calories - (proteinNum * 4) - (fatNum * 9)) / 4));
        const finalCarbs = Math.max(0, carbsNum);
        
        // Grade based on protein ratio
        const proteinRatio = (proteinNum * 4) / calories;
        let grade = 'B Standard Energy';
        let color = 'text-amber-400';
        if (proteinRatio > 0.4) {
          grade = 'A+ Muscle Rebuilding';
          color = 'text-emerald-400';
        } else if (fatNum > 15 && calories > 250) {
          grade = 'D- High Density Load';
          color = 'text-rose-400';
        } else if (proteinRatio > 0.25) {
          grade = 'A Balanced Resource';
          color = 'text-emerald-400';
        }

        setScanResult({
          name: foodQuery.charAt(0).toUpperCase() + foodQuery.slice(1),
          calories,
          protein: `${proteinNum}g`,
          carbs: `${finalCarbs}g`,
          fat: `${fatNum}g`,
          fiber: `${Math.round(hash % 5)}g`,
          sugar: `${Math.round(hash % 10)}g`,
          portion: '100g estimated',
          grade,
          color
        });
      }
      setIsScanning(false);
    }, 1200);
  };

  // Workout Database
  const workouts = {
    chest: [
      { name: 'Incline Dumbbell Press', sets: '4 Sets', reps: '8-10 Reps', intensity: 'Primary Hypertrophy', desc: 'Target upper clavicular fibers at a 30-degree incline to maximize shoulder-width chest structure.' },
      { name: 'Weighted Pectoral Dips', sets: '3 Sets', reps: '10-12 Reps', intensity: 'High Intensity', desc: 'Focus on maximum mechanical stretch at the bottom of the movement, overloading lower pectoral fibers.' },
      { name: 'Low-to-High Cable Flyes', sets: '3 Sets', reps: '15 Reps', intensity: 'Metabolic Burn', desc: 'Isolate the inner sternal pectoralis fibers by holding the peak contraction for 1.5 seconds.' },
    ],
    legs: [
      { name: 'Barbell Back Squats', sets: '4 Sets', reps: '6-8 Reps', intensity: 'Heavy Overload', desc: 'Full range biomechanical compound overload to activate maximal quad, glute, and spinal stability.' },
      { name: 'Romanian Deadlifts', sets: '3 Sets', reps: '10 Reps', intensity: 'Posterior Chain', desc: 'Isolate hamstrings and glutes through an active hip-hinge protocol, keeping spine fully locked.' },
      { name: 'Sissy Squat Machine', sets: '3 Sets', reps: '15-20 Reps', intensity: 'High Volume', desc: 'Deep knee-flexion isolation targeting rectus femoris directly without fatigue on the lower back.' },
    ],
    back: [
      { name: 'Weighted Wide Lat Pull-Ups', sets: '4 Sets', reps: '8 Reps', intensity: 'V-Taper Synergy', desc: 'Initiate pull using scapular depression, driving elbows towards back pockets to widen the lats.' },
      { name: 'Chest-Supported Row', sets: '3 Sets', reps: '8-10 Reps', intensity: 'Mid-Back Density', desc: 'Eliminate lower back fatigue to fully isolate mid-traps, rhomboids, and lower lat insertion points.' },
      { name: 'Neutral Grip Pullover', sets: '3 Sets', reps: '15 Reps', intensity: 'Constant Tension', desc: 'Keep arms fully locked to isolate latissimus stretch without initiating bicep contraction.' },
    ],
    shoulders: [
      { name: 'Standing Military Press', sets: '4 Sets', reps: '6-8 Reps', intensity: 'Alpha Compound', desc: 'Build foundational shoulder strength using absolute overhead extension with complete glute bracing.' },
      { name: 'Dynamic Lateral Cable Raises', sets: '4 Sets', reps: '15 Reps', intensity: 'Constant Tension', desc: 'Isolate the lateral deltoid head with continuous tension throughout the entire range of motion.' },
      { name: 'Reverse Pec Dec Flyes', sets: '3 Sets', reps: '15 Reps', intensity: 'Postural Balance', desc: 'Isolate rear deltoids to balance structural integrity and build full 3D roundness.' },
    ],
  };

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
              {isLoggedIn ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="h-20 px-12 bg-primary text-black hover:bg-white rounded-[2rem] font-black text-xl italic uppercase tracking-tighter shadow-2xl neon-glow transition-all active:scale-95 animate-pulse"
                >
                  Enter Command Center
                  <ArrowRight className="ml-2" size={24} />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  className="h-20 px-12 bg-primary text-black hover:bg-white rounded-[2rem] font-black text-xl italic uppercase tracking-tighter shadow-2xl neon-glow transition-all active:scale-95"
                >
                  Establish Neural Link
                  <ArrowRight className="ml-2" size={24} />
                </Button>
              )}
              <Button 
                onClick={() => {
                  const element = document.getElementById('sandbox');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className="h-20 px-12 glass border-white/10 hover:border-primary/20 rounded-[2rem] font-black text-xl italic uppercase tracking-tighter transition-all"
              >
                Access Neural Sandbox
                <Play className="ml-2 fill-current" size={20} />
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* NEW: Interactive Biological Sandbox */}
      <section id="sandbox" className="relative py-28 border-y border-white/5 bg-black/60 backdrop-blur-md z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 tracking-widest uppercase">Interactive Demo</Badge>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">Neural Engine <span className="text-primary text-neon">Sandbox</span></h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm mt-3 leading-relaxed">Try our core computational algorithms live in your browser before establishing your permanent neural link.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Tab Controls */}
            <div className="lg:col-span-4 flex lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0">
              <button 
                onClick={() => setActiveTab('metabolic')}
                className={`flex items-center gap-4 px-6 py-5 rounded-2xl border text-left font-bold transition-all whitespace-nowrap min-w-[200px] lg:min-w-0 ${activeTab === 'metabolic' ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(234,88,12,0.15)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
              >
                <Scale size={24} className={activeTab === 'metabolic' ? 'text-primary' : 'text-white/30'} />
                <div>
                  <div className="text-sm uppercase tracking-wider">Metabolic Calc</div>
                  <div className="text-[10px] opacity-40 font-normal uppercase tracking-widest mt-0.5">Biometrics Synthesis</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('food')}
                className={`flex items-center gap-4 px-6 py-5 rounded-2xl border text-left font-bold transition-all whitespace-nowrap min-w-[200px] lg:min-w-0 ${activeTab === 'food' ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(234,88,12,0.15)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
              >
                <Search size={24} className={activeTab === 'food' ? 'text-primary' : 'text-white/30'} />
                <div>
                  <div className="text-sm uppercase tracking-wider">Calorie Indexer</div>
                  <div className="text-[10px] opacity-40 font-normal uppercase tracking-widest mt-0.5">Molecular Estimation</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('workout')}
                className={`flex items-center gap-4 px-6 py-5 rounded-2xl border text-left font-bold transition-all whitespace-nowrap min-w-[200px] lg:min-w-0 ${activeTab === 'workout' ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(234,88,12,0.15)]' : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'}`}
              >
                <Dumbbell size={24} className={activeTab === 'workout' ? 'text-primary' : 'text-white/30'} />
                <div>
                  <div className="text-sm uppercase tracking-wider">Workout Matrix</div>
                  <div className="text-[10px] opacity-40 font-normal uppercase tracking-widest mt-0.5">Movement Synthesis</div>
                </div>
              </button>
            </div>

            {/* Sandbox View Panel */}
            <div className="lg:col-span-8 glass-card border border-white/5 p-8 rounded-3xl min-h-[460px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BrainCircuit size={180} />
              </div>

              {/* TAB 1: METABOLIC CALC */}
              {activeTab === 'metabolic' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Biological Hardware Input</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-widest text-[9px]">Live Engine</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Gender Selector */}
                      <div>
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-2">Biological Gender</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setGender('male')}
                            className={`flex-1 py-3 font-bold uppercase tracking-wider text-xs rounded-xl border transition-all ${gender === 'male' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                          >
                            Male
                          </button>
                          <button 
                            onClick={() => setGender('female')}
                            className={`flex-1 py-3 font-bold uppercase tracking-wider text-xs rounded-xl border transition-all ${gender === 'female' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                          >
                            Female
                          </button>
                        </div>
                      </div>

                      {/* Goal Selector */}
                      <div>
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-2">Evolution Goal</label>
                        <div className="flex gap-2">
                          {['cut', 'maintain', 'bulk'].map((g: any) => (
                            <button
                              key={g}
                              onClick={() => setGoal(g)}
                              className={`flex-1 py-3 font-bold uppercase tracking-wider text-xs rounded-xl border transition-all ${goal === g ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/5 text-white/40'}`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Metric Inputs */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Weight (kg)</span>
                          <input 
                            type="number" 
                            value={weight} 
                            onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                            className="bg-transparent font-black text-xl tracking-tight text-white focus:outline-none w-full"
                          />
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Height (cm)</span>
                          <input 
                            type="number" 
                            value={height} 
                            onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                            className="bg-transparent font-black text-xl tracking-tight text-white focus:outline-none w-full"
                          />
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Age</span>
                          <input 
                            type="number" 
                            value={age} 
                            onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                            className="bg-transparent font-black text-xl tracking-tight text-white focus:outline-none w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Results Display */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between shadow-[inset_0_0_30px_rgba(234,88,12,0.05)]">
                      <div>
                        <div className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Synthesized Target Caloric Intake</div>
                        <div className="text-5xl font-black italic tracking-tighter text-white">{targetCalories} <span className="text-xs uppercase text-primary tracking-wider">kcal/day</span></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 text-center">
                        <div>
                          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Protein</div>
                          <div className="text-lg font-black text-white">{targetProtein}g</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Carbs</div>
                          <div className="text-lg font-black text-white">{targetCarbs}g</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Fats</div>
                          <div className="text-lg font-black text-white">{targetFat}g</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Activity size={10} className="text-primary animate-pulse" /> BMR: {bmr} kcal</span>
                        <span>TDEE: {tdee} kcal</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CALORIE INDEXER */}
              {activeTab === 'food' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Molecular Food Indexer</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[9px]">Neural Preview</Badge>
                  </div>

                  <form onSubmit={handleFoodScan} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input 
                        type="text" 
                        value={foodQuery}
                        onChange={(e) => setFoodQuery(e.target.value)}
                        placeholder="Type food (e.g. Avocado, Double Cheeseburger, Egg...)"
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm font-semibold tracking-wide text-white focus:outline-none focus:border-primary/40 transition-all placeholder:text-white/20"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isScanning || !foodQuery.trim()}
                      className="bg-primary text-black hover:bg-white font-bold uppercase tracking-wider text-xs px-6 rounded-xl transition-all"
                    >
                      {isScanning ? 'Scanning...' : 'Analyze'}
                    </Button>
                  </form>

                  {/* Results Panel */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 min-h-[220px] flex flex-col justify-center items-center text-center">
                    {isScanning && (
                      <div className="space-y-3">
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">Deconstructive Molecular Verification In Progress...</p>
                      </div>
                    )}

                    {!isScanning && !scanResult && (
                      <div className="max-w-md">
                        <Activity className="mx-auto text-white/20 mb-3" size={32} />
                        <p className="text-xs font-semibold text-white/40 leading-relaxed">Type in any food to preview our Offline AI Database. Features immediate macro extraction and a proprietary Health Grade rating.</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {['Avocado', 'Egg', 'Double Cheeseburger', 'Whey Protein'].map((item) => (
                            <button
                              key={item}
                              onClick={() => { setFoodQuery(item); setTimeout(() => document.forms[0]?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50); }}
                              className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/50 px-3 py-1.5 rounded-full border border-white/5"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isScanning && scanResult && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-left space-y-4">
                        <div className="flex justify-between items-start border-b border-white/5 pb-3">
                          <div>
                            <span className="text-[9px] font-black uppercase text-primary tracking-widest block mb-0.5">Identified Signature</span>
                            <h4 className="text-xl font-black italic uppercase tracking-tight text-white">{scanResult.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-0.5">Index Grade</span>
                            <span className={`font-black text-sm uppercase tracking-wide ${scanResult.color}`}>{scanResult.grade}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Energy Output</span>
                            <span className="text-lg font-black text-white">{scanResult.calories} <span className="text-[9px] uppercase font-bold text-primary">kcal</span></span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Protein</span>
                            <span className="text-lg font-black text-white">{scanResult.protein}</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Carbohydrates</span>
                            <span className="text-lg font-black text-white">{scanResult.carbs}</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block mb-1">Lipids / Fat</span>
                            <span className="text-lg font-black text-white">{scanResult.fat}</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest pt-2">
                          <span>Fiber: {scanResult.fiber}</span>
                          <span>Sugar: {scanResult.sugar}</span>
                          <span>Portion Matrix: {scanResult.portion}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: WORKOUT MATRIX */}
              {activeTab === 'workout' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Biomechanical Workout Matrix</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[9px]">Neural Presets</Badge>
                  </div>

                  <div className="flex gap-2">
                    {(['chest', 'legs', 'back', 'shoulders'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMuscle(m)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${selectedMuscle === m ? 'border-primary bg-primary/5 text-primary shadow-[0_0_10px_rgba(234,88,12,0.1)]' : 'border-white/5 bg-white/5 text-white/40'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Exercises Container */}
                  <div className="space-y-3">
                    {workouts[selectedMuscle].map((ex, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-white/10 transition-all duration-300">
                        <div className="space-y-1 max-w-[70%]">
                          <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
                            <span className="h-4 w-4 bg-primary text-black rounded text-[9px] font-black italic flex items-center justify-center">0{idx + 1}</span>
                            {ex.name}
                          </h4>
                          <p className="text-[10px] text-white/30 leading-relaxed font-semibold">{ex.desc}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] uppercase tracking-wider px-2 py-0.5">{ex.intensity}</Badge>
                          <div className="text-[10px] font-black text-white/50 tracking-wider mt-1">{ex.sets} x {ex.reps}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Establish link prompt */}
              <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Ready for more customized biological parameters?</h4>
                  <p className="text-[10px] font-semibold text-white/30 mt-0.5">Gain absolute access to Live skeleton pose estimation, Diet synthesis engines, and progressive Analytics.</p>
                </div>
                {isLoggedIn ? (
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="h-10 px-5 bg-primary text-black hover:bg-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-1.5" size={14} />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="h-10 px-5 bg-primary text-black hover:bg-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap"
                  >
                    Link Neural Hardware
                    <ArrowRight className="ml-1.5" size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
