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
    <header className="bg-[#161B22] border-b border-[#262C36] sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-5 h-5 bg-[#E8A33D] rounded-xs flex items-center justify-center font-mono font-bold text-[#0E1116] text-xs">
            U
          </div>
          <span className="font-semibold text-base text-[#E6E8EB] tracking-tight">UpBro</span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[#8B94A3]">
              <span className="font-mono text-[#E6E8EB]">{user.name}</span> ({user.email})
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs text-[#8B94A3] hover:text-[#E6E8EB] border border-[#262C36] hover:border-[#8B94A3] rounded transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-3 py-1 text-xs text-[#8B94A3] hover:text-[#E6E8EB] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1 text-xs font-semibold bg-[#E8A33D] hover:bg-[#D9942E] text-[#0E1116] rounded transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
