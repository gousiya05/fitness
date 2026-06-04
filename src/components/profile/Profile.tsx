import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { User, Mail, Settings, Bell, Shield, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile({ user: initialUser }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    weight: '',
    height: '',
    fitnessGoal: 'maintenance',
    activityLevel: 'moderate'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            age: data.age || '',
            gender: data.gender || 'Male',
            weight: data.weight || '',
            height: data.height || '',
            fitnessGoal: data.fitnessGoal || 'maintenance',
            activityLevel: data.activityLevel || 'moderate'
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
          weight: Number(formData.weight),
          height: Number(formData.height)
        })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile Updated", { description: "Telemetry synced with Neural Node." });
      
      // Update local storage so dashboard picks it up quickly
      const stored = localStorage.getItem('userProfile');
      let currentProfile = stored ? JSON.parse(stored) : {};
      currentProfile = { 
        ...currentProfile, 
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        height: Number(formData.height),
        fitnessGoal: formData.fitnessGoal,
        activityLevel: formData.activityLevel
      };
      localStorage.setItem('userProfile', JSON.stringify(currentProfile));
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <Avatar className="h-40 w-40 border-4 border-[#050505]">
            <AvatarImage src={initialUser?.photoURL} />
            <AvatarFallback className="bg-orange-600 text-6xl font-black italic">
              {initialUser?.displayName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center md:text-left space-y-2 mt-4 md:mt-0">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            {initialUser?.displayName || 'User Profile'}
          </h1>
          <p className="text-white/40 flex items-center justify-center md:justify-start gap-2">
            <Mail size={14} /> {initialUser?.email}
          </p>
          <div className="flex gap-2 mt-4 justify-center md:justify-start">
            <Badge className="bg-orange-600">PRO MEMBER</Badge>
            <Badge variant="outline" className="border-white/20">ELITE STATUS</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-white/5 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-black italic uppercase">Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Age</label>
                  <Input type="number" name="age" value={formData.age} onChange={handleChange} className="bg-black/40 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm focus:border-primary/50 outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Weight (kg)</label>
                  <Input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="bg-black/40 border-white/10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Height (cm)</label>
                  <Input type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} className="bg-black/40 border-white/10" required />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Fitness Goal</label>
                  <select name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm focus:border-primary/50 outline-none">
                    <option value="fat_loss">Fat Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Activity Level</label>
                  <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full h-10 px-3 rounded-md bg-black/40 border border-white/10 text-sm focus:border-primary/50 outline-none">
                    <option value="sedentary">Sedentary (office job)</option>
                    <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                    <option value="very_active">Very Active (6-7 days/week)</option>
                    <option value="extra_active">Extra Active (physical job)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-black italic uppercase shadow-xl hover:bg-white transition-all">
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card border-white/5 bg-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/40">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: 'Notifications', icon: Bell },
                { label: 'Security & Privacy', icon: Shield },
                { label: 'App Settings', icon: Settings },
              ].map(item => (
                <button 
                  key={item.label}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-white/40 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-white/10" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full bg-red-600/10 text-red-600 hover:bg-red-600/20 border-red-600/20 font-black italic uppercase text-xs tracking-widest">
            <LogOut size={16} className="mr-2" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
      variant === 'outline' ? "border border-white/20 text-white/60" : "bg-orange-600 text-white",
      className
    )}>
      {children}
    </span>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
