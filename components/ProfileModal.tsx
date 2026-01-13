
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Phone, Lock, Save, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: Partial<User> & { newPassword?: string }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(null);
      setActiveTab('details');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveDetails = () => {
    onUpdateUser({
      username: currentUser.username,
      name,
      email,
      phone
    });
    setMessage({ type: 'success', text: 'Profile details updated successfully.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    
    // Just send the new password update without old password check
    onUpdateUser({
      username: currentUser.username,
      newPassword
    });
    
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Password updated successfully.' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
               <UserIcon size={20} className="text-primary-600" />
            </div>
            <h3 className="font-serif font-bold text-xl">My Profile</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'details' ? 'text-primary-700 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Personal Details
            {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${activeTab === 'security' ? 'text-primary-700 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Security
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.type === 'success' && <CheckCircle size={16} />}
              {message.text}
            </div>
          )}

          {activeTab === 'details' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Username</label>
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="w-full p-3 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveDetails}
                className="w-full mt-4 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-700 mb-2">
                Create a strong password with at least 6 characters.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={!newPassword || !confirmPassword}
                className="w-full mt-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
