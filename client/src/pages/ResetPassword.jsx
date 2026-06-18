import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Too short', color: 'bg-red-400' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-emerald-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ];
  return { score, ...levels[score] };
};

const STATUS = {
  IDLE: 'idle',
  SUCCESS: 'success',
  EXPIRED: 'expired',
  INVALID: 'invalid',
};

export default function ResetPassword() {
  const { token } = useParams();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(STATUS.IDLE);
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(form.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.newPassword) {
      newErrors.newPassword = 'Password is required.';
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters.';
    } else if (passwordStrength.score < 2) {
      newErrors.newPassword = 'Password is too weak. Add uppercase letters, numbers, or symbols.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, {
        newPassword: form.newPassword,
      });
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      const data = err.response?.data;
      if (data?.expired) {
        setStatus(STATUS.EXPIRED);
      } else {
        setStatus(STATUS.INVALID);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#BAC095] flex items-center justify-center px-4">
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/30 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[#BAC095] bg-white/60 p-8 backdrop-blur-lg shadow-2xl"
      >

        {/* ── IDLE — reset form ───────────────────────────────────── */}
        {status === STATUS.IDLE && (
          <>
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3D4127]/10">
                <svg className="h-8 w-8 text-[#3D4127]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#3D4127] tracking-tight">
                Set a new password
              </h1>
              <p className="mt-2 text-sm text-[#3D4127]/70">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate className="space-y-5">
              {/* New password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#3D4127]/75 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:outline-none transition duration-200 ${
                    errors.newPassword
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#BAC095] focus:border-violet-600'
                  }`}
                />

                {/* Strength bar */}
                {form.newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-[#3D4127]/15'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? 'text-red-500'
                      : passwordStrength.score === 2 ? 'text-amber-600'
                      : 'text-emerald-600'
                    }`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}

                {errors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#3D4127]/75 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:outline-none transition duration-200 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:border-red-500'
                      : form.confirmPassword && form.newPassword === form.confirmPassword
                      ? 'border-emerald-400'
                      : 'border-[#BAC095] focus:border-violet-600'
                  }`}
                />
                {/* Live match indicator */}
                {form.confirmPassword && (
                  <p className={`mt-1.5 text-xs font-medium ${
                    form.newPassword === form.confirmPassword
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}>
                    {form.newPassword === form.confirmPassword ? '✓ Passwords match' : 'Passwords do not match'}
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3D4127] py-3.5 font-semibold text-white hover:bg-[#3D4127]/90 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* ── SUCCESS ─────────────────────────────────────────────── */}
        {status === STATUS.SUCCESS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
            >
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-[#3D4127]">Password reset!</h1>
            <p className="mt-3 text-sm text-[#3D4127]/70 leading-relaxed">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-block w-full rounded-xl bg-[#3D4127] py-3.5 text-center font-semibold text-white hover:bg-[#3D4127]/90 transition"
            >
              Go to Sign In
            </Link>
          </motion.div>
        )}

        {/* ── EXPIRED ─────────────────────────────────────────────── */}
        {status === STATUS.EXPIRED && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#3D4127]">Link expired</h1>
            <p className="mt-3 text-sm text-[#3D4127]/70 leading-relaxed">
              This reset link has expired (links are valid for 15 minutes only).
              Request a new one from the login page.
            </p>
            <Link
              to="/forgot-password"
              className="mt-8 inline-block w-full rounded-xl bg-[#3D4127] py-3.5 text-center font-semibold text-white hover:bg-[#3D4127]/90 transition"
            >
              Request New Reset Link
            </Link>
          </motion.div>
        )}

        {/* ── INVALID ─────────────────────────────────────────────── */}
        {status === STATUS.INVALID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#3D4127]">Invalid link</h1>
            <p className="mt-3 text-sm text-[#3D4127]/70 leading-relaxed">
              This reset link is invalid or has already been used.
              Each link can only be used once.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/forgot-password"
                className="flex-1 rounded-xl bg-[#3D4127] py-3 text-center text-sm font-semibold text-white hover:bg-[#3D4127]/90 transition"
              >
                Try Again
              </Link>
              <Link
                to="/login"
                className="flex-1 rounded-xl border border-[#3D4127]/20 bg-white/60 py-3 text-center text-sm font-semibold text-[#3D4127] hover:bg-white/80 transition"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
