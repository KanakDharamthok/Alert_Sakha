import { useNotificationStore } from '@/store/notificationStore';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, UserCheck, RefreshCw, CheckCheck } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

const typeIcon: Record<string, typeof Bell> = {
  sos: AlertTriangle,
  update: RefreshCw,
  assignment: UserCheck,
  info: Info,
};

const typeColor: Record<string, string> = {
  sos: 'text-destructive bg-destructive/10',
  update: 'text-primary bg-primary/10',
  assignment: 'text-warning bg-warning/10',
  info: 'text-muted-foreground bg-muted',
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllRead, unreadCount } = useNotificationStore();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = typeIcon[n.type] || Bell;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => markAsRead(n.id)}
                className={`bg-card rounded-xl border border-border p-5 card-shadow cursor-pointer hover:card-shadow-lg transition-shadow ${!n.read ? 'border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColor[n.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">{n.title}</h3>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
