import { useEmergencyStore, EmergencyStatus } from '@/store/emergencyStore';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useState } from 'react';

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

const typeLabel: Record<string, string> = {
  fire: '🔥 Fire', medical: '🏥 Medical', theft: '🔒 Theft', violence: '⚠️ Violence',
  suspicious: '👁 Suspicious', natural_disaster: '🌊 Disaster', technical: '⚡ Technical',
};

export default function EmergencyListPage() {
  const { emergencies } = useEmergencyStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | 'all'>('all');

  const filtered = emergencies.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Emergencies</h1>
            <p className="text-muted-foreground text-sm mt-1">{emergencies.length} total incidents</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Report SOS
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search emergencies..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['all', 'active', 'in_progress', 'resolved'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/emergencies/${e.id}`} className="block bg-card rounded-xl border border-border p-5 card-shadow hover:card-shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${severityColor[e.severity]}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{e.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[e.status]}`}>{e.status.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${severityColor[e.severity]}`}>{e.severity}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{e.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{typeLabel[e.type] || e.type}</span>
                      <span>📍 {e.location}</span>
                      <span>Reported by {e.reportedBy}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No emergencies found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
