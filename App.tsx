
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppState, User, GreenBean, RoastingData, SyncStatus, CloudConfig, Batch } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import BeanDetail from './components/BeanDetail';
import Docs from './components/Docs';
import Navbar from './components/Navbar';
import { v4 as uuidv4 } from 'uuid';

/**
 * SYSTEM DEFAULTS
 * These will be populated by your build tool (e.g. GitHub Actions) 
 * using environment variables. If blank, the user can still enter them manually.
 */
const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  // @ts-ignore - process.env might not be defined in all dev environments
  enabled: !!(process.env.SUPABASE_URL || ''),
  provider: 'supabase',
  // @ts-ignore
  url: process.env.SUPABASE_URL || '', 
  // @ts-ignore
  apiKey: process.env.SUPABASE_KEY || ''
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
  let result: number;
  if (from === 'C' && to === 'F') {
    result = (num * 9 / 5) + 32;
  } else {
    result = (num - 32) * 5 / 9;
  }
  return Math.round(result).toString();
};

const convertRoastingData = (data: RoastingData, from: 'C' | 'F', to: 'C' | 'F'): RoastingData => {
  return {
    chargeTemperature: convertValue(data.chargeTemperature, from, to),
    turningWhite: { ...data.turningWhite, temperature: convertValue(data.turningWhite.temperature, from, to) },
    yellowingPoint: { ...data.yellowingPoint, temperature: convertValue(data.yellowingPoint.temperature, from, to) },
    firstCrack: { ...data.firstCrack, temperature: convertValue(data.firstCrack.temperature, from, to) },
    dropBean: { ...data.dropBean, temperature: convertValue(data.dropBean.temperature, from, to) },
    totalTime: data.totalTime
  };
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Priority: Use saved user data, but update config if environment variables are now present
        return {
          ...parsed,
          cloudConfig: (DEFAULT_CLOUD_CONFIG.url && !parsed.cloudConfig?.url) 
            ? DEFAULT_CLOUD_CONFIG 
            : (parsed.cloudConfig || DEFAULT_CLOUD_CONFIG)
        };
      }
    } catch (e) {
      console.error("Critical: Failed to parse persistence layer", e);
    }
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
        return {
          ...prev,
          beans: [...prev.beans, ...newBeans]
        };
      });
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Cloud Bridge Unavailable.', err);
      setSyncStatus('error');
    }
  }, []);

  const syncToCloud = useCallback(async (data: AppState) => {
    const config = data.cloudConfig;
    if (!config.enabled || !config.url || !config.apiKey || !data.currentUser) {
      return;
    }

    try {
      const userBeans = data.beans.filter(b => b.userId === data.currentUser?.id);
      if (userBeans.length === 0) return;

      const endpoint = `${config.url}/rest/v1/journeys`;
      const response = await fetch(endpoint, {
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

      if (response.ok) {
        setSyncStatus('synced');
      } else {
        throw new Error('Sync Failed');
      }
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    const timeoutId = setTimeout(() => {
      syncToCloud(state);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [state, syncToCloud]);

  useEffect(() => {
    if (state.currentUser && state.cloudConfig.enabled && !initialFetchRef.current) {
      fetchFromCloud(state.cloudConfig, state.currentUser);
      initialFetchRef.current = true;
    }
  }, [state.currentUser, state.cloudConfig, fetchFromCloud]);

  const login = (username: string, password?: string) => {
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      setState(prev => ({ 
        ...prev, 
        currentUser: { ...user, isAuthenticated: true } 
      }));
      return true;
    }
    return false;
  };

  const signup = (username: string, password?: string) => {
    if (state.users.find(u => u.username === username)) return false;
    const newUser: User = { 
      id: `user-${uuidv4().split('-')[0]}`, 
      username, 
      password, 
      isAuthenticated: true,
      tempUnit: 'C'
    };
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

  const updateUser = (updatedUser: User) => {
    const oldUnit = state.currentUser?.tempUnit;
    const newUnit = updatedUser.tempUnit;

    setState(prev => {
      let updatedBeans = prev.beans;
      if (oldUnit && oldUnit !== newUnit) {
        updatedBeans = prev.beans.map(bean => {
          if (bean.userId === updatedUser.id) {
            return {
              ...bean,
              batches: bean.batches.map(batch => ({
                ...batch,
                plan: convertRoastingData(batch.plan, oldUnit, newUnit),
                actual: convertRoastingData(batch.actual, oldUnit, newUnit),
              }))
            };
          }
          return bean;
        });
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
    if (config.enabled && state.currentUser) {
      fetchFromCloud(config, state.currentUser);
    }
  };

  const addBean = (bean: GreenBean) => {
    setState(prev => ({ ...prev, beans: [...prev.beans, bean] }));
  };

  const updateBean = (updatedBean: GreenBean) => {
    setState(prev => ({
      ...prev,
      beans: prev.beans.map(b => b.id === updatedBean.id ? updatedBean : b)
    }));
  };

  const deleteBean = (id: string) => {
    setState(prev => ({
      ...prev,
      beans: prev.beans.filter(b => b.id !== id)
    }));
  };

  const importData = (data: GreenBean | GreenBean[]) => {
    if (!state.currentUser) return;
    const incoming = Array.isArray(data) ? data : [data];
    const processed = incoming.map(bean => ({
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
