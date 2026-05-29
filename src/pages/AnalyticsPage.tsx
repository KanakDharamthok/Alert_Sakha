import AppLayout from '@/components/layout/AppLayout';
import { useEmergencyStore } from '@/store/emergencyStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, X, MapPin } from 'lucide-react';

const COLORS = ['hsl(221,83%,53%)', 'hsl(0,84%,60%)', 'hsl(38,92%,50%)', 'hsl(160,84%,39%)', 'hsl(217,91%,60%)', 'hsl(280,60%,50%)', 'hsl(30,80%,55%)'];

const typeLabels: Record<string, string> = {
  fire: 'Fire', medical: 'Medical', theft: 'Theft', violence: 'Violence',
  suspicious: 'Suspicious', natural_disaster: 'Disaster', technical: 'Technical',
};

const mockResponseTimes = [
  { day: 'Mon', avg: 4.2 }, { day: 'Tue', avg: 3.8 }, { day: 'Wed', avg: 5.1 },
  { day: 'Thu', avg: 2.9 }, { day: 'Fri', avg: 3.5 }, { day: 'Sat', avg: 6.2 }, { day: 'Sun', avg: 4.0 },
];

const mockPeakHours = [
  { hour: '6AM', count: 1 }, { hour: '8AM', count: 3 }, { hour: '10AM', count: 5 },
  { hour: '12PM', count: 4 }, { hour: '2PM', count: 6 }, { hour: '4PM', count: 3 },
  { hour: '6PM', count: 7 }, { hour: '8PM', count: 8 }, { hour: '10PM', count: 4 }, { hour: '12AM', count: 2 },
];

const mockTrend = [
  { week: 'W1', incidents: 8 }, { week: 'W2', incidents: 12 }, { week: 'W3', incidents: 6 },
  { week: 'W4', incidents: 15 }, { week: 'W5', incidents: 9 }, { week: 'W6', incidents: 11 },
];

export default function AnalyticsPage() {
  const { emergencies } = useEmergencyStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const typeCounts = emergencies.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: typeLabels[type] || type, value: count, key: type,
  }));

  const filteredIncidents = selectedType
    ? emergencies.filter((e) => e.type === selectedType)
    : [];

  const active = emergencies.filter(e => e.status === 'active').length;
  const resolved = emergencies.filter(e => e.status === 'resolved' || e.status === 'closed').length;

  const stats = [
    { label: 'Total Incidents', value: emergencies.length, icon: AlertTriangle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Avg Response', value: '3.9 min', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Active Now', value: active, icon: TrendingUp, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Insights and performance metrics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Incident Types */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Incident Types</h2>
              <span className="text-xs text-muted-foreground">Click a slice to drill in</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    onClick={(d: { key?: string }) => d?.key && setSelectedType((cur) => (cur === d.key ? null : d.key!))}
                    className="cursor-pointer"
                  >
                    {pieData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        opacity={selectedType && selectedType !== d.key ? 0.35 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Avg Response Time (min)</h2>
              <span className="text-xs text-muted-foreground">Click a bar for the day</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockResponseTimes} onClick={(s: { activeLabel?: string }) => s?.activeLabel && setSelectedDay((cur) => (cur === s.activeLabel ? null : s.activeLabel!))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]} className="cursor-pointer">
                    {mockResponseTimes.map((d) => (
                      <Cell key={d.day} fill="hsl(221,83%,53%)" opacity={selectedDay && selectedDay !== d.day ? 0.35 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incident Trend */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <h2 className="font-display font-semibold text-foreground mb-4">Weekly Incident Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="incidents" stroke="hsl(221,83%,53%)" strokeWidth={2} dot={{ fill: 'hsl(221,83%,53%)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <h2 className="font-display font-semibold text-foreground mb-4">Peak Incident Hours</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPeakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(38,92%,50%)" fill="hsl(38,92%,50%)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {(selectedType || selectedDay) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="bg-card rounded-xl border border-border p-5 card-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-semibold text-foreground">
                    {selectedType
                      ? `${typeLabels[selectedType] || selectedType} incidents`
                      : `Response detail · ${selectedDay}`}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedType
                      ? `${filteredIncidents.length} matching ${filteredIncidents.length === 1 ? 'incident' : 'incidents'}`
                      : 'Sample incidents that contributed to this day’s average'}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedType(null); setSelectedDay(null); }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              {selectedType ? (
                filteredIncidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incidents recorded for this category yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {filteredIncidents.map((e) => (
                      <Link
                        key={e.id} to={`/emergencies/${e.id}`}
                        className="block p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">{e.title}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-muted text-muted-foreground capitalize">
                            {e.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {e.location}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground">Avg response</div>
                    <div className="font-display text-xl font-bold mt-1">
                      {mockResponseTimes.find((r) => r.day === selectedDay)?.avg} min
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground">Incidents handled</div>
                    <div className="font-display text-xl font-bold mt-1">{Math.floor(Math.random() * 6) + 4}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground">SLA met</div>
                    <div className="font-display text-xl font-bold mt-1">{Math.floor(Math.random() * 10) + 88}%</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
