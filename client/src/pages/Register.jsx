import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Email format validator
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Password strength — returns { score: 0-4, label, color }
// Score breakdown: length + uppercase + number + special char
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

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Enter a valid email address (e.g. name@example.com).';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (passwordStrength.score < 2) {
      newErrors.password = 'Password is too weak. Add uppercase letters, numbers, or symbols.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await API.post('/auth/register', form);
      // Don't log in yet — user must verify email first
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F4F6] text-slate-900 antialiased flex items-center justify-center px-4">
      {/* Centered radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/20 blur-[150px]" />

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/60 p-8 backdrop-blur-lg shadow-2xl flex flex-col"
      >
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-4 py-2 text-sm text-[#2563EB] font-semibold">
            Create Account
          </span>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Start signing documents
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#2563EB] font-semibold hover:text-blue-700 transition duration-200"
            >
              Sign in
            </Link>
          </p>
        </motion.div>

        {/* Server error */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-100/80 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} autoComplete="on" noValidate className="space-y-5">

          {/* Full Name */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
              autoCapitalize="words"
              className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200 ${
                errors.name
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 focus:border-[#2563EB]'
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
            )}
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
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
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 focus:border-[#2563EB]'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-2"
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
              autoComplete="new-password"
              className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition duration-200 ${
                errors.password
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 focus:border-[#2563EB]'
              }`}
            />

            {/* Password strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  passwordStrength.score <= 1
                    ? 'text-red-500'
                    : passwordStrength.score === 2
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {passwordStrength.label}
                  {passwordStrength.score < 4 && (
                    <span className="font-normal text-slate-400 ml-1">
                      — try adding{' '}
                      {!(/[A-Z]/.test(form.password)) && 'an uppercase letter, '}
                      {!(/[0-9]/.test(form.password)) && 'a number, '}
                      {!(/[^A-Za-z0-9]/.test(form.password)) && 'a symbol'}
                    </span>
                  )}
                </p>
              </div>
            )}

            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-[#2563EB] py-3.5 font-semibold text-white hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
