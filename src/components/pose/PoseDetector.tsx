import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, Apple, Zap, AlertCircle, CheckCircle2, X, History, TrendingUp, Scan, CameraOff } from 'lucide-react';
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
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isLive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Failed to access camera");
      setIsLive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        setIsLive(false);
        setResult(null);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      
      const data = await response.json();
      setResult(data);
      toast.success("Neural Analysis Complete");
    } catch (error: any) {
      console.error("Scan Error:", error);
      toast.error(`Analysis Failed: ${error.message || 'Ensure image clarity'}`);
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
             <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-xl neon-glow">
                <Scan size={20} />
             </div>
             <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black italic tracking-widest text-[8px] px-3">
                Neural Lens Activated
             </Badge>
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">AI Neural <span className="text-primary">Lens</span></h1>
          <p className="text-white/40 font-medium max-w-md mt-2">Point your device at food for real-time molecular indexing and nutritional verification.</p>
        </div>
        
        {(image || isLive) && (
          <Button variant="outline" onClick={() => {setImage(null); setResult(null); setIsLive(false);}} className="h-14 rounded-2xl border-white/5 bg-white/5 font-black uppercase italic tracking-widest text-[10px]">
            <X size={16} className="mr-2" /> Reset Protocol
          </Button>
        )}
      </div>

      {!image && !isLive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setIsLive(true)}
                className="aspect-square glass-card border border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden"
              >
                <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all shadow-2xl relative z-10">
                  <Camera size={40} />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-xl font-black uppercase italic tracking-tighter">Live Neural Lens</p>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em] mt-2 text-primary">Engage Real-Time Camera</p>
                </div>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square glass-card border border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden"
              >
                <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all relative z-10">
                  <Upload size={40} />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-xl font-black uppercase italic tracking-tighter">Static Upload</p>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em] mt-2">Process Gallery Image</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </button>
           </div>

           <Card className="glass-card p-10 bg-primary/5 border-primary/20 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <History size={24} />
                 </div>
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter">Scan Logs</h3>
                 <p className="text-sm text-white/40 leading-relaxed font-medium">Your metabolic history is currently being indexed by the AI neural core...</p>
              </div>
              <div className="mt-8 p-6 rounded-3xl bg-black/40 border border-white/5">
                 <div className="flex items-center gap-2 text-primary mb-2">
                    <Zap size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active Status</span>
                 </div>
                 <p className="text-xs font-black italic uppercase text-white/80">Ready for synchronization.</p>
              </div>
           </Card>
        </div>
      ) : isLive ? (
        <div className="relative max-w-4xl mx-auto aspect-video rounded-[3rem] overflow-hidden border border-primary/20 shadow-2xl glass-card">
           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
           <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
           
           {/* Lens HUD */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-primary/40 rounded-[3rem] relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-[3rem]" />
                 <Scan size={48} className="text-primary opacity-40" />
                 
                 {/* Corner Brackets */}
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              </div>
              <p className="mt-8 text-primary font-black uppercase italic tracking-[0.5em] text-xs drop-shadow-lg">Neural Scan Overlay Active</p>
           </div>

           <div className="absolute bottom-10 inset-x-0 flex justify-center items-center gap-6 z-30">
              <Button 
                onClick={captureFrame} 
                className="h-20 w-20 rounded-full bg-primary text-black shadow-[0_0_40px_rgba(234,88,12,0.6)] hover:scale-110 transition-transform active:scale-90"
              >
                <div className="h-14 w-14 rounded-full border-4 border-black/20 flex items-center justify-center">
                  <Zap size={28} />
                </div>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsLive(false)} 
                className="h-14 w-14 rounded-2xl border-white/10 bg-black/40 text-white/60 hover:text-white"
              >
                <CameraOff size={24} />
              </Button>
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 glass-card">
            <img src={image!} alt="Food" className="w-full h-full object-cover" />
            
            <AnimatePresence>
              {!result && !isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="p-10 rounded-[3rem] bg-black/40 backdrop-blur-xl border border-white/10 space-y-6 max-w-sm">
                    <div className="h-16 w-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-black shadow-2xl neon-glow">
                       <TrendingUp size={32} />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Visual Capture Lock</h3>
                    <p className="text-white/40 text-sm font-medium">Frame synchronized. Execute deep molecular indexing?</p>
                    <div className="flex gap-4">
                      <Button onClick={() => setImage(null)} variant="ghost" className="h-16 px-6 rounded-2xl font-black uppercase italic tracking-widest text-[10px]">
                        Discard
                      </Button>
                      <Button onClick={scanFood} className="flex-1 h-16 bg-primary text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl shadow-2xl neon-glow">
                        Analyze
                      </Button>
                    </div>
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
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mt-2">EXTRACTING MACRO NUTRIENTS...</p>
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
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Protocol Recommendation</p>
                            <p className={`text-2xl font-black uppercase italic tracking-tight ${result.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                               {result.isHealthy ? 'APPROVED_INTAKE' : 'RESTRICT_INTAKE'}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Metabolic Load</p>
                         <p className="text-5xl font-black italic text-primary drop-shadow-[0_0_10px_rgba(234,88,12,0.4)]">{result.totalCalories}<span className="text-xs ml-1 font-bold">KCAL</span></p>
                      </div>
                   </div>

                   <div className="grid gap-3 relative z-10">
                      {result.foodItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                           <div>
                              <p className="text-xl font-black uppercase italic tracking-tight text-white/90">{item.name}</p>
                              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{item.portion}</p>
                           </div>
                           <div className="flex gap-6 text-right">
                              <div>
                                 <p className="text-[8px] text-white/20 uppercase font-black">Protein</p>
                                 <p className="text-sm font-black italic text-primary">{item.protein}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] text-white/20 uppercase font-black">Energy</p>
                                 <p className="text-sm font-black italic text-white">{item.calories}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-3 relative z-10">
                      <div className="flex items-center gap-2 text-primary">
                         <Zap size={18} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence Feedback</span>
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
