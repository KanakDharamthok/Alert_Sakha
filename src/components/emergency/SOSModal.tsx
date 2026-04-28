import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MapPin, Send, ImagePlus, Loader2 } from 'lucide-react';
import { useEmergencyStore, EmergencyType, Severity } from '@/store/emergencyStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

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
  const { user } = useAuthStore();
  const [type, setType] = useState<EmergencyType>('fire');
  const [severity, setSeverity] = useState<Severity>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 5;
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    const valid: File[] = [];
    for (const f of picked) {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is over 5MB`);
        continue;
      }
      valid.push(f);
    }

    const merged = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) {
      toast.error(`Up to ${MAX_FILES} images allowed`);
    }
    setFiles(merged);
    setPreviews(merged.map(f => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!files.length) return [];
    if (!user) {
      toast.error('You must be signed in to upload images');
      return [];
    }
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('incident-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      // Store the storage path (not a public URL). Display code creates short-lived signed URLs.
      urls.push(path);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!title || !description || !location) return;
    setSubmitting(true);
    try {
      const imageUrls = await uploadImages();
      addEmergency({
        title, type, severity, description, location,
        reportedBy: user?.name ?? 'Current User',
        imageUrls,
      });
      toast.success('Emergency reported');
      setTitle(''); setDescription(''); setLocation('');
      setFiles([]); setPreviews([]);
      onClose();
    } finally {
      setSubmitting(false);
    }
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

              {/* Images */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Photos <span className="text-muted-foreground font-normal">(optional, max {MAX_FILES})</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                      <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX_FILES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
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
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit SOS'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
