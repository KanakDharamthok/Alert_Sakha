import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Camera } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 card-shadow"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-primary">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{user?.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                <Shield className="w-3 h-3" /> {user?.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input defaultValue={user?.name} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input defaultValue={user?.email} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input defaultValue={user?.role} disabled className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-muted text-muted-foreground text-sm capitalize" />
              </div>
            </div>
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
