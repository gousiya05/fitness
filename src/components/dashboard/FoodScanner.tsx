import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, Apple, Zap, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface FoodScanResult {
  foodItems: Array<{
    name: string;
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    portion: string;
  }>;
  totalCalories: number;
  recommendation: string;
  isHealthy: boolean;
}

export default function FoodScanner() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Food <span className="text-primary">Scanner</span></h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Neural Nutrition Mapping</p>
        </div>
        {image && (
          <Button variant="ghost" size="sm" onClick={() => {setImage(null); setResult(null);}} className="text-white/40 hover:text-white">
            <X size={16} className="mr-2" /> Reset
          </Button>
        )}
      </div>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video glass-card border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all">
            <Camera size={32} />
          </div>
          <div className="text-center">
            <p className="font-black uppercase italic tracking-widest text-sm">Upload or Capture Food</p>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Supports JPG, PNG (Max 5MB)</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-square md:aspect-auto rounded-[2rem] overflow-hidden border border-white/10">
            <img src={image} alt="Food" className="w-full h-full object-cover" />
            {!result && !isScanning && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
                <Button onClick={scanFood} className="w-full h-16 bg-primary text-black font-black uppercase italic tracking-tighter text-lg rounded-[1.5rem] neon-glow">
                  Execute Analysis
                </Button>
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="font-black uppercase italic tracking-[0.3em] text-xs animate-pulse">Scanning Molecular Data...</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="glass-card p-6 border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${result.isHealthy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {result.isHealthy ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Protocol Recommendation</p>
                        <p className={`font-black uppercase italic text-sm ${result.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                          {result.isHealthy ? 'Approved for Intake' : 'Restricted Content'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Total Energy</p>
                      <p className="text-2xl font-black italic text-primary">{result.totalCalories} KCAL</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.foodItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="font-black uppercase text-[11px] italic">{item.name}</p>
                          <p className="text-[9px] text-white/30 uppercase font-black">{item.portion}</p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-[8px] text-white/20 uppercase font-black">Protein</p>
                            <p className="text-[10px] font-black text-primary">{item.protein}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-white/20 uppercase font-black">Calories</p>
                            <p className="text-[10px] font-black text-white">{item.calories}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-white/40">
                      <Zap size={14} className="text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest">AI Intelligence</p>
                    </div>
                    <p className="text-xs leading-relaxed text-white/80 italic font-medium italic">"{result.recommendation}"</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
