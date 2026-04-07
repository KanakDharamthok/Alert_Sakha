import { useAuthStore } from '@/store/authStore';
import { useEmergencyStore } from '@/store/emergencyStore';
import { useNotificationStore } from '@/store/notificationStore';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Users, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const severityColor: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-primary/10 text-primary',
  low: 'bg-success/10 text-success',
};

const statusColor: Record<string, string> = {
  active: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { emergencies } = useEmergencyStore();
  const { notifications } = useNotificationStore();

  const active = emergencies.filter(e => e.status === 'active').length;
  const inProgress = emergencies.filter(e => e.status === 'in_progress').length;
  const resolved = emergencies.filter(e => e.status === 'resolved' || e.status === 'closed').length;

  const statCards = [
    { label: 'Active Emergencies', value: active, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Team Members', value: 24, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border p-5 card-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Emergencies */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border card-shadow">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Recent Emergencies</h2>
              <Link to="/emergencies" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {emergencies.slice(0, 4).map(e => (
                <Link key={e.id} to={`/emergencies/${e.id}`} className="flex items-center gap-4 p-5 hover:bg-accent/50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${severityColor[e.severity]}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.location}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${statusColor[e.status]}`}>
                    {e.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-xl border border-border card-shadow">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Notifications</h2>
              <Link to="/notifications" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`p-4 ${!n.read ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${n.type === 'sos' ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
