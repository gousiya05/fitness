import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Settings, Bell, Shield, LogOut } from 'lucide-react';

export default function Profile({ user }: { user: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <Avatar className="h-40 w-40 border-4 border-[#050505]">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-orange-600 text-6xl font-black italic">
              {user?.displayName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center md:text-left space-y-2 mt-4 md:mt-0">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            {user?.displayName || 'User Profile'}
          </h1>
          <p className="text-white/40 flex items-center justify-center md:justify-start gap-2">
            <Mail size={14} /> {user?.email}
          </p>
          <div className="flex gap-2 mt-4 justify-center md:justify-start">
            <Badge className="bg-orange-600">PRO MEMBER</Badge>
            <Badge variant="outline" className="border-white/20">ELITE STATUS</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/5 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold">Age</label>
                <Input defaultValue="25" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold">Gender</label>
                <Input defaultValue="Male" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold">Weight (kg)</label>
                <Input defaultValue="75" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-white/40 font-bold">Height (cm)</label>
                <Input defaultValue="180" className="bg-black/40 border-white/10" />
              </div>
            </div>
            <Button className="w-full bg-white/10 hover:bg-white/20">Update Profile</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/5 bg-white/5">
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
                    <item.icon size={18} className="text-white/40 group-hover:text-orange-500" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-white/10" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full bg-red-600/10 text-red-600 hover:bg-red-600/20 border-red-600/20">
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
