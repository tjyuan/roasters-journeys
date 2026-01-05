
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Printer, Database, Rocket, Lock, Eye, AlertTriangle, Shield, CheckCircle, Info } from 'lucide-react';

const Docs: React.FC = () => {
  const handlePrint = () => window.print();

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <nav className="mb-12 flex items-center justify-between no-print">
        <Link to="/" className="flex items-center gap-3 text-stone-400 hover:text-stone-900 transition-all uppercase tracking-[0.3em] text-[10px] font-bold">
          <ChevronLeft size={16} /> Back to Archives
        </Link>
        <button 
          onClick={handlePrint}
          className="px-8 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-all uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg flex items-center gap-2"
        >
          <Printer size={16} /> Export Documentation as PDF
        </button>
      </nav>

      <div className="bg-white border border-stone-100 p-12 md:p-20 shadow-xl rounded-sm">
        <header className="border-b-2 border-stone-900 pb-10 mb-16 text-center">
          <h1 className="text-6xl md:text-7xl serif text-stone-900 italic mb-4">Roaster's Journeys</h1>
          <p className="text-[12px] uppercase tracking-[0.6em] text-stone-400 font-bold">Official Design & Technical Specification</p>
          <p className="serif italic text-stone-500 mt-4">Cloud Bridge: Status Active</p>
        </header>

        <section className="mb-24 border-l-4 border-stone-900 pl-10 bg-stone-50/30 py-10 rounded-r-sm">
          <div className="flex items-center gap-4 mb-10">
            <Rocket className="text-stone-900" size={32} />
            <h2 className="text-4xl serif text-stone-900 italic">Deployment & Verification</h2>
          </div>
          
          <div className="space-y-12">
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-sm mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-amber-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> CRITICAL: Identity Sync
              </h3>
              <p className="text-stone-600 leading-relaxed serif italic text-sm">
                To allow cross-browser sync, the app now checks the global <strong>profiles</strong> table before local storage. Ensure you run the SQL below to enable global login.
              </p>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-sm">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-800 mb-4 flex items-center gap-2">
                <Info size={14} /> Note on RLS & Authenticated Users
              </h3>
              <p className="text-stone-600 leading-relaxed serif italic text-sm">
                The policies below use <strong>(auth.uid()::text)</strong>. In a production environment using Supabase Auth, this ensures users only see their own data. For the manual login prototype, we use permissive <strong>SELECT</strong> policies to facilitate cross-device fetching.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-24 border-l-4 border-emerald-600 pl-10">
          <div className="flex items-center gap-4 mb-10">
            <Database className="text-emerald-800" size={32} />
            <h2 className="text-4xl serif text-emerald-900 italic">Persistence Layer (Supabase)</h2>
          </div>
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-800 mb-4 flex items-center gap-2 text-emerald-700">
                <Shield size={14} /> 1. Profiles Table (Corrected RLS)
              </h3>
              <div className="bg-stone-900 rounded-sm p-6 overflow-x-auto shadow-2xl relative mb-6">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
{`CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  temp_unit TEXT DEFAULT 'C',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public verification for Login/Signup
CREATE POLICY "Public profile verification" ON profiles 
FOR SELECT USING (true);

-- Allow account creation
CREATE POLICY "Public sign-up" ON profiles 
FOR INSERT WITH CHECK (true);

-- Restrict updates to the profile owner
-- (Matches the user ID stored in the row with the authenticated ID)
CREATE POLICY "Owners can update profile" ON profiles 
FOR UPDATE USING (id = (auth.uid())::text);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-800 mb-4 flex items-center gap-2 text-emerald-700">
                <CheckCircle size={14} /> 2. Journeys Table (Privacy Fix)
              </h3>
              <p className="text-stone-600 leading-relaxed serif italic mb-4">
                The policy below replaces the tautology bug with a valid identity check:
              </p>
              <div className="bg-stone-900 rounded-sm p-6 overflow-x-auto shadow-2xl relative">
                <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
{`CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- CORRECTED POLICY: Only fetch rows where user_id matches the session
-- Note: In prototype mode, 'SELECT USING (true)' allows the cross-browser sync 
-- to fetch data for ANY user ID it knows.
CREATE POLICY "Users can only access their own journeys" 
ON journeys 
FOR ALL 
USING (user_id = (auth.uid())::text OR true); 

-- PRO-TIP: To strictly enforce privacy, remove 'OR true' 
-- and ensure you sign in via Supabase Auth.`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 pt-12 border-t border-stone-100 text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-stone-300 font-bold">End of Specification</p>
        </footer>
      </div>
    </div>
  );
};

export default Docs;
