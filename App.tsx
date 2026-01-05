
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppState, User, GreenBean, RoastingData, SyncStatus, CloudConfig } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import BeanDetail from './components/BeanDetail';
import Docs from './components/Docs';
import Navbar from './components/Navbar';
import { v4 as uuidv4 } from 'uuid';

const getEnv = (key: string): string => {
  try {
    if (key === 'SUPABASE_URL') return process.env.SUPABASE_URL || '';
    if (key === 'SUPABASE_KEY') return process.env.SUPABASE_KEY || '';
    return '';
  } catch (e) { return ''; }
};

const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: !!getEnv('SUPABASE_URL'),
  provider: 'supabase',
  url: getEnv('SUPABASE_URL'), 
  apiKey: getEnv('SUPABASE_KEY')
};

const STORAGE_KEY = 'roasters_journeys_v2_persistent_state';

const INITIAL_STATE: AppState = {
  currentUser: null,
  users: [],
  beans: [],
  cloudConfig: DEFAULT_CLOUD_CONFIG
};

const convertValue = (val: string, from: 'C' | 'F', to: 'C' | 'F'): string => {
  if (!val || isNaN(parseFloat(val))) return val;
  const num = parseFloat(val);
  if (from === to) return val;
  return Math.round(from === 'C' ? (num * 9 / 5) + 32 : (num - 32) * 5 / 9).toString();
};

