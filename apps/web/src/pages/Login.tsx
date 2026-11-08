import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';

export function Login() {
  const { login, sendOTP, verifyOTP } = useAuth();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBn = locale === 'bn';

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpType, setOtpType] = useState<'login' | 'register'>('login');

  const redirectTo = searchParams.get('redirect') || (isBn ? '/bn' : '/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'password') {
      const result = await login(identifier, password);
      if (result.success) {
        showToast('success', t('auth.login_success'));
        navigate(redirectTo);
      } else {
        showToast('error', result.error || t('auth.invalid_otp'));
      }
    } else {
      const result = await verifyOTP(identifier, otp, otpType);
      if (result.success) {
        showToast('success', t('auth.login_success'));
        navigate(redirectTo);
      } else {
        showToast('error', result.error || t('auth.invalid_otp'));
      }
    }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!identifier) {
      showToast('error', 'Please enter your email or phone');
      return;
    }
    setLoading(true);
    const result = await sendOTP(identifier, 'login');
    if (result.success) {
      setOtpSent(true);
      setOtpType('login');
      showToast('success', `${t('auth.otp_sent')} ${identifier}`);
    } else {
      showToast('error', result.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.login')}</h1>
        <p className="auth-subtitle">Welcome back! Please sign in to your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">{t('auth.email_or_phone')} *</label>
            <input
              type="text"
              className="form-input"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="email@example.com or +8801XXXXXXXXX"
              required
              autoComplete="email"
            />
          </div>

          {mode === 'password' && (
            <div className="form-group">
              <label className="form-label">{t('auth.password')} *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          )}

          {mode === 'otp' && (
            <div className="form-group">
              <label className="form-label">{t('auth.otp')} *</label>
              <input
                type="text"
                className="form-input text-center text-2xl tracking-widest"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="000000"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-2">
            {loading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                {mode === 'password' ? 'Signing in...' : 'Verifying...'}
              </>
            ) : mode === 'password' ? (
              t('auth.login')
            ) : (
              t('auth.verify_otp')
            )}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <div className="space-y-3">
          {mode === 'password' ? (
            <button
              type="button"
              onClick={() => { setMode('otp'); setPassword(''); }}
              className="btn btn-outline btn-block"
            >
              Login with OTP
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('password'); setOtp(''); setOtpSent(false); }}
              className="btn btn-outline btn-block"
            >
              Login with Password
            </button>
          )}

          {mode === 'otp' && !otpSent && (
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || !identifier}
              className="btn btn-secondary btn-block"
            >
              {loading ? 'Sending...' : t('auth.send_otp')}
            </button>
          )}

          {mode === 'otp' && otpSent && (
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="btn btn-secondary btn-block"
            >
              {loading ? 'Resending...' : t('auth.resend_otp')}
            </button>
          )}
        </div>

        <p className="auth-footer">
          {t('auth.dont_have_account')} {' '}
          <Link to={isBn ? '/bn/register' : '/register'} className="font-medium">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}