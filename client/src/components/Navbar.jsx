import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            ⚡
          </div>
          <span className="font-bold text-lg text-slate-100 tracking-tight">API Uptime Monitor</span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-300">
              Logged in as <span className="text-indigo-400 font-semibold">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-sm font-medium bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-600/50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
