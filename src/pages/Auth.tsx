import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Sparkles, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = type === 'login' ? { email, password } : { email, password, firstName, lastName };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Authentication failed');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        displayName: `${data.user.firstName} ${data.user.lastName}`.trim() || data.user.email,
        email: data.user.email,
        photoURL: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop',
      }));
      
      if (data.user.onboarded) {
        localStorage.setItem('onboarded', 'true');
      }

      window.dispatchEvent(new Event('auth-change'));
      
      const onboarded = localStorage.getItem('onboarded');
      if (onboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
      
      toast.success(type === 'login' ? "Access Granted." : "Profile Created.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-primary grid-bg relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-10">
            <div 
              onClick={() => navigate('/')} 
              className="h-20 w-20 bg-primary rounded-[2rem] flex items-center justify-center text-4xl font-black italic cursor-pointer shadow-2xl neon-glow active:scale-95 transition-transform"
            >
              F
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass p-1.5 h-16 rounded-[2rem] border-white/5">
              <TabsTrigger value="login" className="rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all">Verification</TabsTrigger>
              <TabsTrigger value="register" className="rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all">New Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-8">
              <Card className="glass-card p-6 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <LogIn size={80} />
                </div>
                <CardHeader className="pb-8">
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">System Login</CardTitle>
                  <CardDescription className="text-white/30 font-medium text-xs uppercase tracking-widest">Verify biometric credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                        <Input 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="AUTHORIZED_EMAIL" 
                          className="h-14 pl-12 glass border-transparent focus:border-primary/50 rounded-2xl font-bold tracking-tight" 
                          required 
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                        <Input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="SECURE_PHRASE" 
                          className="h-14 pl-12 glass border-transparent focus:border-primary/50 rounded-2xl font-bold tracking-tight" 
                          required 
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-black hover:bg-white rounded-[1.5rem] font-black uppercase italic tracking-tighter text-lg shadow-xl neon-glow">
                      {loading ? <Sparkles className="animate-spin mr-2" size={20} /> : <LogIn className="mr-2" size={20} />}
                      {loading ? "Decrypting..." : "Initialize Access"}
                    </Button>
                    
                    <div className="relative py-2">
                       <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                       <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.3em] text-white/20 px-4 bg-black/40 backdrop-blur-md">Legacy Auth</div>
                    </div>

                    <Button variant="outline" className="w-full h-14 glass border-white/5 hover:border-primary/20 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all">
                      <svg className="mr-2 h-4 w-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                      Global Sync
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="mt-8">
              <Card className="glass-card p-6 border-white/5">
                <CardHeader className="pb-8">
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">New Protocol</CardTitle>
                  <CardDescription className="text-white/30 font-medium text-xs uppercase tracking-widest">Enroll in neural system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="ALIAS_FIRST" 
                        className="h-14 glass border-transparent focus:border-primary/50 rounded-2xl font-bold" 
                        required 
                      />
                      <Input 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="ALIAS_LAST" 
                        className="h-14 glass border-transparent focus:border-primary/50 rounded-2xl font-bold" 
                        required 
                      />
                    </div>
                    <Input 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="IDENTIFICATION_EMAIL" 
                      className="h-14 glass border-transparent focus:border-primary/50 rounded-2xl font-bold" 
                      type="email" 
                      required 
                    />
                    <Input 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="PASSPHRASE" 
                      className="h-14 glass border-transparent focus:border-primary/50 rounded-2xl font-bold" 
                      type="password" 
                      required 
                    />
                    <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-black hover:bg-white rounded-[1.5rem] font-black uppercase italic tracking-tighter text-lg shadow-xl neon-glow">
                      {loading ? <Sparkles className="animate-spin mr-2" size={20} /> : <UserPlus className="mr-2" size={20} />}
                      Commit Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-12 text-center space-y-2">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 group cursor-default">
                Neural Link Node 74-A
             </div>
             <p className="text-[8px] font-bold text-white/5 max-w-[200px] mx-auto uppercase">
               All telemetry data is encrypted using metabolic hash protocols.
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
