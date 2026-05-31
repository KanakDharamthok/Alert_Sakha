import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, RequestableRole } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { isDisposableEmail } from '@/lib/disposableEmails';
import { validateField, FieldName } from '@/lib/signupValidation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, BadgeCheck, FileText, Upload, MailCheck } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RequestableRole>('guest');
  // Role-specific fields
  const [hotelName, setHotelName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyPending, setVerifyPending] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName | 'confirmPassword', string>>>({});
  const { login, signup, loginWithGoogle, resendVerification, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const setFieldErr = (key: FieldName | 'confirmPassword', msg?: string) =>
    setFieldErrors(prev => ({ ...prev, [key]: msg }));

  const handleBlur = (key: FieldName, value: string) => {
    if (!isSignUp) return;
    setFieldErr(key, validateField(key, value));
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-destructive mt-1.5 ml-1">{msg}</p> : null;

  // Once a session lands (e.g. after Google redirect), bounce to the dashboard.
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const roles: { value: RequestableRole; label: string; hint: string }[] = [
    { value: 'guest', label: 'Guest / User', hint: 'No approval required' },
    { value: 'staff', label: 'Hotel Staff', hint: 'Requires admin approval' },
    { value: 'manager', label: 'Hotel Manager', hint: 'Requires admin approval' },
    { value: 'security', label: 'Security Team', hint: 'Requires admin approval + ID proof' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifyPending(null);

    if (isSignUp) {
      const errs: Partial<Record<FieldName | 'confirmPassword', string>> = {};
      errs.name = validateField('name', name);
      errs.email = validateField('email', email);
      if (!errs.email && isDisposableEmail(email)) {
        errs.email = 'Please use a valid, permanent email address. Temporary domains are not permitted for security reasons.';
      }
      errs.password = validateField('password', password);
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

      if (role === 'staff' || role === 'manager') errs.hotelName = validateField('hotelName', hotelName);
      if (role === 'staff') errs.employeeId = validateField('employeeId', employeeId);
      if (role === 'manager') errs.businessLicense = validateField('businessLicense', businessLicense);
      if (role === 'security') {
        errs.organizationName = validateField('organizationName', organizationName);
        if (!idProofFile) setError('Please upload an ID proof (PDF or image).');
        else if (idProofFile.size > 5 * 1024 * 1024) setError('ID proof must be under 5MB.');
      }

      // Strip undefined entries
      const cleaned = Object.fromEntries(Object.entries(errs).filter(([, v]) => v)) as typeof errs;
      setFieldErrors(cleaned);
      if (Object.keys(cleaned).length > 0) return;
      if (role === 'security' && (!idProofFile || idProofFile.size > 5 * 1024 * 1024)) return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { requiresEmailConfirmation } = await signup(name, email, password, {
          requested_role: role,
          hotel_name: role === 'staff' || role === 'manager' ? hotelName : undefined,
          employee_id: role === 'staff' ? employeeId : undefined,
          business_license_number: role === 'manager' ? businessLicense : undefined,
          organization_name: role === 'security' ? organizationName : undefined,
        });

        // Upload ID proof after signup so we have an authenticated session.
        if (role === 'security' && idProofFile) {
          const { data: sessionData } = await supabase.auth.getSession();
          const uid = sessionData.session?.user.id;
          if (uid) {
            const ext = idProofFile.name.split('.').pop() || 'bin';
            const path = `${uid}/id-proof-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from('id-proofs')
              .upload(path, idProofFile, { upsert: false });
            if (!upErr) {
              await supabase
                .from('role_requests')
                .update({ id_proof_url: path })
                .eq('user_id', uid);
            }
          }
        }

        if (requiresEmailConfirmation) {
          // Show the verify-your-email screen and wait for the user to click the link.
          setVerifyPending(email);
        } else {
          // Session already active (confirmation disabled) — go straight in.
          toast.success('Welcome to AlertSakha', { description: `Account created for ${email}.` });
          navigate('/dashboard');
        }
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'email_not_confirmed') {
        // User tried to sign in before verifying.
        setError('Email not verified. Please verify your email address first.');
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(message);
    }
  };

  const handleResend = async () => {
    if (!verifyPending) return;
    setResending(true);
    try {
      await resendVerification(verifyPending);
      toast.success('Verification email re-sent', { description: `Check the inbox for ${verifyPending}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resend email.';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="AlertSakha" className="w-14 h-14 rounded-2xl object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">AlertSakha</h1>
          <p className="text-muted-foreground text-sm mt-1">Rapid Crisis Response System</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl card-shadow-lg border border-border p-8">
          {verifyPending ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <MailCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">Verification email sent!</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Please check your inbox at <span className="text-foreground font-medium">{verifyPending}</span> and
                  click the verification link to activate your account.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button" onClick={handleResend} disabled={resending}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend verification email'}
                </button>
                <button
                  type="button"
                  onClick={() => { setVerifyPending(null); setIsSignUp(false); }}
                  className="w-full py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </motion.div>
          ) : (
          <>
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${!isSignUp ? 'bg-card text-foreground card-shadow' : 'text-muted-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isSignUp ? 'bg-card text-foreground card-shadow' : 'text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Google button */}
          <button type="button" onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text" placeholder="Full name (letters only)" value={name}
                    onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErr('name', validateField('name', e.target.value)); }}
                    onBlur={e => handleBlur('name', e.target.value)} required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.name ? 'border-destructive' : 'border-input'}`}
                  />
                </div>
                <FieldError msg={fieldErrors.name} />
              </div>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email" placeholder="Email address" value={email}
                  onChange={e => {
                    const v = e.target.value;
                    setEmail(v);
                    if (fieldErrors.email) {
                      const zErr = validateField('email', v);
                      setFieldErr('email', zErr ?? (isSignUp && isDisposableEmail(v) ? 'Please use a valid, permanent email address. Temporary domains are not permitted for security reasons.' : undefined));
                    }
                  }}
                  onBlur={e => {
                    if (!isSignUp) return;
                    const zErr = validateField('email', e.target.value);
                    setFieldErr('email', zErr ?? (isDisposableEmail(e.target.value) ? 'Please use a valid, permanent email address. Temporary domains are not permitted for security reasons.' : undefined));
                  }} required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.email ? 'border-destructive' : 'border-input'}`}
                />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'} placeholder={isSignUp ? 'Password (8+ chars, letters & numbers)' : 'Password'} value={password}
                  onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErr('password', validateField('password', e.target.value)); }}
                  onBlur={e => handleBlur('password', e.target.value)} required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.password ? 'border-destructive' : 'border-input'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {isSignUp && <FieldError msg={fieldErrors.password} />}
            </div>

            {isSignUp && (
              <>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password" placeholder="Confirm password" value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErr('confirmPassword', e.target.value === password ? undefined : 'Passwords do not match'); }}
                      onBlur={e => setFieldErr('confirmPassword', e.target.value === password ? undefined : 'Passwords do not match')} required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.confirmPassword ? 'border-destructive' : 'border-input'}`}
                    />
                  </div>
                  <FieldError msg={fieldErrors.confirmPassword} />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Select Role</label>
                  <div className="space-y-2">
                    {roles.map(r => (
                      <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${role === r.value ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === r.value ? 'border-primary' : 'border-muted-foreground'}`}>
                          {role === r.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <input
                          type="radio" name="role" className="sr-only"
                          checked={role === r.value}
                          onChange={() => setRole(r.value)}
                        />
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.hint}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Role-specific fields */}
                {(role === 'staff' || role === 'manager') && (
                  <div>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text" placeholder="Hotel name" value={hotelName}
                        onChange={e => { setHotelName(e.target.value); if (fieldErrors.hotelName) setFieldErr('hotelName', validateField('hotelName', e.target.value)); }}
                        onBlur={e => handleBlur('hotelName', e.target.value)} required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.hotelName ? 'border-destructive' : 'border-input'}`}
                      />
                    </div>
                    <FieldError msg={fieldErrors.hotelName} />
                  </div>
                )}

                {role === 'staff' && (
                  <div>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text" placeholder="Employee ID (letters, numbers, - _ /)" value={employeeId}
                        onChange={e => { setEmployeeId(e.target.value); if (fieldErrors.employeeId) setFieldErr('employeeId', validateField('employeeId', e.target.value)); }}
                        onBlur={e => handleBlur('employeeId', e.target.value)} required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.employeeId ? 'border-destructive' : 'border-input'}`}
                      />
                    </div>
                    <FieldError msg={fieldErrors.employeeId} />
                  </div>
                )}

                {role === 'manager' && (
                  <div>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text" placeholder="Business license number" value={businessLicense}
                        onChange={e => { setBusinessLicense(e.target.value); if (fieldErrors.businessLicense) setFieldErr('businessLicense', validateField('businessLicense', e.target.value)); }}
                        onBlur={e => handleBlur('businessLicense', e.target.value)} required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.businessLicense ? 'border-destructive' : 'border-input'}`}
                      />
                    </div>
                    <FieldError msg={fieldErrors.businessLicense} />
                  </div>
                )}

                {role === 'security' && (
                  <>
                    <div>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text" placeholder="Organization name" value={organizationName}
                          onChange={e => { setOrganizationName(e.target.value); if (fieldErrors.organizationName) setFieldErr('organizationName', validateField('organizationName', e.target.value)); }}
                          onBlur={e => handleBlur('organizationName', e.target.value)} required
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.organizationName ? 'border-destructive' : 'border-input'}`}
                        />
                      </div>
                      <FieldError msg={fieldErrors.organizationName} />
                    </div>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-input cursor-pointer hover:bg-accent transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground flex-1 truncate">
                        {idProofFile ? idProofFile.name : 'Upload ID proof (PDF or image, max 5MB)'}
                      </span>
                      <input
                        type="file" accept="image/*,application/pdf" className="sr-only"
                        onChange={e => setIdProofFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </>
                )}

                {role !== 'guest' && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    Your account will start as a Guest. An admin will review your request and grant elevated access.
                  </p>
                )}
              </>
            )}

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm">
                {error}
              </motion.p>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-input text-primary focus:ring-ring" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-primary font-medium hover:underline">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
