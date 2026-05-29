import React from 'react';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  Upload,
  Database,
  Zap,
  Target,
  Loader2,
  Trash2,
  BarChart3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Dataset {
  name: string;
}

interface TrainResult {
  ok: boolean;
  output: string;
}

interface PredictResult {
  prediction: number;
  source: string;
  modelType?: string;
  trainR2?: number;
  testR2?: number;
  trainedAt?: string;
  dataset?: string;
  note?: string;
}

export default function MlDashboard() {
  const [datasets, setDatasets] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [training, setTraining] = React.useState(false);
  const [trainResult, setTrainResult] = React.useState<TrainResult | null>(null);
  const [predicting, setPredicting] = React.useState(false);
  const [predictResult, setPredictResult] = React.useState<PredictResult | null>(null);
  const [weightInput, setWeightInput] = React.useState('70');
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch datasets on mount
  React.useEffect(() => {
    fetchDatasets();
  }, []);

  async function fetchDatasets() {
    try {
      const res = await fetch('/api/ml/datasets');
      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ml/dataset', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) {
        await fetchDatasets();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(name: string) {
    try {
      await fetch(`/api/ml/dataset/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await fetchDatasets();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleTrain() {
    setTraining(true);
    setTrainResult(null);
    setError(null);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setTrainResult(data);
      } else {
        setError(data.error || 'Training failed');
      }
    } catch (err) {
      setError('Training failed');
    } finally {
      setTraining(false);
    }
  }

  async function handlePredict() {
    setPredicting(true);
    setPredictResult(null);
    setError(null);
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: [parseFloat(weightInput)] }),
      });
      const data = await res.json();
      setPredictResult(data);
    } catch (err) {
      setError('Prediction failed');
    } finally {
      setPredicting(false);
    }
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
            ML Pipeline: Active
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-[0.85] text-white"
        >
          Neural <br /> <span className="text-purple-400">Training Lab</span>
        </motion.h1>
        <p className="mt-6 text-white/40 font-medium max-w-xl text-lg leading-relaxed">
          Upload datasets, train local ML models, and get real-time predictions — all without API keys.
          Your data never leaves this machine.
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

      {/* Grid: Upload + Datasets */}
      <div className="grid gap-6 lg:grid-cols-2 relative z-10">

        {/* Upload Card */}
        <Card className="glass-card p-8 border-purple-500/20 bg-purple-500/5 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Upload size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Upload size={20} className="text-purple-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-purple-400">
              Upload Dataset
            </h3>
          </div>
          <p className="text-sm text-white/40 mb-6">
            Upload a CSV file with <code className="text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded">weight</code> and <code className="text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded">calories</code> columns.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleUpload}
            className="hidden"
            id="ml-dataset-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-2xl h-12 text-sm shadow-xl"
          >
            {uploading ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Uploading...</>
            ) : (
              <><Upload size={16} className="mr-2" /> Choose CSV File</>
            )}
          </Button>
        </Card>

        {/* Datasets List */}
        <Card className="glass-card p-8 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Database size={20} className="text-white/60" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">
              Datasets
            </h3>
            <Badge className="bg-white/5 text-white/40 border-white/10 ml-auto font-black text-[10px]">
              {datasets.length} files
            </Badge>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
            {datasets.length === 0 ? (
              <div className="text-center py-10 text-white/20">
                <Database size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No datasets uploaded yet</p>
              </div>
            ) : (
              datasets.map((name) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all group/item"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <BarChart3 size={14} className="text-purple-400" />
                  </div>
                  <span className="text-sm font-bold text-white/70 flex-1 truncate">{name}</span>
                  <button
                    onClick={() => handleDelete(name)}
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity text-red-400/60 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Train + Predict */}
      <div className="grid gap-6 lg:grid-cols-2 relative z-10">

        {/* Train Card */}
        <Card className="glass-card p-8 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">
              Train Model
            </h3>
          </div>
          <p className="text-sm text-white/40 mb-6">
            Train a linear regression model on your uploaded dataset. The model learns the relationship between
            weight and calorie requirements.
          </p>
          <Button
            onClick={handleTrain}
            disabled={training || datasets.length === 0}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-black uppercase italic rounded-2xl h-12 text-sm shadow-xl disabled:opacity-30"
          >
            {training ? (
              <><Loader2 className="animate-spin mr-2" size={16} /> Training Model...</>
            ) : (
              <><Zap size={16} className="mr-2" /> Start Training</>
            )}
          </Button>

          {trainResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle2 size={16} />
                <span className="text-sm font-black uppercase">Training Complete</span>
              </div>
              <pre className="text-xs text-white/50 whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">
                {trainResult.output}
              </pre>
            </motion.div>
          )}
        </Card>

        {/* Predict Card */}
        <Card className="glass-card p-8 border-purple-500/20 bg-purple-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Target size={20} className="text-purple-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-purple-400">
              Predict
            </h3>
          </div>
          <p className="text-sm text-white/40 mb-4">
            Enter a body weight (kg) to predict daily calorie requirements using the trained model.
          </p>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="Weight in kg"
                className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white font-bold text-lg focus:border-purple-500/40 focus:outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 font-bold text-sm">kg</span>
            </div>
            <Button
              onClick={handlePredict}
              disabled={predicting || !weightInput}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase italic rounded-xl h-12 px-6 text-sm shadow-xl"
            >
              {predicting ? <Loader2 className="animate-spin" size={16} /> : <><Target size={16} className="mr-2" /> Predict</>}
            </Button>
          </div>

          {predictResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-black/60 border border-purple-500/20 space-y-4"
            >
              <div className="text-center">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-2">
                  Predicted Daily Calories
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-white">
                  {predictResult.prediction}
                  <span className="text-lg text-white/30 ml-2">kcal</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-[8px] font-black text-white/20 uppercase mb-1">Source</div>
                  <div className={cn(
                    "text-sm font-black italic uppercase",
                    predictResult.source === 'trained-model' ? 'text-green-400' : 'text-yellow-400'
                  )}>
                    {predictResult.source}
                  </div>
                </div>
                {predictResult.testR2 !== undefined && (
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <div className="text-[8px] font-black text-white/20 uppercase mb-1">Model R²</div>
                    <div className="text-sm font-black italic text-purple-400">
                      {(predictResult.testR2 * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              {predictResult.note && (
                <p className="text-xs text-white/30 text-center italic">{predictResult.note}</p>
              )}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
