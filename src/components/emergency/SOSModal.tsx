import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MapPin, Send } from 'lucide-react';
import { useEmergencyStore, EmergencyType, Severity } from '@/store/emergencyStore';

const emergencyTypes: { value: EmergencyType; label: string; emoji: string }[] = [
  { value: 'fire', label: 'Fire', emoji: '🔥' },
  { value: 'medical', label: 'Medical', emoji: '🏥' },
  { value: 'theft', label: 'Theft', emoji: '🔒' },
  { value: 'violence', label: 'Violence', emoji: '⚠️' },
  { value: 'suspicious', label: 'Suspicious', emoji: '👁' },
  { value: 'natural_disaster', label: 'Disaster', emoji: '🌊' },
  { value: 'technical', label: 'Technical', emoji: '⚡' },
];

const severityLevels: { value: Severity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-success/10 text-success border-success/30' },
  { value: 'medium', label: 'Medium', color: 'bg-primary/10 text-primary border-primary/30' },
  { value: 'high', label: 'High', color: 'bg-warning/10 text-warning border-warning/30' },
  { value: 'critical', label: 'Critical', color: 'bg-destructive/10 text-destructive border-destructive/30' },
];

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SOSModal({ open, onClose }: SOSModalProps) {
  const { addEmergency } = useEmergencyStore();
  const [type, setType] = useState<EmergencyType>('fire');
  const [severity, setSeverity] = useState<Severity>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !location) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    addEmergency({
      title, type, severity, description, location,
      reportedBy: 'Current User',
    });
    setSubmitting(false);
    setTitle(''); setDescription(''); setLocation('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card rounded-2xl border border-border card-shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground">Report SOS</h2>
                  <p className="text-xs text-muted-foreground">Submit an emergency alert</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Emergency Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Emergency Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {emergencyTypes.map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${type === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {severityLevels.map(s => (
                    <button key={s.value} onClick={() => setSeverity(s.value)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${severity === s.value ? s.color : 'border-border text-muted-foreground hover:border-primary/30'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief emergency title..."
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Floor 3 - Room 301"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the emergency..."
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!title || !description || !location || submitting}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit SOS'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
