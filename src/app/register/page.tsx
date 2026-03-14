'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { apiClient } from '@/lib/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiClient.post('/api/auth/register', { name, email, password });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][pwStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex justify-end p-4"><ThemeToggle /></div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--accent)' }}>
              <CheckSquare size={22} color="#fff" />
            </div>
            <h1 className="text-xl font-semibold">Create an account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start managing your tasks today</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                <input type="text" className="input-base" placeholder="Your name"
                  value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input type="email" className="input-base" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input-base pr-10"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= pwStrength ? strengthColor : 'var(--border)' }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
