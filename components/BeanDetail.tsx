
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GreenBean, Batch, RoastingData, Milestone, User } from '../types';
import { ChevronLeft, Trash2, Printer, Edit3, Save, X, Calendar, Weight, Info, Download, Target, Zap, Camera, Image as ImageIcon, ClipboardList, Thermometer, Coffee, Activity, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BeanDetailProps {
  currentUser: User;
  beans: GreenBean[];
  onUpdateBean: (bean: GreenBean) => void;
  onDeleteBean: (id: string) => void;
}

const emptyMilestone = (): Milestone => ({ temperature: '', time: '' });
const emptyRoastingData = (): RoastingData => ({
  chargeTemperature: '',
  turningWhite: emptyMilestone(),
  yellowingPoint: emptyMilestone(),
  firstCrack: emptyMilestone(),
  dropBean: emptyMilestone(),
  totalTime: ''
});

const timeToSeconds = (timeStr?: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  try {
    const cleanStr = timeStr.trim();
    if (!cleanStr) return 0;
    const parts = cleanStr.split(':');
    if (parts.length === 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return parseInt(cleanStr, 10) || 0;
  } catch (e) {
    return 0;
  }
};

const secondsToTime = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const calculateMetrics = (currTemp: string, prevTemp: string, intervalTimeStr: string) => {
  const ct = parseFloat(currTemp);
  const pt = parseFloat(prevTemp);
  const secs = timeToSeconds(intervalTimeStr);
  const mins = secs / 60;
  if (isNaN(ct) || isNaN(pt) || mins <= 0) return { ror: null, sd: null };
  const ror = (ct - pt) / mins;
  const sd = ror !== null && ror !== 0 ? 60 / ror : null;
  return { ror, sd };
};

const calculateTotalDuration = (data: RoastingData): string => {
  const sum = 
    timeToSeconds(data.turningWhite.time) +
    timeToSeconds(data.yellowingPoint.time) +
    timeToSeconds(data.firstCrack.time) +
    timeToSeconds(data.dropBean.time);
  
  return sum > 0 ? secondsToTime(sum) : '—';
};

const MILESTONE_LABELS: Record<string, string> = {
  turningWhite: 'Turning White',
  yellowingPoint: 'Yellowing Point',
  firstCrack: 'First Crack',
  dropBean: 'Drop Bean'
};

const BeanDetail: React.FC<BeanDetailProps> = ({ currentUser, beans, onUpdateBean, onDeleteBean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bean = beans.find(b => b.id === id);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'actual' | 'notes'>('overview');
  const [editingBean, setEditingBean] = useState(false);
  const [beanForm, setBeanForm] = useState<GreenBean | null>(null);
  const [batchForm, setBatchForm] = useState<Partial<Batch>>({});
  const [isEditingExistingBatch, setIsEditingExistingBatch] = useState(false);

  const tSym = `°${currentUser.tempUnit}`;

  if (!bean) return <div className="p-20 text-center"><p className="serif text-3xl italic text-stone-300">Identity could not be verified in archives.</p></div>;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'bean' | 'batch') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (target === 'bean') {
        setBeanForm(prev => prev ? ({ ...prev, imageUrl: result }) : null);
      } else {
        setBatchForm(prev => ({ ...prev, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => window.print();

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(bean, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const fileName = `roast_journey_${bean.beanName.replace(/\s+/g, '_').toLowerCase()}.json`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
    } catch (err) { alert("Data extraction failed."); }
  };

  const handlePurgeProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Irreversibly purge this bean record?')) {
      onDeleteBean(bean.id);
      navigate('/home', { replace: true });
    }
  };

  const handleOpenAddBatch = () => {
    const sorted = [...bean.batches].sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime());
    const last = sorted[0];
    setBatchForm({
      id: uuidv4(),
      roastDate: new Date().toISOString().split('T')[0],
      chargeWeight: last?.chargeWeight || 0,
      plan: last?.plan ? JSON.parse(JSON.stringify(last.plan)) : emptyRoastingData(),
      actual: emptyRoastingData(),
      roastingNotes: '',
      tastingNotes: '',
      imageUrl: undefined
    });
    setIsEditingExistingBatch(false);
    setActiveTab('overview');
    setShowBatchModal(true);
  };

  const handleOpenEditBatch = (batch: Batch) => {
    setBatchForm(JSON.parse(JSON.stringify(batch)));
    setIsEditingExistingBatch(true);
    setActiveTab('overview');
    setShowBatchModal(true);
  };

  const handleDeleteBatch = (batchId: string) => {
    if (window.confirm('Delete this thermal analysis record?')) {
      onUpdateBean({ ...bean, batches: bean.batches.filter(b => b.id !== batchId) });
    }
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBatches = isEditingExistingBatch
      ? bean.batches.map(b => b.id === batchForm.id ? (batchForm as Batch) : b)
      : [...bean.batches, batchForm as Batch];
    onUpdateBean({ ...bean, batches: updatedBatches });
    setShowBatchModal(false);
  };

  const getMetricDisplay = (data: RoastingData, key: keyof typeof MILESTONE_LABELS) => {
    let prevTemp = data.chargeTemperature;
    if (key === 'yellowingPoint') prevTemp = data.turningWhite.temperature;
    if (key === 'firstCrack') prevTemp = data.turningWhite.temperature;
    if (key === 'dropBean') prevTemp = data.firstCrack.temperature;
    const { ror, sd } = calculateMetrics((data as any)[key].temperature, prevTemp, (data as any)[key].time);
    return { ror: ror !== null ? ror.toFixed(2) : '—', sd: sd !== null ? sd.toFixed(2) : '—' };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="mb-16 flex flex-wrap items-center justify-between gap-6 no-print">
        <Link to="/home" className="flex items-center gap-3 text-stone-400 hover:text-stone-900 transition-all uppercase tracking-[0.3em] text-[10px] font-bold">
          <ChevronLeft size={16} /> My Journeys
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => { setBeanForm({...bean}); setEditingBean(true); }} className="flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-all uppercase tracking-[0.2em] text-[10px] font-bold">
            <Edit3 size={14} /> Edit Bean
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-all uppercase tracking-[0.2em] text-[10px] font-bold">
            <Download size={16} /> Data Export
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 transition-all uppercase tracking-[0.2em] text-[10px] font-bold">
            <Printer size={16} /> PDF Generation
          </button>
          <button onClick={handlePurgeProfile} className="text-red-300 hover:text-red-700 uppercase tracking-[0.2em] text-[10px] font-bold transition-all px-4">Purge Record</button>
        </div>
      </nav>

      <div className="bg-white border border-stone-100 p-12 mb-16 shadow-lg relative group overflow-hidden rounded-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.5em] text-stone-400 font-bold border-b-2 border-stone-50 pb-2 mb-6 inline-block">Country: {bean.country}</span>
            <h1 className="text-6xl md:text-7xl serif text-stone-900 italic mb-8 tracking-tight">{bean.beanName}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 serif italic text-xl text-stone-700">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-stone-300 block font-sans not-italic mb-1 font-bold">Terroir & Cultivar</span>
                {bean.country} • {bean.cultivar || 'Variety Info N/A'}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-stone-300 block font-sans not-italic mb-1 font-bold">Processing & Elevation</span>
                {bean.processMethod || 'Traditional'} • {bean.masl ? `${bean.masl} MASL` : 'Elevation: N/A'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 border border-stone-50 bg-[#fdfaf5]/30 rounded-sm">
            {bean.imageUrl ? (
              <div className="w-full aspect-square overflow-hidden border-4 border-white shadow-xl rotate-1">
                <img src={bean.imageUrl} alt="Green bean" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              </div>
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-stone-100 text-stone-200">
                <ImageIcon size={48} strokeWidth={1} />
                <span className="text-[8px] uppercase tracking-widest mt-2 font-bold">Botanical Reference Pending</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center border-l border-stone-100 pl-12">
            <div className="mb-10">
              <span className="block text-[10px] uppercase tracking-widest text-stone-300 font-bold mb-2">Bulk Density</span>
              <span className="serif text-stone-900 text-4xl italic">{bean.density || '—'} <small className="text-xs font-sans not-italic text-stone-400">g/L</small></span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-stone-300 font-bold mb-2">Water Activity</span>
              <span className="serif text-stone-900 text-4xl italic">{bean.waterActivity || '—'} <small className="text-xs font-sans not-italic text-stone-400">aw</small></span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-12 border-b-2 border-stone-100 pb-6">
          <h2 className="text-4xl serif text-stone-900 italic">Batch History</h2>
          <button onClick={handleOpenAddBatch} className="px-8 py-3 bg-stone-900 text-white hover:bg-stone-800 transition-all uppercase tracking-[0.2em] text-[10px] font-bold shadow-lg no-print rounded-sm">New Batch</button>
        </div>

        <div className="space-y-24">
          {[...bean.batches].sort((a, b) => new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime()).map((batch, index) => (
            <div key={batch.id} className="bg-white border border-stone-100 shadow-sm page-break-inside-avoid group/batch rounded-sm overflow-hidden">
              <header className="bg-[#fdfaf5] border-b border-stone-100 px-10 py-6 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-10">
                  <span className="text-5xl serif font-bold text-stone-200">Run {bean.batches.length - index}</span>
                  <div className="flex items-center gap-3 text-stone-800"><Calendar size={18}/><span className="serif italic text-2xl">{batch.roastDate}</span></div>
                  <div className="flex items-center gap-3 text-stone-800"><Weight size={18}/><span className="serif italic text-2xl">{batch.chargeWeight}g Net</span></div>
                </div>
                <div className="flex items-center gap-4 no-print opacity-0 group-hover/batch:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditBatch(batch)} className="p-2 text-stone-400 hover:text-stone-900 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold transition-all"><Edit3 size={16} /> Revise</button>
                  <button onClick={() => handleDeleteBatch(batch.id)} className="p-2 text-stone-300 hover:text-red-600 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold transition-all"><Trash2 size={16} /> Delete</button>
                </div>
              </header>
              
              <div className="p-10 space-y-12">
                <div className="overflow-x-auto">
                  <table className="w-full serif border-collapse border border-stone-100">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="p-0"></th>
                        <th colSpan={4} className="bg-amber-50/50 py-3 text-center border-l-2 border-amber-100 font-black uppercase text-[10px] tracking-[0.4em] text-amber-800">The Plan</th>
                        <th colSpan={4} className="bg-stone-100/30 py-3 text-center border-l-2 border-stone-200 font-black uppercase text-[10px] tracking-[0.4em] text-stone-800">The Roast</th>
                      </tr>
                    </thead>
                    <tbody className="text-lg text-stone-800 italic">
                      <tr className="border-b border-stone-50">
                        <td className="py-4 px-3 font-bold not-italic text-[10px] uppercase text-stone-400 tracking-widest bg-stone-50/20">Charge</td>
                        <td className="py-4 px-3 bg-amber-50/30 border-l-2 border-amber-100 font-bold">{batch.plan.chargeTemperature}{batch.plan.chargeTemperature && tSym}</td>
                        <td className="py-4 px-3 bg-amber-50/30">—</td><td className="py-4 px-3 bg-amber-50/30">—</td><td className="py-4 px-3 bg-amber-50/30">—</td>
                        <td className="py-4 px-3 bg-white border-l-2 border-stone-200 font-bold">{batch.actual.chargeTemperature}{batch.actual.chargeTemperature && tSym}</td>
                        <td className="py-4 px-3 bg-white">—</td><td className="py-4 px-3 bg-white">—</td><td className="py-4 px-3 bg-white">—</td>
                      </tr>
                      {Object.keys(MILESTONE_LABELS).map((key) => {
                        const planMet = getMetricDisplay(batch.plan, key as any);
                        const actMet = getMetricDisplay(batch.actual, key as any);
                        return (
                          <tr key={key} className="border-b border-stone-50 hover:bg-stone-50/30 transition-colors">
                            <td className="py-4 px-3 font-bold not-italic text-[10px] uppercase text-stone-400 tracking-widest bg-stone-50/20">{MILESTONE_LABELS[key]}</td>
                            <td className="py-4 px-3 bg-amber-50/30 border-l-2 border-amber-100">{(batch.plan as any)[key].temperature}{tSym}</td>
                            <td className="py-4 px-3 bg-amber-50/30">{(batch.plan as any)[key].time}</td>
                            <td className="py-4 px-3 bg-amber-50/30 text-amber-900/50 text-sm font-sans not-italic">{planMet.ror} ROR</td>
                            <td className="py-4 px-3 bg-amber-50/30 text-amber-900/50 text-sm font-sans not-italic">{planMet.sd} S/D</td>
                            <td className="py-4 px-3 bg-white border-l-2 border-stone-200">{(batch.actual as any)[key].temperature}{tSym}</td>
                            <td className="py-4 px-3 bg-white">{(batch.actual as any)[key].time}</td>
                            <td className="py-4 px-3 text-stone-900 text-sm font-sans not-italic font-bold">{actMet.ror} ROR</td>
                            <td className="py-4 px-3 text-stone-900 text-sm font-sans not-italic font-bold">{actMet.sd} S/D</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-stone-50 text-stone-900 font-bold not-italic border-t border-stone-200">
                        <td className="py-4 px-3 uppercase tracking-[0.2em] text-[10px] text-stone-400">Total Duration</td>
                        <td className="py-4 px-3 border-l-2 border-stone-200 bg-amber-50/40" colSpan={4}>
                           <div className="flex items-center gap-2 font-sans text-sm"><Clock size={14} className="text-amber-600" /> {calculateTotalDuration(batch.plan)}</div>
                        </td>
                        <td className="py-4 px-3 border-l-2 border-stone-200 bg-white" colSpan={4}>
                           <div className="flex items-center gap-2 font-sans text-sm"><Clock size={14} className="text-stone-400" /> {calculateTotalDuration(batch.actual)}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showBatchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#fdfaf5] w-full max-w-5xl p-12 border border-stone-200 shadow-2xl my-8 relative rounded-sm">
            <button onClick={() => setShowBatchModal(false)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-900"><X size={24}/></button>
            <h2 className="text-4xl serif text-stone-900 mb-10 italic">{isEditingExistingBatch ? 'Revise Analysis' : 'New Batch'}</h2>
            
            <div className="flex gap-8 border-b border-stone-100 mb-10 overflow-x-auto no-scrollbar">
              {(['overview', 'plan', 'actual', 'notes'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-4 text-[10px] uppercase tracking-[0.4em] font-bold transition-all border-b-2 ${activeTab === tab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-300 hover:text-stone-600'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-10">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-3">Roast Date</label>
                    <input type="date" value={batchForm.roastDate} onChange={e => setBatchForm({...batchForm, roastDate: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-3">Charge weight (g)</label>
                    <input type="number" value={batchForm.chargeWeight} onChange={e => setBatchForm({...batchForm, chargeWeight: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
                  </div>
                </div>
              )}

              {(activeTab === 'plan' || activeTab === 'actual') && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-stone-50 border border-stone-100 rounded-sm">
                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-3">Charge Temperature ({tSym})</label>
                      <input type="text" value={(batchForm[activeTab] as RoastingData).chargeTemperature} onChange={e => setBatchForm({...batchForm, [activeTab]: {...(batchForm[activeTab] as RoastingData), chargeTemperature: e.target.value}})} className="w-full bg-white border border-stone-100 p-4 serif text-3xl italic outline-none focus:border-stone-900" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.keys(MILESTONE_LABELS).map(key => (
                      <div key={key} className="p-8 border border-stone-100 rounded-sm">
                        <h4 className="text-[10px] uppercase tracking-widest text-stone-900 font-black mb-6 border-b border-stone-50 pb-2">{MILESTONE_LABELS[key]}</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-stone-300 font-bold mb-2">Temp ({tSym})</label>
                            <input type="text" value={(batchForm[activeTab] as any)[key].temperature} onChange={e => {
                              const newData = {...(batchForm[activeTab] as any)};
                              newData[key].temperature = e.target.value;
                              setBatchForm({...batchForm, [activeTab]: newData});
                            }} className="w-full bg-transparent border-b border-stone-200 py-2 serif text-xl outline-none focus:border-stone-900" />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-stone-300 font-bold mb-2">Time (MM:SS)</label>
                            <input type="text" placeholder="00:00" value={(batchForm[activeTab] as any)[key].time} onChange={e => {
                              const newData = {...(batchForm[activeTab] as any)};
                              newData[key].time = e.target.value;
                              setBatchForm({...batchForm, [activeTab]: newData});
                            }} className="w-full bg-transparent border-b border-stone-200 py-2 serif text-xl outline-none focus:border-stone-900" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-10">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-3">Roasting Adjustments</label>
                    <textarea rows={5} value={batchForm.roastingNotes} onChange={e => setBatchForm({...batchForm, roastingNotes: e.target.value})} className="w-full bg-white border border-stone-100 p-6 serif text-xl italic outline-none focus:border-stone-900 rounded-sm" />
                  </div>
                </div>
              )}

              <div className="flex gap-6 pt-10 border-t border-stone-50">
                <button type="submit" className="flex-grow py-5 bg-stone-900 text-white uppercase tracking-[0.4em] text-xs font-bold hover:bg-stone-800 transition-all rounded-sm">Save Analysis</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBean && beanForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#fdfaf5] w-full max-w-4xl p-12 border border-stone-200 shadow-2xl my-8 relative rounded-sm">
            <button onClick={() => setEditingBean(false)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-900 transition-colors"><X size={24}/></button>
            <h2 className="text-4xl serif text-stone-900 mb-10 italic">Modify Bean Archive</h2>
            <form onSubmit={e => { e.preventDefault(); onUpdateBean(beanForm); setEditingBean(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Bean Designation *</label>
                <input required type="text" value={beanForm.beanName} onChange={e => setBeanForm({...beanForm, beanName: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Country (e.g. Ethiopia) *</label>
                <input required type="text" value={beanForm.country} onChange={e => setBeanForm({...beanForm, country: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Variety / Cultivar Detail</label>
                <input type="text" value={beanForm.cultivar || ''} onChange={e => setBeanForm({...beanForm, cultivar: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Estate / Producer / Microlot</label>
                <input type="text" value={beanForm.estateFarm || ''} onChange={e => setBeanForm({...beanForm, estateFarm: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Processing Methodology</label>
                <input type="text" value={beanForm.processMethod || ''} onChange={e => setBeanForm({...beanForm, processMethod: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Elevation (MASL)</label>
                <input type="text" value={beanForm.masl || ''} onChange={e => setBeanForm({...beanForm, masl: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Bulk Density</label>
                  <input type="text" value={beanForm.density || ''} onChange={e => setBeanForm({...beanForm, density: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Water Act.</label>
                  <input type="text" value={beanForm.waterActivity || ''} onChange={e => setBeanForm({...beanForm, waterActivity: e.target.value})} className="w-full bg-transparent border-b border-stone-200 py-3 serif text-xl outline-none focus:border-stone-900" />
                </div>
              </div>

              <div className="md:col-span-2 mt-8 flex gap-6">
                <button type="submit" className="flex-grow py-5 bg-stone-900 text-white uppercase tracking-[0.4em] text-xs font-bold hover:bg-stone-800 transition-all shadow-xl rounded-sm">Apply Revisions</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeanDetail;
