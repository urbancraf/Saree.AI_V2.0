
import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, Store, Users, RotateCcw, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { Vendor, User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  apiKeys: string[];
  setApiKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  vendors, 
  setVendors, 
  users, 
  setUsers,
  apiKeys,
  setApiKeys
}) => {
  const [activeTab, setActiveTab] = useState<'vendors' | 'users' | 'api-keys'>('vendors');
  
  // Vendor State
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  // User State
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // API Key State
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleAddVendor = () => {
    if (newName.trim() && newCode.trim()) {
      setVendors([...vendors, { 
        id: Date.now().toString(), 
        name: newName.trim(), 
        code: newCode.trim() 
      }]);
      setNewName('');
      setNewCode('');
    }
  };

  const handleDeleteVendor = (id: string) => {
    setVendors(vendors.filter(v => v.id !== id));
  };

  const handleResetPassword = (username: string) => {
    if (confirm(`Are you sure you want to reset the password for ${username}?`)) {
      const defaultPass = "Welcome@1234";
      setUsers(prev => prev.map(u => 
        u.username === username ? { ...u, password: defaultPass } : u
      ));
      setResetMessage(`Password for ${username} reset to: ${defaultPass}`);
      setTimeout(() => setResetMessage(null), 5000);
    }
  };

  const handleAddKey = () => {
    if (newKey.trim()) {
      if (apiKeys.length >= 15) {
        alert("Maximum 15 keys allowed.");
        return;
      }
      setApiKeys([...apiKeys, newKey.trim()]);
      setNewKey('');
    }
  };

  const handleDeleteKey = (index: number) => {
    const newKeys = [...apiKeys];
    newKeys.splice(index, 1);
    setApiKeys(newKeys);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
               <Settings size={20} className="text-slate-600" />
            </div>
            <h3 className="font-serif font-bold text-xl">Admin Console</h3>
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
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'vendors' ? 'text-primary-700 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Store size={16}/> Vendors
            {activeTab === 'vendors' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'users' ? 'text-primary-700 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16}/> Users
            {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('api-keys')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-2 ${activeTab === 'api-keys' ? 'text-primary-700 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Key size={16}/> Keys
            {activeTab === 'api-keys' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {activeTab === 'vendors' && (
            <>
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Add New Vendor</h4>
                {/* Add Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Silk House"
                      className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vendor Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="e.g. SH-001"
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddVendor()}
                      />
                      <button 
                        onClick={handleAddVendor}
                        disabled={!newName.trim() || !newCode.trim()}
                        className="px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Active Vendors ({vendors.length})</span>
                </div>
                <div className="space-y-2">
                    {vendors.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                        No vendors added yet.
                      </div>
                    ) : (
                      vendors.map(vendor => (
                        <div key={vendor.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-primary-100 transition-colors group">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{vendor.name}</p>
                            <p className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">{vendor.code}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
               {resetMessage && (
                 <div className="p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm mb-4">
                   {resetMessage}
                 </div>
               )}
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">System Users ({users.length})</span>
               </div>
               {users.map(user => (
                 <div key={user.username} className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                         {user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500">@{user.username}</span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                             {user.role}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin Actions */}
                    <button 
                      onClick={() => handleResetPassword(user.username)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Reset Password"
                    >
                      <RotateCcw size={16} />
                    </button>
                 </div>
               ))}

               <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200">
                 <div className="flex items-center gap-2 mb-1 font-bold text-slate-700">
                   <Shield size={14} /> Security Note
                 </div>
                 Admins can reset any user's password. The default temporary password is <strong>Welcome@1234</strong>.
               </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Add Gemini API Key</label>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <input
                        type={showKey ? "text" : "password"}
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="Paste your API key here"
                        className="w-full p-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                   </div>
                   <button 
                      onClick={handleAddKey}
                      disabled={!newKey.trim() || apiKeys.length >= 15}
                      className="px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                   >
                      <Plus size={18} />
                   </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  You can add up to {15 - apiKeys.length} more keys. Keys are stored locally for this session.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Manage Keys ({apiKeys.length})</span>
                </div>
                
                {apiKeys.length === 0 ? (
                   <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                     No custom keys added. Using default environment key.
                   </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-green-50 text-green-600 rounded">
                             <Key size={16} />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-500 uppercase">Key #{index + 1}</span>
                             <span className="text-sm font-mono text-slate-700">
                               ••••••••••••••••{key.slice(-4)}
                             </span>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteKey(index)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {apiKeys.length > 0 && (
                 <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                    <strong>Note:</strong> The application will primarily use <strong>Key #1</strong> for all AI operations.
                 </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
           <button onClick={onClose} className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
             Done
           </button>
        </div>
      </div>
    </div>
  );
};