const convertRoastingData = (data: RoastingData, from: 'C' | 'F', to: 'C' | 'F'): RoastingData => ({
  chargeTemperature: convertValue(data.chargeTemperature, from, to),
  turningWhite: { ...data.turningWhite, temperature: convertValue(data.turningWhite.temperature, from, to) },
  yellowingPoint: { ...data.yellowingPoint, temperature: convertValue(data.yellowingPoint.temperature, from, to) },
  firstCrack: { ...data.firstCrack, temperature: convertValue(data.firstCrack.temperature, from, to) },
  dropBean: { ...data.dropBean, temperature: convertValue(data.dropBean.temperature, from, to) },
  totalTime: data.totalTime
});

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          cloudConfig: (DEFAULT_CLOUD_CONFIG.url && !parsed.cloudConfig?.url) 
            ? DEFAULT_CLOUD_CONFIG 
            : (parsed.cloudConfig || DEFAULT_CLOUD_CONFIG)
        };
      }
    } catch (e) {}
    return INITIAL_STATE;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(state.cloudConfig.enabled ? 'pending' : 'offline');
  const initialFetchRef = useRef(false);

  const fetchFromCloud = useCallback(async (config: CloudConfig, user: User) => {
    if (!config.enabled || !config.url || !config.apiKey) {
      setSyncStatus('offline');
      return;
    }
    
    setSyncStatus('pending');
    try {
      const endpoint = `${config.url}/rest/v1/journeys?user_id=eq.${user.id}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Cloud Fetch Error');
      
      const remoteData = await response.json();
      const remoteBeans: GreenBean[] = remoteData.map((row: any) => row.data);

      setState(prev => {
        const localIds = new Set(prev.beans.map(b => b.id));
        const newBeans = remoteBeans.filter(rb => !localIds.has(rb.id));
        if (newBeans.length === 0) return prev;
        return { ...prev, beans: [...prev.beans, ...newBeans] };
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  const syncToCloud = useCallback(async (data: AppState) => {
    const config = data.cloudConfig;
    if (!config.enabled || !config.url || !config.apiKey || !data.currentUser) return;

    try {
      const userBeans = data.beans.filter(b => b.userId === data.currentUser?.id);
      if (userBeans.length === 0) return;

      const endpoint = `${config.url}/rest/v1/journeys`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(userBeans.map(bean => ({
          id: bean.id,
          user_id: bean.userId,
          data: bean,
          updated_at: new Date().toISOString()
        })))
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const timeoutId = setTimeout(() => syncToCloud(state), 1500);
    return () => clearTimeout(timeoutId);
  }, [state, syncToCloud]);

  useEffect(() => {
    if (state.currentUser && state.cloudConfig.enabled && !initialFetchRef.current) {
      fetchFromCloud(state.cloudConfig, state.currentUser);
      initialFetchRef.current = true;
    }
  }, [state.currentUser, state.cloudConfig, fetchFromCloud]);

  const login = async (username: string, password?: string): Promise<boolean> => {
    // 1. Check Cloud profiles table FIRST for cross-browser support
    const config = state.cloudConfig;
    if (config.enabled && config.url) {
      try {
        const endpoint = `${config.url}/rest/v1/profiles?username=eq.${username}&password=eq.${password}`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': config.apiKey,
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const profiles = await response.json();
        if (profiles && profiles.length > 0) {
          const cloudUser: User = {
            id: profiles[0].id,
            username: profiles[0].username,
            password: profiles[0].password,
            tempUnit: profiles[0].temp_unit || 'C',
            isAuthenticated: true
          };
          setState(prev => ({
            ...prev,
            users: [...prev.users.filter(u => u.id !== cloudUser.id), cloudUser],
            currentUser: cloudUser
          }));
          return true;
        }
      } catch (err) {
        console.error('Cloud Identity Verification Failed', err);
      }
    }

    // 2. Fallback: Check local state (offline/private mode)
    const localUser = state.users.find(u => u.username === username && u.password === password);
    if (localUser) {
      setState(prev => ({ ...prev, currentUser: { ...localUser, isAuthenticated: true } }));
      return true;
    }

    return false;
  };

  const signup = async (username: string, password?: string): Promise<boolean> => {
    // Check cloud first
    const config = state.cloudConfig;
    if (config.enabled && config.url) {
      try {
        const checkEndpoint = `${config.url}/rest/v1/profiles?username=eq.${username}`;
        const checkResponse = await fetch(checkEndpoint, {
          method: 'GET',
          headers: {
            'apikey': config.apiKey,
            'Authorization': `Bearer ${config.apiKey}`
          }
        });
        const existing = await checkResponse.json();
        if (existing && existing.length > 0) return false; // Username taken globally
      } catch (err) {}
    }

    if (state.users.find(u => u.username === username)) return false;
    
    const newUser: User = { 
      id: `user-${uuidv4().split('-')[0]}`, 
      username, 
      password, 
      isAuthenticated: true,
      tempUnit: 'C'
    };

    // Push to Cloud profiles
    if (config.enabled && config.url) {
      try {
        const endpoint = `${config.url}/rest/v1/profiles`;
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': config.apiKey,
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: newUser.id,
            username: newUser.username,
            password: newUser.password,
            temp_unit: newUser.tempUnit
          })
        });
      } catch (err) {
        console.warn('Signup sync failed, continuing locally.');
      }
    }

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
    return true;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    initialFetchRef.current = false;
    setSyncStatus(state.cloudConfig.enabled ? 'pending' : 'offline');
  };

  const updateUser = async (updatedUser: User) => {
    const oldUnit = state.currentUser?.tempUnit;
    const newUnit = updatedUser.tempUnit;

    const config = state.cloudConfig;
    if (config.enabled && config.url) {
      try {
        const endpoint = `${config.url}/rest/v1/profiles?id=eq.${updatedUser.id}`;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'apikey': config.apiKey,
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ temp_unit: newUnit })
        });
      } catch (e) {}
    }

    setState(prev => {
      let updatedBeans = prev.beans;
      if (oldUnit && oldUnit !== newUnit) {
        updatedBeans = prev.beans.map(bean => bean.userId === updatedUser.id ? {
          ...bean,
          batches: bean.batches.map(batch => ({
            ...batch,
            plan: convertRoastingData(batch.plan, oldUnit, newUnit),
            actual: convertRoastingData(batch.actual, oldUnit, newUnit),
          }))
        } : bean);
      }
      return {
        ...prev,
        users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        currentUser: updatedUser,
        beans: updatedBeans
      };
    });
  };

  const updateCloudConfig = (config: CloudConfig) => {
    setState(prev => ({ ...prev, cloudConfig: config }));
    if (config.enabled && state.currentUser) fetchFromCloud(config, state.currentUser);
  };

  const addBean = (bean: GreenBean) => setState(prev => ({ ...prev, beans: [...prev.beans, bean] }));
  const updateBean = (updatedBean: GreenBean) => setState(prev => ({ ...prev, beans: prev.beans.map(b => b.id === updatedBean.id ? updatedBean : b) }));
  const deleteBean = (id: string) => setState(prev => ({ ...prev, beans: prev.beans.filter(b => b.id !== id) }));

  const importData = (data: GreenBean | GreenBean[]) => {
    if (!state.currentUser) return;
    const processed = (Array.isArray(data) ? data : [data]).map(bean => ({
      ...bean,
      id: uuidv4(),
      userId: state.currentUser!.id,
      batches: (bean.batches || []).map(batch => ({ ...batch, id: uuidv4() }))
    }));
    setState(prev => ({ ...prev, beans: [...prev.beans, ...processed] }));
    return processed.length;
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        {state.currentUser && (
          <Navbar 
            user={state.currentUser} 
            syncStatus={syncStatus}
            cloudConfig={state.cloudConfig}
            onLogout={logout} 
            onUpdateUser={updateUser}
            onUpdateCloudConfig={updateCloudConfig}
            onFetchFromCloud={() => state.currentUser && fetchFromCloud(state.cloudConfig, state.currentUser)}
          />
        )}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={state.currentUser ? <Navigate to="/home" replace /> : <Landing onLogin={login} onSignup={signup} beans={state.beans} />} />
            <Route path="/home" element={state.currentUser ? <Dashboard state={state} onAddBean={addBean} onImport={importData} /> : <Navigate to="/" replace />} />
            <Route path="/bean/:id" element={state.currentUser ? <BeanDetail currentUser={state.currentUser} beans={state.beans} onUpdateBean={updateBean} onDeleteBean={deleteBean} /> : <Navigate to="/" replace />} />
            <Route path="/docs" element={<Docs />} />
          </Routes>
        </main>
        <footer className="bg-stone-900 text-stone-400 py-12 px-4 text-center text-sm no-print">
          <p className="serif italic text-2xl text-stone-200 mb-4">Roaster's Journeys</p>
          <div className="flex justify-center gap-8 mb-6">
            <Link to="/docs" className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 hover:text-white transition-colors">Documentation</Link>
            <Link to="/" className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 hover:text-white transition-colors">Archive</Link>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-50">© {new Date().getFullYear()} Fine Coffee Roasting. Hybrid Cloud/Local Layer Active.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
