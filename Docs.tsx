
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Printer, BookOpen, Layers, Type as TypeIcon, Code, ShieldCheck, Database, Globe, Smartphone, Cloud, Server, Terminal, Github, Rocket, Lock } from 'lucide-react';

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

        {/* The Beginner's Deployment Section */}
        <section className="mb-24 border-l-4 border-stone-900 pl-10 bg-stone-50/30 py-10 rounded-r-sm">
          <div className="flex items-center gap-4 mb-10">
            <Rocket className="text-stone-900" size={32} />
            <h2 className="text-4xl serif text-stone-900 italic">Deployment Crash Course</h2>
          </div>
          
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Lock size={14} className="text-amber-600" /> 1. The Secret Vault
              </h3>
              <p className="text-stone-600 leading-relaxed serif italic mb-4">
                Since your GitHub code is public, you should never type your Supabase keys directly into the files. Instead:
              </p>
              <ul className="space-y-3 text-sm text-stone-500 serif list-disc list-inside">
                <li>Go to your GitHub Repo -> Settings -> Secrets -> Actions.</li>
                <li>Add <strong>SUPABASE_URL</strong> and <strong>SUPABASE_KEY</strong>.</li>
                <li>GitHub will safely "inject" these into the app during the build process.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Terminal size={14} className="text-emerald-600" /> 2. The Deployment Robot
              </h3>
              <p className="text-stone-600 leading-relaxed serif italic mb-4">
                We have created a file at <code>.github/workflows/deploy.yml</code>. This is a set of instructions that tells GitHub:
              </p>
              <ol className="space-y-3 text-sm text-stone-500 serif list-decimal list-inside">
                <li>"Wake up" when I push new code.</li>
                <li>Download the latest tools (Node.js).</li>
                <li>Grab my secrets from the vault.</li>
                <li>Build the website and host it on GitHub Pages.</li>
              </ol>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-sm">
              <h4 className="text-[10px] uppercase tracking-widest font-black text-amber-800 mb-2">Final Step: Activation</h4>
              <p className="text-xs text-amber-700 leading-relaxed italic">
                After you push your code, go to <strong>Settings > Pages</strong> in GitHub. Under "Build and deployment", ensure the source is set to <strong>"GitHub Actions"</strong>. Your site will be live in about 2 minutes.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Data Layer */}
        <section className="mb-24 border-l-4 border-emerald-600 pl-10">
          <div className="flex items-center gap-4 mb-10">
            <Database className="text-emerald-800" size={32} />
            <h2 className="text-4xl serif text-emerald-900 italic">Persistence Layer (Supabase)</h2>
          </div>
          <div className="space-y-6">
            <p className="text-stone-600 leading-relaxed serif italic">
              Use the following SQL in your Supabase Editor to initialize the database:
            </p>
            <div className="bg-stone-900 rounded-sm p-6 overflow-x-auto shadow-2xl relative">
              <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
{`CREATE TABLE journeys (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data" ON journeys 
FOR ALL USING (auth.uid()::text = user_id OR true);`}
              </pre>
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
