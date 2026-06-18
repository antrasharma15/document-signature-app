import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Validates email format — catches most invalid emails before hitting the server
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});  // field-level errors (email/password)
  const [serverError, setServerError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear the field error as the user starts correcting it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Run validation before submitting — returns true if all fields pass
  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Enter a valid email address (e.g. name@example.com).';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Stop here if frontend validation fails
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('hasAccount', 'true');
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      // Special case: account exists but email not verified yet
      if (data?.unverified) {
        setServerError(
          'Your email is not verified yet. Check your inbox or '
        );
        setUnverifiedEmail(form.email);
      } else {
        setServerError(data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#BAC095] text-[#3D4127] antialiased flex items-center justify-center px-4">
      {/* Centered radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/30 blur-[150px]" />

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[#BAC095] bg-white/60 p-8 backdrop-blur-lg shadow-2xl flex flex-col"
      >
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="rounded-full border border-[#3D4127]/20 bg-white/40 px-4 py-2 text-sm text-[#3D4127] font-semibold">
            Welcome Back!
          </span>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-[#3D4127] tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-[#3D4127]/75">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-violet-700 font-semibold hover:text-violet-600 transition duration-200"
            >
              Register here
            </Link>
          </p>
        </motion.div>

        {/* Server error box */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-100/80 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
            {unverifiedEmail && (
              <button
                type="button"
                onClick={() => navigate('/check-email', { state: { email: unverifiedEmail } })}
                className="underline font-semibold ml-1 hover:text-red-900 transition cursor-pointer"
              >
                resend verification email.
              </button>
            )}
          </motion.div>
        )}

        {/*
          autoComplete="on" on the form tells the browser this is a
          credential form it should offer to save/autofill
        */}
        <form onSubmit={handleSubmit} autoComplete="on" noValidate className="space-y-6">

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#3D4127]/75 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              autoComplete="username"       // tells browser: this is the login identifier
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:outline-none transition duration-200 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-[#BAC095] focus:border-violet-600'
              }`}
            />
            {/* Inline field error */}
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#3D4127]/75 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"  // tells browser: this is the password to save/autofill
              className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:outline-none transition duration-200 ${
                errors.password
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-[#BAC095] focus:border-violet-600'
              }`}
            />
            <div className="flex justify-end mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-violet-700 hover:text-violet-600 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-[#3D4127] py-3.5 font-semibold text-white hover:bg-[#3D4127]/90 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
