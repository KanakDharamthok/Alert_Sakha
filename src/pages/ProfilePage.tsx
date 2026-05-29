import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Mail, Shield, Camera, Phone, IdCard, Building2, HeartPulse,
  Lock, KeyRound, ShieldCheck, Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

const roleStyles: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  manager: 'bg-primary/10 text-primary',
  security: 'bg-warning/10 text-warning',
  staff: 'bg-success/10 text-success',
  guest: 'bg-muted text-muted-foreground',
};

function SectionCard({ title, subtitle, children, delay = 0 }: {
  title: string; subtitle?: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-card rounded-xl border border-border card-shadow"
    >
      <header className="px-6 py-4 border-b border-border">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </header>
      <div className="p-6">{children}</div>
    </motion.section>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const inputDisabled = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-muted text-muted-foreground text-sm";

export default function ProfilePage() {
  const { user, session, refresh } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setEmName(user.emergency_contact_name ?? '');
    setEmPhone(user.emergency_contact_phone ?? '');
    setEmployeeId(user.employee_id ?? '');
    setDepartment(user.department ?? '');
    setAvatarUrl(user.avatar);
    setMfaEnabled(!!user.mfa_enabled);
  }, [user]);

  const initial = (name || user?.email || 'U').trim().charAt(0).toUpperCase();

  const handleAvatar = async (file: File) => {
    if (!session?.user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', session.user.id);
      if (dbErr) throw dbErr;
      setAvatarUrl(publicUrl);
      await refresh();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: name.trim(),
        phone: phone.trim() || null,
        emergency_contact_name: emName.trim() || null,
        emergency_contact_phone: emPhone.trim() || null,
        employee_id: employeeId.trim() || null,
        department: department.trim() || null,
      }).eq('user_id', session.user.id);
      if (error) throw error;
      await refresh();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      toast.success('Password updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setPwdSaving(false);
    }
  };

  const toggleMfa = async () => {
    if (!session?.user) return;
    const next = !mfaEnabled;
    setMfaEnabled(next);
    const { error } = await supabase.from('profiles').update({ mfa_enabled: next }).eq('user_id', session.user.id);
    if (error) {
      setMfaEnabled(!next);
      toast.error('Could not update MFA setting');
      return;
    }
    toast.success(next ? 'Multi-factor authentication enabled' : 'Multi-factor authentication disabled');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account details, contacts and security.</p>
        </div>

        {/* Identity */}
        <SectionCard title="Identity" subtitle="How you appear across AlertSakha">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-bold text-primary">{initial}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:opacity-90"
                aria-label="Upload profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = ''; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-semibold text-foreground truncate">{name || 'Unnamed'}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleStyles[user?.role ?? 'guest'] ?? roleStyles.guest}`}>
                  <Shield className="w-3 h-3" /> {user?.role ?? 'guest'}
                </span>
                {mfaEnabled && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                    <ShieldCheck className="w-3 h-3" /> MFA on
                  </span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Personal & contact */}
        <SectionCard title="Personal details" subtitle="Used by responders to reach you" delay={0.05}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" icon={User}>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Email" icon={Mail}>
              <input value={user?.email ?? ''} disabled className={inputDisabled} />
            </Field>
            <Field label="Contact number" icon={Phone}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 000 0000" className={inputCls} />
            </Field>
            <Field label="Role" icon={Shield}>
              <input value={user?.role ?? ''} disabled className={`${inputDisabled} capitalize`} />
            </Field>
          </div>
        </SectionCard>

        {/* Emergency contact */}
        <SectionCard title="Alternative emergency contact" subtitle="Someone we can reach if we can't reach you" delay={0.1}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact name" icon={HeartPulse}>
              <input value={emName} onChange={(e) => setEmName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact phone" icon={Phone}>
              <input value={emPhone} onChange={(e) => setEmPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </SectionCard>

        {/* Work / Role */}
        <SectionCard title="Work & department" subtitle="Helps coordinators route the right tasks to you" delay={0.15}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Employee / Citizen ID" icon={IdCard}>
              <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Assigned department" icon={Building2}>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Security, Front Desk" className={inputCls} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security settings" subtitle="Password and multi-factor authentication" delay={0.2}>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" /> Change password
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Current" icon={Lock}>
                  <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className={inputCls} />
                </Field>
                <Field label="New" icon={Lock}>
                  <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Confirm new" icon={Lock}>
                  <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handlePasswordChange} disabled={pwdSaving || !newPwd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {pwdSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update password
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Multi-factor authentication</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                    Add an extra verification step at sign-in. We'll prompt you for a code from your authenticator app.
                  </p>
                </div>
              </div>
              <button
                onClick={toggleMfa}
                role="switch" aria-checked={mfaEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${mfaEnabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${mfaEnabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
