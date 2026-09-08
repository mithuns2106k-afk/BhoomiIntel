import React, { useState } from 'react';
import { Building2, ShieldCheck, Eye, EyeOff, ArrowRight, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('public');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        result = await api.register({ name, email, password, role, designation });
      } else {
        result = await api.login(email, password);
      }
      onLogin(result.user);
    } catch (err) {
      setError(err.message || (mode === 'register' ? 'Unable to create account.' : 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(37,99,235,0.16),_transparent_35%)]" />
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/95 shadow-2xl relative">
        <section className="hidden lg:flex p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-emerald-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-xl">BhoomiIntel</div>
                <div className="text-xs text-slate-400">Land Governance Intelligence</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Evidence → Insight → Decision
            </div>
            <h1 className="text-4xl font-bold leading-tight">AI-powered research and policy intelligence for land governance.</h1>
            <p className="text-slate-400 mt-5 leading-7">
              Create a secure platform account to search evidence, explore district-level GIS indicators, and use decision-support tools based on your role.
            </p>
          </div>
          <div className="text-xs text-slate-500 flex gap-2 items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Your password is protected by server-side hashing. AI outputs are clearly labeled.
          </div>
        </section>

        <section className="p-7 sm:p-10 bg-white text-slate-900">
          <div className="lg:hidden flex items-center justify-between gap-3 mb-8">
            <button onClick={onBack} className="text-xs font-semibold text-blue-700">← Back to website</button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
              <div><div className="font-bold text-lg">BhoomiIntel</div><div className="text-xs text-slate-500">Land Governance Intelligence</div></div>
            </div>
          </div>
          <button onClick={onBack} className="hidden lg:inline-flex text-xs font-semibold text-blue-700 hover:text-blue-900 mb-5">← Back to website</button>

          <div className="flex rounded-xl bg-slate-100 p-1 mb-7">
            <button onClick={() => switchMode('login')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              <LogIn className="w-4 h-4" /> Sign in
            </button>
            <button onClick={() => switchMode('register')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              <UserPlus className="w-4 h-4" /> Create account
            </button>
          </div>

          <div className="mb-7">
            <p className="text-sm font-semibold text-blue-700">{mode === 'register' ? 'New platform account' : 'Secure platform access'}</p>
            <h2 className="text-3xl font-bold mt-1">{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="text-sm text-slate-500 mt-2">
              {mode === 'register' ? 'Use your own credentials. Your account is stored securely in the BhoomiIntel database.' : 'Sign in with the email and password you registered with.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="text-sm font-semibold">Full name</span>
                  <input value={name} onChange={e => setName(e.target.value)} type="text" autoComplete="name" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Role</span>
                  <select value={role} onChange={e => setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="public">Public Viewer</option>
                    <option value="researcher">Researcher</option>
                    <option value="policymaker">Policymaker</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">For a production deployment, elevated institutional roles should be approved by an administrator.</span>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Designation <span className="font-normal text-slate-400">(optional)</span></span>
                  <input value={designation} onChange={e => setDesignation(e.target.value)} type="text" autoComplete="organization-title" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              </>
            )}

            <label className="block">
              <span className="text-sm font-semibold">Email</span>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Password</span>
              <div className="relative mt-2">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} required className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-3.5 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              {mode === 'register' && <span className="text-[11px] text-slate-400 mt-1 block">Use at least 8 characters.</span>}
            </label>
            {mode === 'register' && (
              <label className="block">
                <span className="text-sm font-semibold">Confirm password</span>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            )}

            {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
            <button disabled={loading} className="w-full rounded-xl bg-slate-950 text-white py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60">
              {loading ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : <>{mode === 'register' ? 'Create account' : 'Continue'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
            <strong>Privacy & transparency:</strong> BhoomiIntel uses your account only to provide role-based access and maintain an audit trail for protected platform actions. Never reuse an important personal password here.
          </div>
        </section>
      </div>
    </div>
  );
}
