import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, Apple, Zap, AlertCircle, CheckCircle2, X, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FoodScanResult {
  foodItems: Array<{
    name: string;
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    sugar: string;
    portion: string;
  }>;
  totalCalories: number;
  recommendation: string;
  isHealthy: boolean;
}

export default function PoseDetector() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<FoodScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const scanFood = async () => {
    if (!image) return;
    setIsScanning(true);
    
    try {
      const blob = await (await fetch(image)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'food.jpg');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/food/scan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setResult(data);
      toast.success("Analysis Complete");
    } catch (error) {
      toast.error("Failed to analyze food. Try a clearer image.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black">
                <Apple size={20} />
             </div>
             <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black italic tracking-widest text-[8px] px-3">
                Neural Scan Protocol v2.0
             </Badge>
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">AI Food <span className="text-primary">Scanner</span></h1>
          <p className="text-white/40 font-medium max-w-md mt-2">Upload or capture food images for deep molecular analysis and nutritional breakdown.</p>
        </div>
        
        {image && (
          <Button variant="outline" onClick={() => {setImage(null); setResult(null);}} className="h-14 rounded-2xl border-white/5 bg-white/5 font-black uppercase italic tracking-widest text-[10px]">
            <X size={16} className="mr-2" /> Reset Scanner
          </Button>
        )}
      </div>

      {!image ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="md:col-span-2 aspect-video glass-card border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all shadow-2xl relative z-10">
                <Camera size={48} />
              </div>
              <div className="text-center relative z-10">
                <p className="text-2xl font-black uppercase italic tracking-tighter">Initiate Visual Capture</p>
                <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em] mt-2">TAP TO ACCESS CAMERA OR GALLERY</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
           </div>

           <Card className="glass-card p-10 bg-primary/5 border-primary/20 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <History size={24} />
                 </div>
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter">Scan History</h3>
                 <p className="text-sm text-white/40 leading-relaxed">Neural logs of your previous 24h consumption are being synchronized...</p>
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5">
                 <p className="text-[10px] font-black uppercase text-white/20 mb-2">LAST RECORD</p>
                 <p className="text-xs font-black italic uppercase">Waiting for first scan...</p>
              </div>
           </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 glass-card">
            <img src={image} alt="Food" className="w-full h-full object-cover" />
            
            <AnimatePresence>
              {!result && !isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="p-8 rounded-[3rem] bg-black/40 backdrop-blur-xl border border-white/10 space-y-6 max-w-sm">
                    <div className="h-16 w-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-black shadow-2xl neon-glow">
                       <Zap size={32} />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Visual Confirmed</h3>
                    <p className="text-white/40 text-sm font-medium">Ready to perform deep molecular analysis for nutritional indexing.</p>
                    <Button onClick={scanFood} className="w-full h-16 bg-primary text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl shadow-2xl neon-glow">
                      Start Analysis
                    </Button>
                  </div>
                </motion.div>
              )}

              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse" />
                    <Loader2 size={80} className="text-primary animate-spin relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black uppercase italic tracking-wider text-primary animate-pulse">Scanning Molecular Data</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mt-2">ACCESSING NEURAL NUTRITION DB...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="glass-card p-10 border-white/5 space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
                   
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                         <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${result.isHealthy ? 'bg-green-500/20 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,44,44,0.2)]'}`}>
                            {result.isHealthy ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Neural Recommendation</p>
                            <p className={`text-2xl font-black uppercase italic tracking-tight ${result.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                               {result.isHealthy ? 'PROTOCOL_APPROVED' : 'LIMIT_CONSUMPTION'}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Energy Index</p>
                         <p className="text-5xl font-black italic text-primary drop-shadow-[0_0_10px_rgba(234,88,12,0.4)]">{result.totalCalories}<span className="text-xs ml-1">KCAL</span></p>
                      </div>
                   </div>

                   <div className="grid gap-3 relative z-10">
                      {result.foodItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                           <div>
                              <p className="text-lg font-black uppercase italic tracking-tight text-white/90">{item.name}</p>
                              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{item.portion}</p>
                           </div>
                           <div className="flex gap-6 text-right">
                              <div>
                                 <p className="text-[8px] text-white/20 uppercase font-black">Protein</p>
                                 <p className="text-sm font-black italic text-primary">{item.protein}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] text-white/20 uppercase font-black">Energy</p>
                                 <p className="text-sm font-black italic text-white">{item.calories} cal</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-3 relative z-10">
                      <div className="flex items-center gap-2 text-primary">
                         <TrendingUp size={18} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Metabolic Impact Analysis</span>
                      </div>
                      <p className="text-sm leading-relaxed text-white/80 font-medium italic tracking-tight">"{result.recommendation}"</p>
                   </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
