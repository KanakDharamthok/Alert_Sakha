import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Shield, FileText, ExternalLink, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: 'staff' | 'manager' | 'security' | 'guest';
  approval_status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  hotel_name: string | null;
  employee_id: string | null;
  business_license_number: string | null;
  organization_name: string | null;
  id_proof_url: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roleLabel: Record<string, string> = {
  staff: 'Hotel Staff',
  manager: 'Hotel Manager',
  security: 'Security Team',
  guest: 'Guest',
};

export default function AdminApprovalsPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('role_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRequests(data as RoleRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (authLoading) return null;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleApprove = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc('approve_role_request', { _request_id: id, _notes: null });
    setBusyId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Approved', description: 'User role has been updated.' });
      void load();
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc('reject_role_request', { _request_id: id, _notes: null });
    setBusyId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rejected', description: 'Request has been rejected.' });
      void load();
    }
  };

  const viewProof = async (path: string) => {
    const { data, error } = await supabase.storage.from('id-proofs').createSignedUrl(path, 60);
    if (error || !data) {
      toast({ title: 'Error', description: 'Could not open file.', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.approval_status === filter);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Role Approvals</h1>
            <p className="text-sm text-muted-foreground">Review and approve role elevation requests.</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No {filter === 'all' ? '' : filter} requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl border border-border p-5 card-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground">{r.full_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColor[r.approval_status]}`}>
                        {r.approval_status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {roleLabel[r.requested_role]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{r.email}</p>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                      {r.hotel_name && <Field label="Hotel" value={r.hotel_name} />}
                      {r.employee_id && <Field label="Employee ID" value={r.employee_id} />}
                      {r.business_license_number && <Field label="License #" value={r.business_license_number} />}
                      {r.organization_name && <Field label="Organization" value={r.organization_name} />}
                    </div>

                    {r.id_proof_url && (
                      <button
                        onClick={() => viewProof(r.id_proof_url!)}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View ID proof <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      Submitted {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>

                  {r.approval_status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={busyId === r.id}
                        onClick={() => handleApprove(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        disabled={busyId === r.id}
                        onClick={() => handleReject(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-destructive/30 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}