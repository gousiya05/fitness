import React, { useRef, useEffect, useState } from 'react';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera as CameraIcon, 
  CameraOff, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Timer, 
  Flame, 
  Settings2,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ExerciseType = 'squat' | 'curl' | 'pushup';

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [exercise, setExercise] = useState<ExerciseType>('curl');
  const [feedback, setFeedback] = useState<string>("Stand in view to start");
  const [postureStatus, setPostureStatus] = useState<'neutral' | 'good' | 'bad'>('neutral');
  const [score, setScore] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [calories, setCalories] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => setSessionTime(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window && isActive) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  useEffect(() => {
    if (!isActive) return;

    let isPoseActive = true;
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    let stage: 'up' | 'down' | null = null;
    let localRepCount = 0;

    pose.onResults((results) => {
      if (!isPoseActive || !canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#ffffff20', lineWidth: 2 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#ea580c', lineWidth: 1, radius: 3 });

        let angle = 0;
        let isRep = false;

        if (exercise === 'curl') {
          angle = calculateAngle(results.poseLandmarks[11], results.poseLandmarks[13], results.poseLandmarks[15]);
          if (angle > 160) stage = 'down';
          if (angle < 30 && stage === 'down') { stage = 'up'; isRep = true; }
        } else if (exercise === 'squat') {
          angle = calculateAngle(results.poseLandmarks[23], results.poseLandmarks[25], results.poseLandmarks[27]);
          if (angle > 160) stage = 'up';
          if (angle < 90 && stage === 'up') { stage = 'down'; isRep = true; }
        }

        if (isRep) {
          localRepCount++;
          setRepCount(localRepCount);
          setCalories(prev => prev + (exercise === 'squat' ? 0.5 : 0.2));
          speak(`${localRepCount}`);
          toast.success("Rep Counted", { duration: 800 });
        }

        // Posture Score Logic (Stability)
        const leftShoulder = results.poseLandmarks[11];
        const rightShoulder = results.poseLandmarks[12];
        const stability = 1 - Math.abs(leftShoulder.y - rightShoulder.y);
        const currentScore = Math.round(stability * 100);
        setScore(currentScore);

        if (currentScore < 85) {
          setPostureStatus('bad');
          setFeedback("Adjust posture: Shoulders uneven");
        } else {
          setPostureStatus('good');
          setFeedback("Keep steady focus");
        }
      } else {
        setScore(0);
        setFeedback("Locating skeletal structure...");
      }
      canvasCtx.restore();
    });

    if (!videoRef.current) return;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!isPoseActive || !videoRef.current) return;
        try {
          await pose.send({ image: videoRef.current });
        } catch (error) {
          console.error("Pose detection error:", error);
        }
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      isPoseActive = false;
      camera.stop();
      pose.close();
    };
  }, [isActive, exercise]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card className="overflow-hidden glass-card relative h-[600px] border-none shadow-2xl">
            {/* Overlay HUD */}
            <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start z-20 pointer-events-none">
              <div className="space-y-2">
                <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Neural Link Active</span>
                </div>
                <div className="glass-card p-4 inline-block">
                  <div className="text-[10px] font-black uppercase text-white/30 mb-1 tracking-widest">Reps Detected</div>
                  <div className="text-5xl font-black italic text-primary drop-shadow-[0_0_15px_rgba(234,88,12,0.4)]">{repCount}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="glass px-4 py-3 rounded-2xl flex items-center gap-4">
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-white/40 uppercase">AI Posture Score</span>
                      <span className={cn("text-xl font-black italic", score > 90 ? "text-green-500" : "text-primary")}>{score}%</span>
                   </div>
                   <div className="h-10 w-10 rounded-full border-4 border-white/5 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/20" style={{ height: `${score}%` }} />
                      <BrainCircuit size={16} className="relative z-10" />
                   </div>
                </div>

                <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                    <Timer size={14} className="text-primary" />
                    <span className="font-mono font-bold text-sm tracking-tighter">{formatTime(sessionTime)}</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 z-20 pointer-events-none">
                <div className={cn(
                  "inline-flex items-center gap-3 glass px-6 py-3 rounded-2xl transition-all duration-500",
                  postureStatus === 'good' ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
                )}>
                  {postureStatus === 'good' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span className="font-black italic uppercase text-sm">{feedback}</span>
                </div>
            </div>

            <CardContent className="p-0 h-full relative bg-background flex items-center justify-center">
              <video ref={videoRef} className="hidden" />
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={480} 
                className="w-full h-full object-cover opacity-60"
              />
              
              <AnimatePresence>
                {!isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center glass-card border-none rounded-none"
                  >
                    <div className="relative group p-8 text-center">
                      <div className="absolute inset-0 bg-primary/20 blur-[100px] group-hover:bg-primary/30 transition-all" />
                      <div className="relative z-10 space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary neon-glow">
                          <CameraIcon size={40} />
                        </div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">System Offline</h3>
                        <p className="text-white/40 max-w-xs font-medium">Activate vision protocols to begin skeletal posture mapping.</p>
                        <Button onClick={() => setIsActive(true)} className="h-14 px-12 bg-primary text-black font-black uppercase italic rounded-2xl hover:scale-105 transition-transform">
                          Engage Neural Link
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card p-6">
            <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-4">Protocol Select</div>
            <div className="grid gap-2">
              <button 
                onClick={() => setExercise('curl')}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  exercise === 'curl' ? "bg-primary text-black border-primary" : "glass text-white/50 border-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Zap size={16} />
                  <span className="font-black italic uppercase text-xs">Bicep Curls</span>
                </div>
                {exercise === 'curl' && <div className="h-2 w-2 rounded-full bg-black animate-pulse" />}
              </button>
              <button 
                onClick={() => setExercise('squat')}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  exercise === 'squat' ? "bg-primary text-black border-primary" : "glass text-white/50 border-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Zap size={16} />
                  <span className="font-black italic uppercase text-xs">Bodyweight Squats</span>
                </div>
                {exercise === 'squat' && <div className="h-2 w-2 rounded-full bg-black animate-pulse" />}
              </button>
            </div>
          </Card>

          <Card className="glass-card p-6 bg-primary/5 border-primary/20">
             <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black uppercase text-primary tracking-widest">Energy Matrix</div>
                <Flame size={16} className="text-primary" />
             </div>
             <div className="text-4xl font-black italic">{calories.toFixed(1)} <span className="text-sm">KCAL</span></div>
             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ width: `${(calories / 100) * 100}%` }}
                />
             </div>
          </Card>

          <Button 
            variant="ghost" 
            className="w-full h-14 glass text-white/40 hover:text-white border-white/5 flex items-center justify-center gap-2"
            onClick={() => setIsActive(false)}
          >
            <CameraOff size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Deactivate System</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
