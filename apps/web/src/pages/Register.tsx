import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';

export function Register() {
  const { register, sendOTP, verifyOTP } = useAuth();
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isBn = locale === 'bn';

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpType, setOtpType] = useState<'register' | 'login'>('register');

  const isEmail = identifier.includes('@');
  const isPhone = /^\+?8801\d{9}$/.test(identifier.replace(/\s/g, ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'password') {
      if (password !== confirmPassword) {
        showToast('error', t('validation.password_match'));
        return;
      }
      if (password.length < 8) {
        showToast('error', t('validation.password_min'));
        return;
      }
    }

    setLoading(true);

    if (mode === 'password') {
      const result = await register({
        email: isEmail ? identifier : undefined,
        phone: isPhone ? identifier : undefined,
        password,
        name: name || undefined,
      });
      if (result.success) {
        showToast('success', t('auth.register_success'));
        navigate(isBn ? '/bn' : '/');
      } else {
        showToast('error', result.error || 'Registration failed');
      }
    } else {
      const result = await verifyOTP(identifier, otp, otpType);
      if (result.success) {
        showToast('success', t('auth.register_success'));
        navigate(isBn ? '/bn' : '/');
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
    if (!isEmail && !isPhone) {
      showToast('error', 'Please enter a valid email or Bangladeshi phone number');
      return;
    }
    setLoading(true);
    const result = await sendOTP(identifier, 'register');
    if (result.success) {
      setOtpSent(true);
      setOtpType('register');
      showToast('success', `${t('auth.otp_sent')} ${identifier}`);
    } else {
      showToast('error', result.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.register')}</h1>
        <p className="auth-subtitle">Create your account to start shopping</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">{t('auth.name')}</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email_or_phone')} *</label>
            <input
              type="text"
              className="form-input"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="email@example.com or +8801XXXXXXXXX"
              required
              autoComplete={isEmail ? 'email' : 'tel'}
            />
          </div>

          {mode === 'password' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('auth.password')} *</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('auth.confirm_password')} *</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
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
                {mode === 'password' ? 'Creating account...' : 'Verifying...'}
              </>
            ) : mode === 'password' ? (
              t('auth.register')
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
              onClick={() => { setMode('otp'); setPassword(''); setConfirmPassword(''); }}
              className="btn btn-outline btn-block"
            >
              Register with OTP
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('password'); setOtp(''); setOtpSent(false); }}
              className="btn btn-outline btn-block"
            >
              Register with Password
            </button>
          )}

          {mode === 'otp' && !otpSent && (
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || !identifier || (!isEmail && !isPhone)}
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
          {t('auth.already_have_account')} {' '}
          <Link to={isBn ? '/bn/login' : '/login'} className="font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}