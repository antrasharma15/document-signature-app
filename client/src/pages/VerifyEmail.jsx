import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';

// Three states this page can be in
const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  EXPIRED: 'expired',
  INVALID: 'invalid',
};

// Global promise cache to deduplicate concurrent verification requests (fixes React 18 Strict Mode remount issues)
const verificationPromises = {};

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState(STATUS.LOADING);
  const [resent, setResent] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (!verificationPromises[token]) {
      verificationPromises[token] = API.get(`/auth/verify/${token}`);
    }

    const verify = async () => {
      try {
        await verificationPromises[token];
        setStatus(STATUS.SUCCESS);
      } catch (err) {
        const data = err.response?.data;
        if (data?.expired) {
          setStatus(STATUS.EXPIRED);
        } else {
          setStatus(STATUS.INVALID);
        }
      }
    };
    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await API.post('/auth/resend-verification', { email: resendEmail });
      setResent(true);
    } catch {
      // Silently succeed — don't reveal if email exists
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F4F6] flex items-center justify-center px-4">
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/20 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/60 p-10 backdrop-blur-lg shadow-2xl text-center"
      >

        {/* LOADING */}
        {status === STATUS.LOADING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-12 w-12 rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB] animate-spin" />
            <p className="text-sm text-slate-600">Verifying your email address...</p>
          </motion.div>
        )}

        {/* SUCCESS */}
        {status === STATUS.SUCCESS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
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

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Email verified!
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Your account is now active. You can sign in and start using EASYsign.
            </p>
            <Link
              to="/login"
              className="mt-8 inline-block w-full rounded-xl bg-[#2563EB] py-3.5 font-semibold text-white hover:bg-blue-700 transition duration-200"
            >
              Go to Sign In
            </Link>
          </motion.div>
        )}

        {/* EXPIRED */}
        {status === STATUS.EXPIRED && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Link expired</h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              This verification link has expired. Enter your email below and we'll send you a new one.
            </p>

            {resent ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-sm font-medium text-emerald-700"
              >
                ✓ New verification link sent — check your inbox.
              </motion.p>
            ) : (
              <div className="mt-6 w-full space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Your email address"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none transition"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  className="w-full rounded-xl bg-[#2563EB] py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* INVALID */}
        {status === STATUS.INVALID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Invalid link</h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              This verification link is invalid or has already been used. If you already verified your account, you can sign in directly.
            </p>
            <div className="mt-8 flex gap-3 w-full">
              <Link
                to="/login"
                className="flex-1 rounded-xl bg-[#2563EB] py-3 text-center font-semibold text-white hover:bg-blue-700 transition text-sm"
              >
                Go to Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-xl border border-slate-200 bg-white/60 py-3 text-center font-semibold text-slate-800 hover:bg-white/80 transition text-sm"
              >
                Register again
              </Link>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
