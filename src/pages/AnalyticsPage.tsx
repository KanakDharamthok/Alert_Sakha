import AppLayout from '@/components/layout/AppLayout';
import { useEmergencyStore } from '@/store/emergencyStore';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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

  const typeCounts = emergencies.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: typeLabels[type] || type, value: count,
  }));

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
            <h2 className="font-display font-semibold text-foreground mb-4">Incident Types</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <h2 className="font-display font-semibold text-foreground mb-4">Avg Response Time (min)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockResponseTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="hsl(221,83%,53%)" radius={[6, 6, 0, 0]} />
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
      </div>
    </AppLayout>
  );
}
