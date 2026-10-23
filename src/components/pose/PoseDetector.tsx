import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CameraOff, Scan, Activity, Target, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────
// Angle helper — calculates the angle at point B given A-B-C
// ─────────────────────────────────────────────────────────
function calcAngle(
  A: { x: number; y: number },
  B: { x: number; y: number },
  C: { x: number; y: number }
): number {
  const radians =
    Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

type CameraError = 'denied' | 'not-found' | 'in-use' | 'unknown' | null;

export default function PoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const stateRef = useRef({ stage: 'up' as 'up' | 'down', repCount: 0 });
  const animFrameRef = useRef<number>(0);

  const [isLive, setIsLive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState<'up' | 'down'>('up');
  const [poseScore, setPoseScore] = useState<number | null>(null);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('Stand in front of camera. Full body visible.');

  // ── Draw landmarks on canvas ─────────────────────────────
  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Draw connections manually for reliability
      const lm = results.poseLandmarks;
      const W = canvas.width;
      const H = canvas.height;

      // Draw skeleton lines
      const connections = [
        [11, 13], [13, 15], [12, 14], [14, 16], // arms
        [11, 12], [11, 23], [12, 24], [23, 24],  // torso
        [23, 25], [25, 27], [27, 31],             // left leg
        [24, 26], [26, 28], [28, 32],             // right leg
      ];
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 3;
      connections.forEach(([a, b]) => {
        if (lm[a] && lm[b] && lm[a].visibility > 0.3 && lm[b].visibility > 0.3) {
          ctx.beginPath();
          ctx.moveTo(lm[a].x * W, lm[a].y * H);
          ctx.lineTo(lm[b].x * W, lm[b].y * H);
          ctx.stroke();
        }
      });

      // Draw landmark dots
      ctx.fillStyle = '#ffffff';
      lm.forEach((point: any) => {
        if (point.visibility > 0.3) {
          ctx.beginPath();
          ctx.arc(point.x * W, point.y * H, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // ── Squat rep counting using real 3-point knee angle ──
      // Landmarks: 23=leftHip, 25=leftKnee, 27=leftAnkle
      const hip   = lm[23];
      const knee  = lm[25];
      const ankle = lm[27];

      const allVisible = hip?.visibility > 0.5 && knee?.visibility > 0.5 && ankle?.visibility > 0.5;

      if (allVisible) {
        const angle = calcAngle(
          { x: hip.x, y: hip.y },
          { x: knee.x, y: knee.y },
          { x: ankle.x, y: ankle.y }
        );
        setKneeAngle(Math.round(angle));

        // Squat down = knee angle < 100°, standing = > 160°
        let { stage: currentStage, repCount: currentCount } = stateRef.current;
        let newFeedback = feedback;

        if (angle < 100) {
          if (currentStage !== 'down') {
            currentStage = 'down';
            newFeedback = 'Good depth! Drive through heels to rise.';
          }
          // Form score: ideal bottom is 80-100°
          const score = Math.max(60, Math.min(100, Math.round(100 - Math.abs(angle - 90) * 0.5)));
          setPoseScore(score);
        }

        if (angle > 160 && currentStage === 'down') {
          currentStage = 'up';
          currentCount += 1;
          newFeedback = `Rep ${currentCount} complete! Lower again.`;
          setPoseScore(95);
        }

        if (angle >= 100 && angle <= 160 && currentStage === 'up') {
          newFeedback = 'Lower further for a full squat.';
        }

        if (currentStage !== stateRef.current.stage || currentCount !== stateRef.current.repCount) {
          stateRef.current = { stage: currentStage, repCount: currentCount };
          setStage(currentStage);
          setRepCount(currentCount);
          setFeedback(newFeedback);
        }

        // Draw angle annotation on canvas
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${Math.round(angle)}°`, knee.x * W + 10, knee.y * H - 10);
      } else {
        setKneeAngle(null);
        setPoseScore(null);
        setFeedback('Ensure your full lower body is visible.');
      }
    }

    ctx.restore();
  }, []);

  // ── Start camera and MediaPipe ───────────────────────────
  const startLive = useCallback(async () => {
    setCameraError(null);
    setLoading(true);

    // Request camera permission first
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
    } catch (err: any) {
      setLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('denied');
        toast.error('Camera permission denied', { description: 'Allow camera access in your browser settings.' });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('not-found');
        toast.error('No camera found', { description: 'Connect a webcam and try again.' });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('in-use');
        toast.error('Camera in use', { description: 'Another app is using your camera. Close it and retry.' });
      } else {
        setCameraError('unknown');
        toast.error('Camera error', { description: err.message });
      }
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    // Dynamically import MediaPipe — uses CDN files
    try {
      const { Pose } = await import('@mediapipe/pose');
      const { Camera } = await import('@mediapipe/camera_utils');

      const pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      const camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (videoRef.current && poseRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current = camera;
      setIsLive(true);
      setLoading(false);
      toast.success('Neural Vision Active', { description: 'Stand so your full body is visible.' });
    } catch (mpErr: any) {
      // MediaPipe failed to load (CDN issue or unsupported browser)
      setLoading(false);
      setCameraError('unknown');
      // Stop the camera stream since we can't process it
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      toast.error('MediaPipe failed to load', {
        description: 'Check your internet connection — MediaPipe loads from CDN.',
        duration: 8000,
      });
    }
  }, [onResults]);

  // ── Stop camera and clean up ─────────────────────────────
  const stopLive = useCallback(() => {
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) {}
      cameraRef.current = null;
    }
    if (poseRef.current) {
      try { poseRef.current.close(); } catch (_) {}
      poseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsLive(false);
    setKneeAngle(null);
    setPoseScore(null);
    stateRef.current = { stage: 'up', repCount: 0 };
    setRepCount(0);
    setStage('up');
    setFeedback('Stand in front of camera. Full body visible.');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopLive(), [stopLive]);

  // ── UI ───────────────────────────────────────────────────
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-xl neon-glow">
              <Activity size={20} />
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black italic tracking-widest text-[8px] px-3">
              Live Form Analysis
            </Badge>
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">Pose <span className="text-primary">Detector</span></h1>
          <p className="text-white/40 font-medium max-w-md mt-2">Real-time squat tracking using MediaPipe + proper knee-angle calculation.</p>
        </div>
      </div>

      {!isLive ? (
        <div className="glass-card p-12 text-center rounded-[3rem] border border-white/5 space-y-8">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-2xl">
            <Scan size={48} />
          </div>

          {/* Camera error states */}
          {cameraError && (
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-left space-y-3">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <span className="font-black uppercase tracking-widest text-sm">
                  {cameraError === 'denied' && 'Camera Permission Denied'}
                  {cameraError === 'not-found' && 'No Camera Found'}
                  {cameraError === 'in-use' && 'Camera Already In Use'}
                  {cameraError === 'unknown' && 'Camera Unavailable'}
                </span>
              </div>
              <p className="text-sm text-white/50">
                {cameraError === 'denied' && 'Click the camera icon in your browser address bar and allow access, then retry.'}
                {cameraError === 'not-found' && 'No webcam detected. Connect a USB or built-in camera and refresh the page.'}
                {cameraError === 'in-use' && 'Close other tabs or apps using your camera (e.g. Zoom, Teams), then retry.'}
                {cameraError === 'unknown' && 'MediaPipe failed to initialize. Ensure you have internet access (CDN required) and try a Chromium-based browser.'}
              </p>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Initialize Camera Link</h2>
            <p className="text-white/40 mt-2">Ensure your full body (head to ankles) is visible for squat tracking.</p>
            <p className="text-white/20 text-sm mt-1">Requires: webcam + internet (MediaPipe CDN) + Chrome/Edge/Firefox</p>
          </div>

          <Button
            onClick={startLive}
            disabled={loading}
            className="h-16 px-12 bg-primary text-black font-black uppercase italic tracking-tighter text-lg rounded-2xl shadow-2xl neon-glow disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="mr-2 animate-spin" />
                Initializing…
              </>
            ) : (
              <>
                <Scan size={20} className="mr-2" />
                {cameraError ? 'Retry Camera' : 'Engage Neural Vision'}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Camera feed canvas */}
          <div className="lg:col-span-3 relative aspect-video rounded-[3rem] overflow-hidden border border-primary/20 shadow-2xl glass-card bg-black">
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-cover" />

            {/* HUD */}
            <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
              <Badge className="bg-red-500 text-white border-none uppercase font-black italic tracking-widest flex items-center gap-2 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-white" /> REC
              </Badge>
              <Badge className="bg-black/50 backdrop-blur-md text-white border border-white/10 uppercase font-black italic tracking-widest">
                SQUAT TRACKER
              </Badge>
            </div>

            {/* Feedback text */}
            <div className="absolute bottom-20 left-6 right-6 z-10">
              <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-sm font-bold text-white/80">
                {feedback}
              </div>
            </div>

            <div className="absolute bottom-6 right-6 z-10">
              <Button
                variant="destructive"
                onClick={stopLive}
                className="h-14 w-14 rounded-2xl shadow-2xl"
                size="icon"
              >
                <CameraOff size={24} />
              </Button>
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-4">
            <div className="glass-card p-8 rounded-[2rem] border border-white/5 text-center">
              <Target className="mx-auto text-primary mb-4" size={32} />
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Repetitions</p>
              <p className="text-7xl font-black italic tracking-tighter text-white">{repCount}</p>
            </div>

            <div className="glass-card p-8 rounded-[2rem] border border-white/5 text-center">
              <Activity className="mx-auto text-primary mb-4" size={32} />
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Knee Angle</p>
              {kneeAngle !== null ? (
                <p className="text-4xl font-black italic tracking-tighter text-primary">{kneeAngle}°</p>
              ) : (
                <p className="text-sm text-white/20 italic">Tracking…</p>
              )}
            </div>

            {poseScore !== null && (
              <div className="glass-card p-6 rounded-[2rem] border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-2">Form Score</p>
                <p className="text-5xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]">
                  {poseScore}%
                </p>
              </div>
            )}

            <div className="glass-card p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-4">Phase</p>
              <div className="flex gap-2">
                <div className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase italic transition-all ${stage === 'down' ? 'bg-primary text-black' : 'bg-white/5 text-white/40'}`}>
                  Descend
                </div>
                <div className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase italic transition-all ${stage === 'up' ? 'bg-primary text-black' : 'bg-white/5 text-white/40'}`}>
                  Ascend
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 text-[9px] text-white/20 space-y-1">
              <div className="font-black uppercase tracking-widest text-white/30 mb-2">Tracking Info</div>
              <div>Angle threshold: &lt;100° = down, &gt;160° = up</div>
              <div>Min visibility: 0.5 confidence</div>
              <div>Model: MediaPipe Pose (CDN)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
