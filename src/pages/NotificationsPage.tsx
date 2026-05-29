import { useState } from 'react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, UserCheck, RefreshCw, CheckCheck, MapPin, Phone, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

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
  const [active, setActive] = useState<Notification | null>(null);

  const openDetail = (n: Notification) => {
    setActive(n);
    if (!n.read) markAsRead(n.id);
  };

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
                onClick={() => openDetail(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(n); } }}
                className={`bg-card rounded-xl border border-border p-5 card-shadow cursor-pointer hover:card-shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-ring ${!n.read ? 'border-l-4 border-l-primary' : ''}`}
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

      <Sheet open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor[active.type]}`}>
                    {(() => { const Ic = typeIcon[active.type] || Bell; return <Ic className="w-5 h-5" />; })()}
                  </div>
                  {active.severity && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold bg-muted text-muted-foreground">
                      {active.severity}
                    </span>
                  )}
                </div>
                <SheetTitle className="font-display text-lg">{active.title}</SheetTitle>
                <SheetDescription>{active.message}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {active.location && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Location</h4>
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <div>{active.location.floor}{active.location.room ? ` · ${active.location.room}` : ''}</div>
                        {active.location.zone && <div className="text-muted-foreground text-xs mt-0.5">{active.location.zone}</div>}
                      </div>
                    </div>
                  </section>
                )}

                {active.coordinator && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Coordinator</h4>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <div className="text-sm font-medium text-foreground">{active.coordinator.name}</div>
                      <div className="text-xs text-muted-foreground">{active.coordinator.role}</div>
                      <a href={`tel:${active.coordinator.phone}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {active.coordinator.phone}
                      </a>
                    </div>
                  </section>
                )}

                {active.logs && active.logs.length > 0 && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Activity log</h4>
                    <ol className="space-y-3">
                      {active.logs.map((l, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="flex flex-col items-center pt-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                            {i < active.logs!.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="pb-2">
                            <div className="text-sm text-foreground">{l.event}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{l.time} · {l.by}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(active.createdAt).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
