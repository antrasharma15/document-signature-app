import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import API from '../api/axios';

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || '';

  const [resent, setResent] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendError('');
    try {
      await API.post('/auth/resend-verification', { email });
      setResent(true);
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#BAC095] flex items-center justify-center px-4">
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/30 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[#BAC095] bg-white/60 p-10 backdrop-blur-lg shadow-2xl text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#3D4127]/10"
        >
          <svg className="h-10 w-10 text-[#3D4127]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </motion.div>

        <h1 className="text-2xl font-bold text-[#3D4127] tracking-tight">
          Check your email
        </h1>

        <p className="mt-3 text-sm text-[#3D4127]/70 leading-relaxed">
          We sent a verification link to{' '}
          {email && (
            <span className="font-semibold text-[#3D4127]">{email}</span>
          )}
          . Click the link in the email to activate your account.
        </p>

        <p className="mt-2 text-xs text-[#3D4127]/50">
          The link expires in 24 hours. Check your spam folder if you don't see it.
        </p>

        {/* Resend section */}
        <div className="mt-8 border-t border-[#3D4127]/10 pt-6">
          {resent ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-emerald-700"
            >
              ✓ Verification email resent — check your inbox.
            </motion.p>
          ) : (
            <>
              <p className="text-xs text-[#3D4127]/50 mb-3">Didn't receive the email?</p>
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="rounded-xl border border-[#3D4127]/20 bg-white/60 px-5 py-2.5 text-sm font-semibold text-[#3D4127] hover:bg-white/80 transition duration-200 disabled:opacity-50 cursor-pointer"
              >
                {resending ? 'Resending...' : 'Resend verification email'}
              </button>
              {resendError && (
                <p className="mt-2 text-xs text-red-600">{resendError}</p>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-[#3D4127]/40">
          Wrong email?{' '}
          <Link to="/register" className="text-violet-700 font-semibold hover:text-violet-600 transition">
            Register again
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
