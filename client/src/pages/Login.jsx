import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const res = await API.post('/auth/login', form);
      // Save to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('hasAccount', 'true');
      // Call login from AuthContext
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-4">
      {/* Centered pink radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-[150px]" />

      {/* Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-pink-500/20 bg-zinc-900/80 p-8 backdrop-blur-lg shadow-2xl flex flex-col"
      >
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-sm text-pink-400">
            Welcome Back !
          </span>
        </div>

        {/* Headings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-pink-400 font-semibold hover:text-pink-300 transition duration-200">
              Register here
            </Link>
          </p>
        </motion.div>

        {/* Error box */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input field */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-pink-500 focus:outline-none transition duration-200"
              required
            />
          </motion.div>

          {/* Password input field */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-pink-500 focus:outline-none transition duration-200"
              required
            />
          </motion.div>

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-pink-500 py-3.5 font-semibold text-black hover:bg-pink-600 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}