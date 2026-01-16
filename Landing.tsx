
import React, { useState } from 'react';
import { GreenBean } from '../types';
import { Search, LogIn, Coffee, UserPlus } from 'lucide-react';

interface LandingProps {
  onLogin: (username: string, password?: string) => boolean;
  onSignup: (username: string, password?: string) => boolean;
  beans: GreenBean[];
}

const Landing: React.FC<LandingProps> = ({ onLogin, onSignup, beans }) => {
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'login' | 'signup' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const publicBeans = beans.filter(b => b.isPublic && 
    (b.beanName.toLowerCase().includes(search.toLowerCase()) || 
     b.country.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (modalMode === 'login') {
      if (!onLogin(username, password)) setError('Sign-in failed. Check credentials.');
    } else {
      if (!onSignup(username, password)) setError('User already exists.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[85vh] flex items-center justify-center bg-[#fdfaf5] overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 scale-150 rotate-12"><Coffee size={200} /></div>
          <div className="absolute bottom-10 right-10 scale-150 -rotate-12"><Coffee size={200} /></div>
        </div>
        
        <div className="relative z-10 max-w-5xl text-center px-6">
          <h1 className="text-7xl md:text-9xl font-bold text-stone-900 mb-8 serif tracking-tighter">
            Roaster's Journeys
          </h1>
          <p className="text-xl md:text-3xl text-stone-600 mb-14 serif italic max-w-3xl mx-auto leading-relaxed border-t border-b border-stone-200 py-6">
            Preserving the thermal legacy of every unique profile.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => { setModalMode('login'); setUsername(''); setPassword(''); setError(''); }}
              className="px-12 py-5 bg-stone-900 text-white hover:bg-stone-800 transition-all font-medium tracking-[0.3em] uppercase text-xs flex items-center gap-3 shadow-lg"
            >
              <LogIn size={18} /> Sign-in
            </button>
            <button 
              onClick={() => { setModalMode('signup'); setUsername(''); setPassword(''); setError(''); }}
              className="px-12 py-5 border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all font-medium tracking-[0.3em] uppercase text-xs flex items-center gap-3"
            >
              <UserPlus size={18} /> Sign-up
            </button>
          </div>
          
          <div className="mt-16 relative w-full max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="Query Global Repository..."
              className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-stone-300 focus:border-stone-900 outline-none transition-colors serif italic text-xl"
              value={search}
              // Fixed: changed setSearchTerm to setSearch to match state definition
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl serif text-center mb-20 italic text-stone-800 underline underline-offset-[16px] decoration-stone-200">Public Domain Archives</h2>
          {publicBeans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {publicBeans.map(bean => (
                <div key={bean.id} className="border-t border-stone-100 pt-8 group">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 mb-3 font-bold">{bean.country}</p>
                  <h3 className="text-3xl serif text-stone-900 mb-4">{bean.beanName}</h3>
                  <div className="text-stone-500 serif italic">
                    <p>{bean.processMethod}</p>
                    <p className="mt-3 text-sm opacity-60">{bean.batches.length} Profiles Recorded</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-stone-300 italic serif text-2xl py-20">
              {search ? "No records match your query." : "The repository is awaiting its first public entry."}
            </div>
          )}
        </div>
      </section>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
          <div className="bg-[#f9f7f2] w-full max-w-md p-12 border border-stone-200 shadow-2xl relative">
            <h2 className="text-4xl serif text-stone-900 mb-10 text-center italic">
              {modalMode === 'login' ? 'Sign-in' : 'Sign-up'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-3">User</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900 py-3 outline-none serif text-xl"
                  placeholder="User"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-3">Password</label>
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-stone-300 focus:border-stone-900 py-3 outline-none serif text-xl"
                  placeholder="Password"
                />
              </div>
              {error && <p className="text-red-500 text-xs serif italic text-center">{error}</p>}
              <button 
                type="submit"
                className="w-full py-5 bg-stone-900 text-white uppercase tracking-[0.4em] text-xs font-semibold hover:bg-stone-800 transition-all shadow-lg"
              >
                {modalMode === 'login' ? 'Sign-in' : 'Sign-up'}
              </button>
              <button 
                type="button"
                onClick={() => setModalMode(null)}
                className="w-full text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-600 font-bold"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;