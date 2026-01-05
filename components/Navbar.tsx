
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, SyncStatus, CloudConfig } from '../types';
import { LogOut, Coffee, Thermometer, Cloud, CloudOff, CloudRain, Settings, X, ShieldCheck, Database, RefreshCw, DownloadCloud } from 'lucide-react';

interface NavbarProps {
  user: User;
  syncStatus: SyncStatus;
  cloudConfig: CloudConfig;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onUpdateCloudConfig: (config: CloudConfig) => void;
  onFetchFromCloud: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, syncStatus, cloudConfig, onLogout, onUpdateUser, onUpdateCloudConfig, onFetchFromCloud }) => {
  const navigate = useNavigate();
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<CloudConfig>(cloudConfig);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const toggleTempUnit = () => {
    onUpdateUser({ ...user, tempUnit: user.tempUnit === 'C' ? 'F' : 'C' });
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCloudConfig(tempConfig);
    setShowCloudConfig(false);
  };

  const renderSyncIcon = () => {
    switch (syncStatus) {
      case 'synced': return <Cloud size={16} className="text-emerald-500" />;
      case 'pending': return <Cloud size={16} className="text-amber-500 animate-pulse" />;
      case 'error': return <CloudRain size={16} className="text-red-500" />;
      default: return <CloudOff size={16} className="text-stone-300" />;
    }
  };

  return (
    <nav className="bg-[#fdfaf5] border-b border-stone-200 px-6 py-4 flex items-center justify-between no-print relative z-[100]">
      <Link to="/home" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-stone-900 text-white flex items-center justify-center rounded-sm">
          <Coffee size={18} />
        </div>
        <span className="serif text-2xl font-bold tracking-tight text-stone-900 group-hover:text-stone-600 transition-colors">
          Roaster's Journeys
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {/* Cloud Sync Status */}
        <button 
          onClick={() => { setTempConfig(cloudConfig); setShowCloudConfig(true); }}
          className={`flex items-center gap-2 px-3 py-1.5 border border-stone-100 rounded-sm hover:border-stone-400 transition-all ${cloudConfig.enabled ? 'bg-white shadow-sm' : ''}`}
          title="System Cloud Integration"
        >
          {renderSyncIcon()}
          <span className="text-[9px] uppercase tracking-widest font-black text-stone-500">
            {syncStatus === 'synced' ? 'Synced' : syncStatus === 'pending' ? 'Syncing...' : 'Local Only'}
          </span>
        </button>

        <button 
          onClick={toggleTempUnit}
          className="flex items-center gap-2 px-3 py-1.5 border border-stone-200 rounded hover:border-stone-900 transition-all"
          title="Toggle Temperature Scale"
        >
          <Thermometer size={14} className="text-stone-400" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
            Scale: <span className="text-stone-900">°{user.tempUnit}</span>
          </span>
        </button>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold leading-none">User</span>
          <span className="serif text-stone-800 text-lg leading-tight">{user.username}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {showCloudConfig && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fdfaf5] border border-stone-200 w-full max-w-md p-10 shadow-2xl rounded-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl serif italic text-stone-900">System Integration</h3>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-stone-400 mt-2">Global Backend Configuration</p>
              </div>
              <button onClick={() => setShowCloudConfig(false)} className="text-stone-300 hover:text-stone-900"><X size={24} /></button>
            </div>

            <p className="text-[10px] serif italic text-stone-500 mb-6 leading-relaxed">
              Note: This configuration is shared across all users on this instance. Data remains private via unique User IDs.
            </p>

            <form onSubmit={handleSaveCloudConfig} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white border border-stone-100 mb-6">
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Enable Cloud Bridge</span>
                <input 
                  type="checkbox" 
                  checked={tempConfig.enabled}
                  onChange={(e) => setTempConfig({...tempConfig, enabled: e.target.checked})}
                  className="w-5 h-5 accent-stone-900"
                />
              </div>

              {tempConfig.enabled && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Service Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setTempConfig({...tempConfig, provider: 'supabase'})}
                        className={`py-3 text-[10px] uppercase tracking-widest font-bold border rounded-sm transition-all ${tempConfig.provider === 'supabase' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'}`}
                      >
                        Supabase
                      </button>
                      <button 
                        type="button"
                        onClick={() => setTempConfig({...tempConfig, provider: 'custom'})}
                        className={`py-3 text-[10px] uppercase tracking-widest font-bold border rounded-sm transition-all ${tempConfig.provider === 'custom' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'}`}
                      >
                        Custom API
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Backend Endpoint URL</label>
                    <div className="relative">
                      <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                      <input 
                        type="url" 
                        required
                        placeholder="https://xyz.supabase.co"
                        value={tempConfig.url}
                        onChange={(e) => setTempConfig({...tempConfig, url: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-100 focus:border-stone-900 outline-none serif italic text-lg shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Secret API Key / Token</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••••••••••"
                        value={tempConfig.apiKey}
                        onChange={(e) => setTempConfig({...tempConfig, apiKey: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-100 focus:border-stone-900 outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <button 
                      type="button"
                      onClick={onFetchFromCloud}
                      className="w-full py-3 flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all text-[10px] uppercase tracking-[0.2em] font-black rounded-sm"
                    >
                      <DownloadCloud size={16} /> 
                      Restore Missing Data From Cloud
                    </button>
                    <p className="text-[8px] text-stone-400 mt-2 text-center uppercase tracking-widest font-bold">Fetches records linked to your current User ID</p>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-stone-900 text-white uppercase tracking-[0.4em] text-[10px] font-bold hover:bg-stone-800 transition-all shadow-lg mt-6"
              >
                Apply System Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
