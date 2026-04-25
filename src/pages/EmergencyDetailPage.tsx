import { useParams, Link } from 'react-router-dom';
import { useEmergencyStore } from '@/store/emergencyStore';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, MapPin, User, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import EmergencyChat from '@/components/emergency/EmergencyChat';
import EmergencyMap from '@/components/emergency/EmergencyMap';

const severityColor: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  low: 'bg-success/10 text-success border-success/20',
};

const statusColor: Record<string, string> = {
  active: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

// Mock coordinates for emergencies
const locationCoords: Record<string, [number, number]> = {
  '1': [25.2769, 55.2963],
  '2': [25.2780, 55.2975],
  '3': [25.2755, 55.2950],
  '4': [25.2740, 55.2940],
  '5': [25.2795, 55.2990],
};

const mockStaffMarkers = [
  { id: 's1', lat: 25.2772, lng: 55.2958, label: 'Maria Santos', type: 'staff' as const, detail: 'Security Team' },
  { id: 's2', lat: 25.2785, lng: 55.2970, label: 'Ahmed Khan', type: 'staff' as const, detail: 'Fire Response' },
];

export default function EmergencyDetailPage() {
  const { id } = useParams();
  const { getEmergency } = useEmergencyStore();
  const emergency = getEmergency(id || '');

  if (!emergency) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Emergency not found</h2>
          <Link to="/emergencies" className="text-primary hover:underline text-sm">Back to emergencies</Link>
        </div>
      </AppLayout>
    );
  }

  const coords = locationCoords[emergency.id] || [25.2769, 55.2963];
  const mapMarkers = [
    { id: emergency.id, lat: coords[0], lng: coords[1], label: emergency.title, type: 'emergency' as const, detail: emergency.location },
    ...mockStaffMarkers,
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link to="/emergencies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to emergencies
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 card-shadow"
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${severityColor[emergency.severity]}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-xl font-bold text-foreground">{emergency.title}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[emergency.status]}`}>
                  {emergency.status.replace('_', ' ')}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${severityColor[emergency.severity]}`}>
                  {emergency.severity}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">{emergency.description}</p>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {emergency.location}</span>
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {emergency.reportedBy}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(emergency.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline + Chat */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border card-shadow">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-semibold text-foreground">Incident Timeline</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {emergency.timeline.map((t, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
                        {i < emergency.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-sm font-medium text-foreground">{t.event}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.time} • {t.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-card rounded-xl border border-border card-shadow">
              <div className="p-5 border-b border-border">
                <h2 className="font-display font-semibold text-foreground">Emergency Chat</h2>
              </div>
              <div className="p-5">
                <EmergencyChat emergencyId={emergency.id} />
              </div>
            </div>

            {/* Photos */}
            {emergency.imageUrls && emergency.imageUrls.length > 0 && (
              <div className="bg-card rounded-xl border border-border card-shadow">
                <div className="p-5 border-b border-border">
                  <h2 className="font-display font-semibold text-foreground">Incident Photos</h2>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {emergency.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-border block hover:opacity-90 transition-opacity">
                      <img src={url} alt={`Incident photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 card-shadow">
              <h3 className="font-display font-semibold text-foreground mb-3">Assigned To</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{emergency.assignedTo || 'Unassigned'}</div>
                  <div className="text-xs text-muted-foreground">Response Team</div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card rounded-xl border border-border p-5 card-shadow">
              <h3 className="font-display font-semibold text-foreground mb-3">Location</h3>
              <EmergencyMap markers={mapMarkers} center={coords} zoom={15} className="h-48" />
              <p className="text-sm text-muted-foreground mt-3">{emergency.location}</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 card-shadow">
              <h3 className="font-display font-semibold text-foreground mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2.5 bg-warning text-warning-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  Update Status
                </button>
                <button className="w-full py-2.5 bg-success text-success-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  Mark Resolved
                </button>
                <button className="w-full py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                  Assign Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
