import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="w-full max-w-sm bg-[#161B22] border border-[#262C36] rounded-md p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#E6E8EB]">Sign in to UpBro</h1>
          <p className="text-xs text-[#8B94A3]">Enter your credentials to access the instrument panel.</p>
        </div>

        {error && (
          <div className="bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-xs px-3 py-2 rounded font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs text-[#8B94A3]">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[#8B94A3]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0E1116] border border-[#262C36] rounded text-[#E6E8EB] text-xs font-mono focus:outline-none focus:border-[#E8A33D]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#E8A33D] hover:bg-[#D9942E] text-[#0E1116] font-semibold text-xs rounded transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign in'}
          </button>
        </form>

        <div className="text-xs text-[#8B94A3] border-t border-[#262C36] pt-4">
          Need an account?{' '}
          <Link to="/register" className="text-[#E8A33D] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
