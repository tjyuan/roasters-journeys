
import React, { useState } from 'react';
import { AppState, GreenBean } from '../types';
import { Plus, Download, Upload, FileText, Search, Coffee, X, Camera, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  state: AppState;
  onAddBean: (bean: GreenBean) => void;
  onImport: (beans: GreenBean | GreenBean[]) => number | undefined;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAddBean, onImport }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newBean, setNewBean] = useState<{
    country: string;
    beanName: string;
    cultivar: string;
    estateFarm: string;
    processMethod: string;
    masl: string;
    waterActivity: string;
    density: string;
    cuppingNotes: string;
    roastRecommendation: string;
    isPublic: boolean;
    imageUrl?: string;
  }>({
    country: '',
    beanName: '',
    cultivar: '',
    estateFarm: '',
    processMethod: '',
    masl: '',
    waterActivity: '',
    density: '',
    cuppingNotes: '',
    roastRecommendation: '',
    isPublic: false,
    imageUrl: undefined
  });

  const filteredBeans = state.beans
    .filter(b => b.userId === state.currentUser?.id)
    .filter(b => 
      b.beanName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.country.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.country.localeCompare(b.country) || a.beanName.localeCompare(b.beanName));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBean(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddBean = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBean.country || !newBean.beanName) return;

    const bean: GreenBean = {
      ...newBean,
      id: uuidv4(),
      userId: state.currentUser?.id || 'guest',
      batches: [],
      createdAt: new Date().toISOString()
    };

    onAddBean(bean);
    setShowAdd(false);
    setNewBean({
      country: '', beanName: '', cultivar: '', estateFarm: '', 
      processMethod: '', masl: '', waterActivity: '', density: '', 
      cuppingNotes: '', roastRecommendation: '', isPublic: false,
      imageUrl: undefined
    });
  };

  const handleExportJSON = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const userBeans = state.beans.filter(b => b.userId === state.currentUser?.id);
      if (userBeans.length === 0) {
        alert("The archive is currently empty.");
        return;
      }
      const dataStr = JSON.stringify(userBeans, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `roaster_journey_export_${new Date().toISOString().split('T')[0]}.json`;
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = exportFileDefaultName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      alert('An unexpected error occurred during export.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const isSingleBean = typeof json === 'object' && json !== null && !Array.isArray(json) && 'beanName' in json;
        const isBeanArray = Array.isArray(json) && (json.length === 0 || 'beanName' in json[0]);
        if (isSingleBean || isBeanArray) {
          const count = onImport(json);
          if (count && count > 0) alert(`Success: ${count} record(s) processed.`);
        } else {
          alert('Invalid record format.');
        }
      } catch (err) { alert('Parse error.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-stone-200 pb-12">
        <div>
          <h1 className="text-6xl serif text-stone-900 mb-3 italic">My Journeys</h1>
          <p className="text-stone-500 serif italic text-xl">Systematic documentation of coffee beans.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <label className="cursor-pointer px-5 py-3 border border-stone-200 text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-all text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Upload size={14} /> Import Data
            <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
          </label>
          <button type="button" onClick={handleExportJSON} className="px-5 py-3 border border-stone-200 text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-all text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Download size={14} /> Export Records
          </button>
          <button type="button" onClick={() => setShowAdd(true)} className="px-8 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-all text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 shadow-lg">
            <Plus size={14} /> New Bean
          </button>
        </div>
      </header>

      <div className="mb-14 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative w-full max-w-lg">
          <input type="text" placeholder="Query by country or designation..." className="w-full pl-12 pr-4 py-4 bg-white border border-stone-100 focus:border-stone-900 outline-none transition-all serif italic text-xl shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={22} />
        </div>
        <div className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold border-l-2 border-stone-100 pl-6">
          Indexing {filteredBeans.length} coffee beans
        </div>
      </div>

      {filteredBeans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredBeans.map(bean => (
            <Link to={`/bean/${bean.id}`} key={bean.id} className="group bg-white border border-stone-100 hover:border-stone-900 transition-all duration-500 p-10 flex flex-col h-full shadow-sm hover:shadow-2xl rounded-sm">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold border-b border-stone-50 pb-1">
                  {bean.country}
                </span>
                {bean.isPublic && <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">Public Repository</span>}
              </div>
              
              <div className="flex gap-4 mb-3">
                {bean.imageUrl && (
                  <div className="w-12 h-12 overflow-hidden border border-stone-100 flex-shrink-0">
                    <img src={bean.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                )}
                <h3 className="text-3xl serif text-stone-900 group-hover:translate-x-1 transition-transform duration-500">{bean.beanName}</h3>
              </div>
              
              <p className="text-stone-400 serif italic text-lg mb-auto">
                {bean.cultivar ? `${bean.cultivar} • ` : ''}{bean.processMethod || 'Traditional'}
              </p>
              
              <div className="mt-12 pt-8 border-t border-stone-50 flex items-center justify-between">
                <div className="text-xs text-stone-400 flex flex-col">
                  <span className="font-bold uppercase tracking-[0.2em] text-[9px] mb-1">Status</span>
                  <span className="serif italic text-base text-stone-600">{bean.batches.length} Analysis Runs</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-stone-100 flex items-center justify-center text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all duration-500">
                  <FileText size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border-2 border-dashed border-stone-100 bg-[#fdfaf5]/50">
          <Coffee className="mx-auto text-stone-100 mb-8" size={80} />
          <p className="serif text-stone-300 italic text-2xl">Archive is vacant. Initiate data entry.</p>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#fdfaf5] w-full max-w-4xl p-12 border border-stone-200 shadow-2xl my-8 relative rounded-sm">
            <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-900"><X size={24}/></button>
            <h2 className="text-4xl serif text-stone-900 mb-10 italic">Initialize Bean Record</h2>
            <form onSubmit={handleAddBean} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Bean Designation *</label>
                <input autoFocus required type="text" value={newBean.beanName} onChange={(e) => setNewBean({...newBean, beanName: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Country (e.g. Ethiopia, Colombia) *</label>
                <input required type="text" value={newBean.country} onChange={(e) => setNewBean({...newBean, country: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" placeholder="Required geographical source" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Variety / Cultivar Detail</label>
                <input type="text" value={newBean.cultivar} onChange={(e) => setNewBean({...newBean, cultivar: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" placeholder="e.g. Geisha, SL-28" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Estate / Producer / Microlot</label>
                <input type="text" value={newBean.estateFarm} onChange={(e) => setNewBean({...newBean, estateFarm: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-3">Botanical Reference Image</label>
                <div className="flex items-center gap-6">
                  <label className="flex-grow flex items-center justify-center gap-3 border-2 border-dashed border-stone-200 py-10 hover:border-stone-900 hover:bg-white transition-all cursor-pointer group rounded-sm">
                    <Camera size={24} className="text-stone-300 group-hover:text-stone-900" />
                    <span className="text-stone-400 group-hover:text-stone-900 text-[10px] uppercase tracking-widest font-bold">Upload Media</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {newBean.imageUrl && (
                    <div className="relative w-32 h-32 border border-stone-200 rounded-sm">
                      <img src={newBean.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewBean(prev => ({ ...prev, imageUrl: undefined }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div><label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Processing Methodology</label><input type="text" value={newBean.processMethod} onChange={(e) => setNewBean({...newBean, processMethod: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" /></div>
              <div><label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">MASL (Elevation)</label><input type="text" value={newBean.masl} onChange={(e) => setNewBean({...newBean, masl: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Bulk Density</label><input type="text" value={newBean.density} onChange={(e) => setNewBean({...newBean, density: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" /></div>
                <div><label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Water Act.</label><input type="text" value={newBean.waterActivity} onChange={(e) => setNewBean({...newBean, waterActivity: e.target.value})} className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 py-3 outline-none serif text-xl" /></div>
              </div>

              <div className="md:col-span-2"><label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Initial Cupping Profile</label><textarea rows={3} value={newBean.cuppingNotes} onChange={(e) => setNewBean({...newBean, cuppingNotes: e.target.value})} className="w-full bg-white border border-stone-200 p-4 outline-none serif italic text-lg focus:border-stone-900 rounded-sm" /></div>
              
              <div className="flex items-center gap-4 pt-4">
                <input type="checkbox" id="isPublic" checked={newBean.isPublic} onChange={(e) => setNewBean({...newBean, isPublic: e.target.checked})} className="w-5 h-5 accent-stone-900 cursor-pointer" />
                <label htmlFor="isPublic" className="text-[10px] uppercase tracking-[0.2em] text-stone-500 cursor-pointer font-bold">Allow Public Repository Access</label>
              </div>
              
              <div className="md:col-span-2 mt-8 flex gap-6">
                <button type="submit" className="flex-grow py-5 bg-stone-900 text-white uppercase tracking-[0.4em] text-xs font-semibold hover:bg-stone-800 transition-all shadow-xl rounded-sm">Finalize Record</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-12 py-5 border-2 border-stone-200 text-stone-400 uppercase tracking-[0.4em] text-xs font-semibold hover:border-stone-900 hover:text-stone-900 transition-all rounded-sm">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
