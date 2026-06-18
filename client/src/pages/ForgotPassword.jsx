import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      // Always show the same success screen regardless of whether
      // the email exists — this prevents email enumeration attacks
      setSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Try again.');
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
        {!submitted ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3D4127]/10">
                <svg className="h-8 w-8 text-[#3D4127]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#3D4127] tracking-tight">
                Forgot your password?
              </h1>
              <p className="mt-2 text-sm text-[#3D4127]/70 leading-relaxed">
                No worries. Enter your email and we'll send you a reset link.
                The link expires in <strong>15 minutes</strong>.
              </p>
            </div>

            {serverError && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-100/80 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="on" noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#3D4127]/75 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="email@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:outline-none transition duration-200 ${
                    emailError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#BAC095] focus:border-violet-600'
                  }`}
                />
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-600">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3D4127] py-3.5 font-semibold text-white hover:bg-[#3D4127]/90 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#3D4127]/60">
              Remembered it?   
              <Link to="/login" className="text-violet-700 font-semibold hover:text-violet-600 transition ml-1">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          /* Success state — same screen whether email exists or not */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
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
              If an account exists for{' '}
              <span className="font-semibold text-[#3D4127]">{email}</span>,
              we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <p className="mt-2 text-xs text-[#3D4127]/50">
              The link expires in 15 minutes.
            </p>

            <Link
              to="/login"
              className="mt-8 inline-block w-full rounded-xl bg-[#3D4127] py-3.5 text-center font-semibold text-white hover:bg-[#3D4127]/90 transition duration-200"
            >
              Back to Sign In
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
