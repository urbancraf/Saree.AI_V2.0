
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check credentials against the latest state
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Destructure to separate password from the user object passed to the app state
      const { password, ...safeUser } = user; 
      onLogin(safeUser as User);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold-100 rounded-full opacity-50 blur-3xl"></div>
      </div>

      <div className="mb-8 text-center animate-fade-in-up">
         <h1 className="text-5xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-gold-500 mb-2">
           Saree.AI
         </h1>
         <p className="text-slate-500 font-medium tracking-wide">Virtual Try-On & Analytics Platform</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 animate-fade-in">
        <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6 text-center">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center justify-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary-500/30 flex justify-center items-center gap-2 mt-2"
          >
            <span>Login</span>
            <LogIn size={20} />
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 font-medium">
        &copy; 2025 Saree.AI. Authorized personnel only.
      </p>
    </div>
  );
};