import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Lock, Mail, ArrowRight, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { TagChip } from '../components/TagChip';

export function Login() {
  const { login, signup, forgotPassword, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Mode: 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'RESET'
  const [mode, setMode] = useState('LOGIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validation feedback
    if (!email || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (mode === 'LOGIN' && !password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'SIGNUP' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'SIGNUP' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'SIGNUP') {
        await signup({ email, password, fullName });
        navigate('/');
      } else if (mode === 'LOGIN') {
        await login({ email, password });
        navigate('/');
      } else if (mode === 'FORGOT') {
        await forgotPassword(email);
        setSuccessMsg(`Password reset instructions sent to ${email}. Check your inbox or console output.`);
      } else if (mode === 'RESET') {
        await resetPassword({ token, newPassword });
        setSuccessMsg('Password successfully reset. You may now sign in.');
        setMode('LOGIN');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Authentication request failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    setMode('LOGIN');
    setError(null);
    setSuccessMsg(null);
    if (role === 'admin') {
      setEmail('admin@assetflow.com');
      setPassword('Admin@123');
    } else if (role === 'manager') {
      setEmail('manager@assetflow.com');
      setPassword('Manager@123');
    } else if (role === 'head') {
      setEmail('head@assetflow.com');
      setPassword('Head@123');
    } else {
      setEmail('employee@assetflow.com');
      setPassword('Employee@123');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-6">
      {/* Top Bar with Theme Toggle & System Status */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <TagChip status="AVAILABLE" label="SYSTEM ONLINE" />
          <span className="text-xs font-mono text-textSecondary hidden sm:inline">
            ENTERPRISE ASSET MANAGEMENT v1.0
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-[6px] border border-border bg-surface text-textSecondary hover:text-textPrimary transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-surface border border-border rounded-[8px] p-8 shadow-xl">
          {/* Brand Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-6 bg-accent rounded-sm" />
              <h1 className="font-display font-bold text-2xl text-textPrimary tracking-tight">
                AssetFlow
              </h1>
            </div>
            <p className="text-xs font-mono text-textSecondary">
              {mode === 'LOGIN' && 'Sign in to access corporate equipment & resource portal'}
              {mode === 'SIGNUP' && 'Create an Employee portal account (Role assigned by Admin)'}
              {mode === 'FORGOT' && 'Enter your email to receive password reset instructions'}
              {mode === 'RESET' && 'Enter reset token and your new password'}
            </p>
          </div>

          {/* Quick Demo Credentials Panel */}
          {mode === 'LOGIN' && (
            <div className="mb-6 p-3 rounded-[6px] bg-surfaceAlt border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-textSecondary font-bold">
                  Demo Quick Fill Roles:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-left text-textPrimary hover:border-accent transition-colors"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('manager')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-left text-textPrimary hover:border-accent transition-colors"
                >
                  📦 Asset Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('head')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-left text-textPrimary hover:border-accent transition-colors"
                >
                  🏢 Department Head
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('employee')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-left text-textPrimary hover:border-accent transition-colors"
                >
                  👤 Employee
                </button>
              </div>
            </div>
          )}

          {/* Alert Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-[6px] bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-mono">
              ⚠ {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-[6px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'SIGNUP' && (
              <div>
                <label className="block text-xs font-mono uppercase text-textSecondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3.5 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-textSecondary mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-textSecondary absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@assetflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] pl-10 pr-3.5 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {['LOGIN', 'SIGNUP', 'RESET'].includes(mode) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono uppercase text-textSecondary">
                    {mode === 'RESET' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('FORGOT');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-mono text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={mode === 'RESET' ? newPassword : password}
                    onChange={(e) =>
                      mode === 'RESET'
                        ? setNewPassword(e.target.value)
                        : setPassword(e.target.value)
                    }
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] pl-10 pr-3.5 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            {mode === 'RESET' && (
              <div>
                <label className="block text-xs font-mono uppercase text-textSecondary mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste token from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3.5 py-2.5 text-sm font-mono text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[6px] bg-accent text-bg font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>PROCESSING...</span>
              ) : (
                <>
                  {mode === 'LOGIN' && (
                    <>
                      <span>SIGN IN TO PORTAL</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {mode === 'SIGNUP' && (
                    <>
                      <span>CREATE EMPLOYEE ACCOUNT</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                  {mode === 'FORGOT' && <span>SEND RESET LINK</span>}
                  {mode === 'RESET' && <span>RESET PASSWORD</span>}
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-textSecondary">
            {mode === 'LOGIN' ? (
              <>
                <span>New employee?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGNUP');
                    setError(null);
                  }}
                  className="text-accent hover:underline font-bold"
                >
                  Sign up for access →
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="text-accent hover:underline font-bold"
                >
                  ← Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer Security Notice */}
      <div className="max-w-4xl mx-auto w-full text-center text-[11px] font-mono text-textSecondary">
        RBAC ENFORCED · AUDIT READY · POSTGRES EXCLUDE OVERLAP CONSTRAINTS
      </div>
    </div>
  );
}

export default Login;
