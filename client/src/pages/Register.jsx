import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/register', form);
      // Save to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('hasAccount', 'true');
      // Call login from AuthContext
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <h1 className="text-3xl font-bold text-[#3D4127] tracking-tight">
            Start signing documents
          </h1>
          <p className="mt-2 text-sm text-[#3D4127]/75">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-700 font-semibold hover:text-violet-600 transition duration-200">
              Sign in
            </Link>
          </p>
        </motion.div>

        {/* Error box */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-100/80 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name input field */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-[#3D4127]/75 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-xl border border-[#BAC095] bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:border-violet-600 focus:outline-none transition duration-200"
              required
            />
          </motion.div>

          {/* Email input field */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <label className="block text-sm font-medium text-[#3D4127]/75 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-[#BAC095] bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:border-violet-600 focus:outline-none transition duration-200"
              required
            />
          </motion.div>

          {/* Password input field */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label className="block text-sm font-medium text-[#3D4127]/75 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#BAC095] bg-white/80 px-4 py-3 text-sm text-[#3D4127] placeholder-slate-400 focus:border-violet-600 focus:outline-none transition duration-200"
              required
            />
          </motion.div>

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-[#3D4127] py-3.5 font-semibold text-white hover:bg-[#3D4127]/90 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}