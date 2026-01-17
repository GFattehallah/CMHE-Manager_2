import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Banknote, TrendingDown, TrendingUp, Plus, Calendar, 
  Trash2, PieChart as PieIcon, BarChart3, Filter, Coins, Receipt, Users, PlusCircle,
  Download, FileSpreadsheet, ChevronRight, Upload, CheckCircle2, AlertCircle, X, Info,
  CheckSquare, Square, MinusSquare, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DataService } from '../services/dataService';
import { Expense, Invoice, ExpenseCategory, EXPENSE_CATEGORIES, PaymentType, Patient } from '../types';

const CATEGORY_COLORS = {
  FIXED: '#3b82f6',    
  CONSUMABLE: '#f59e0b', 
  SALARY: '#10b981',   
  EQUIPMENT: '#8b5cf6', 
  TAX: '#ef4444',      
  OTHER: '#64748b'     
};

export const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'revenues'>('overview');
  const [viewType, setViewType] = useState<'day' | 'month' | 'year'>('month');
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'EXPENSE' | 'REVENUE'>('EXPENSE');
  
  const [filterDay, setFilterDay] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [exp, inv, pat] = await Promise.all([
        DataService.getExpenses(),
        DataService.getInvoices(),
        DataService.getPatients()
      ]);
      setExpenses(exp);
      setInvoices(inv);
      setPatients(pat);
      setSelectedIds([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    years.add(new Date().getFullYear() - 1);
    expenses.forEach(e => years.add(new Date(e.date).getFullYear()));
    invoices.forEach(i => years.add(new Date(i.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, invoices]);

  const currentPeriodData = useMemo(() => {
    const filteredExp = expenses.filter(e => {
      const d = new Date(e.date);
      if (viewType === 'day') return e.date.startsWith(filterDay);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = viewType === 'year' ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    });

    const filteredInv = invoices.filter(i => {
      const d = new Date(i.date);
      if (i.status !== 'PAID') return false;
      if (viewType === 'day') return i.date.startsWith(filterDay);
      const yearMatch = d.getFullYear() === filterYear;
      const monthMatch = viewType === 'year' ? true : d.getMonth() === filterMonth;
      return yearMatch && monthMatch;
    });

    return { expenses: filteredExp, invoices: filteredInv };
  }, [expenses, invoices, filterDay, filterMonth, filterYear, viewType]);

  const totalIncome = currentPeriodData.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = currentPeriodData.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netResult = totalIncome - totalExpense;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (items: (Expense | Invoice)[]) => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Supprimer définitivement les ${selectedIds.length} éléments sélectionnés ?`)) {
      setIsRefreshing(true);
      try {
        const idsToRemove = [...selectedIds];
        if (activeTab === 'expenses') {
          await DataService.deleteExpensesBulk(idsToRemove);
        } else if (activeTab === 'revenues') {
          await DataService.deleteInvoicesBulk(idsToRemove);
        }
        await loadData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleDeleteItem = async (id: string, type: 'EXP' | 'INV') => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    setIsRefreshing(true);
    try {
      if (type === 'EXP') await DataService.deleteExpense(id);
      else await DataService.deleteInvoice(id);
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const formatInvoices = (data: Invoice[]) => data.map(inv => ({
      'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
      'Patient': patients.find(p => p.id === inv.patientId)?.lastName || 'Divers',
      'Mode': inv.paymentMethod,
      'Montant': inv.amount
    }));
    const formatExpenses = (data: Expense[]) => data.map(exp => ({
      'Date': new Date(exp.date).toLocaleDateString('fr-FR'),
      'Catégorie': EXPENSE_CATEGORIES[exp.category],
      'Désignation': exp.description,
      'Montant': exp.amount
    }));
    if (activeTab === 'overview' || activeTab === 'revenues') {
      const wsRev = XLSX.utils.json_to_sheet(formatInvoices(currentPeriodData.invoices));
      XLSX.utils.book_append_sheet(wb, wsRev, 'Recettes');
    }
    if (activeTab === 'overview' || activeTab === 'expenses') {
      const wsExp = XLSX.utils.json_to_sheet(formatExpenses(currentPeriodData.expenses));
      XLSX.utils.book_append_sheet(wb, wsExp, 'Dépenses');
    }
    XLSX.writeFile(wb, `Compta_Cabinet_${filterYear}.xlsx`);
  };

  const annualChartData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const inc = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === i && d.getFullYear() === filterYear && inv.status === 'PAID';
      }).reduce((sum, inv) => sum + inv.amount, 0);
      const exp = expenses.filter(ex => {
        const d = new Date(ex.date);
        return d.getMonth() === i && d.getFullYear() === filterYear;
      }).reduce((sum, ex) => sum + ex.amount, 0);
      return {
        name: new Date(0, i).toLocaleString('fr-FR', { month: 'short' }),
        Recettes: inc,
        Dépenses: exp
      };
    });
  }, [invoices, expenses, filterYear]);

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white"><Banknote size={24} /></div>
             Trésorerie & Finance
          </h1>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2">Flux du cabinet {isRefreshing && <RefreshCw size={14} className="animate-spin text-indigo-500" />}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 font-bold shadow-sm transition-all"><FileSpreadsheet size={18} /> Exporter</button>
          <div className="h-10 w-px bg-slate-200 mx-1 hidden md:block"></div>
          <button onClick={() => setIsRevenueModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition font-bold"><TrendingUp size={20}/> Recette</button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-rose-700 transition font-bold"><TrendingDown size={20}/> Dépense</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Synthèse</button>
          <button onClick={() => setActiveTab('revenues')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'revenues' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Encaissements</button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Décaissements</button>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto px-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['day', 'month', 'year'].map(vt => (
              <button key={vt} onClick={() => setViewType(vt as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${viewType === vt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{vt === 'day' ? 'Jour' : vt === 'month' ? 'Mois' : 'Année'}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {viewType === 'day' && <input type="date" value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="bg-transparent text-sm font-black text-slate-700 outline-none"/>}
            {viewType === 'month' && <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-slate-700 outline-none">{Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>)}</select>}
            <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-slate-700 outline-none border-l pl-2 border-slate-200">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pr-1">
        {activeTab === 'overview' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encaissements</p><p className="text-3xl font-black text-emerald-600">{totalIncome.toLocaleString()} <span className="text-xs">MAD</span></p></div><div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={28}/></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Décaissements</p><p className="text-3xl font-black text-rose-600">{totalExpense.toLocaleString()} <span className="text-xs">MAD</span></p></div><div className="p-4 bg-rose-50 rounded-2xl text-rose-600"><TrendingDown size={28}/></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Résultat Net</p><p className={`text-3xl font-black ${netResult >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{netResult.toLocaleString()} <span className="text-xs">MAD</span></p></div><div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Coins size={28}/></div></div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px]">
              <h3 className="font-black text-slate-800 mb-6 uppercase text-sm tracking-widest">Évolution des flux ({filterYear})</h3>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={annualChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 10, fontWeight: 700 }}/><YAxis axisLine={false} tickLine={false} style={{ fontSize: 10 }}/><RechartsTooltip/><Legend/><Bar dataKey="Recettes" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Liste des {activeTab === 'revenues' ? 'Recettes' : 'Dépenses'}</p>
                <button onClick={() => { setImportType(activeTab === 'revenues' ? 'REVENUE' : 'EXPENSE'); setIsImportModalOpen(true); }} className="bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-black transition-all"><Upload size={14}/> Importer Excel</button>
             </div>
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="p-5 pl-8 w-10">
                        <button onClick={() => handleSelectAll(activeTab === 'revenues' ? currentPeriodData.invoices : currentPeriodData.expenses)} className="text-slate-400">
                           {selectedIds.length > 0 ? (selectedIds.length === (activeTab === 'revenues' ? currentPeriodData.invoices.length : currentPeriodData.expenses.length) ? <CheckSquare size={18} className="text-indigo-600"/> : <MinusSquare size={18}/>) : <Square size={18}/>}
                        </button>
                      </th>
                      <th className="p-5">Date</th>
                      <th className="p-5">Désignation</th>
                      <th className="p-5">Mode</th>
                      <th className="p-5 text-right">Montant</th>
                      <th className="p-5 text-center pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'revenues' ? currentPeriodData.invoices : currentPeriodData.expenses).map((item: any) => (
                      <tr key={item.id} className={`transition group ${selectedIds.includes(item.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-5 pl-8">
                          <button onClick={() => handleToggleSelect(item.id)} className={selectedIds.includes(item.id) ? "text-indigo-600" : "text-slate-300"}>
                            {selectedIds.includes(item.id) ? <CheckSquare size={18}/> : <Square size={18}/>}
                          </button>
                        </td>
                        <td className="p-5 text-xs font-bold text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-5">
                          <div className="font-bold text-slate-800 text-sm">
                            {activeTab === 'revenues' ? (patients.find(p => p.id === item.patientId)?.lastName || 'Recette Divers') : item.description}
                          </div>
                          {activeTab === 'expenses' && <div className="text-[9px] font-bold text-slate-400 uppercase">{EXPENSE_CATEGORIES[item.category as ExpenseCategory]}</div>}
                        </td>
                        <td className="p-5 text-[10px] font-black uppercase text-slate-500">{item.paymentMethod}</td>
                        <td className={`p-5 text-right font-black text-sm ${activeTab === 'revenues' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {activeTab === 'expenses' ? '-' : ''}{item.amount.toLocaleString()} MAD
                        </td>
                        <td className="p-5 text-center pr-8">
                           <button onClick={() => handleDeleteItem(item.id, activeTab === 'revenues' ? 'INV' : 'EXP')} className="text-slate-300 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in w-full max-w-md px-4">
          <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4 pl-4"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">{selectedIds.length}</div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Éléments</p></div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds([])} className="px-4 py-2 text-[10px] font-bold uppercase">Annuler</button>
              <button onClick={handleDeleteBulk} className="bg-red-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase shadow-lg"><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && <ExpenseModal onClose={() => setIsExpenseModalOpen(false)} onSave={async (e: any) => { await DataService.saveExpense(e); loadData(); setIsExpenseModalOpen(false); }} />}
      {isRevenueModalOpen && <RevenueModal patients={patients} onClose={() => setIsRevenueModalOpen(false)} onSave={async (i: any) => { await DataService.saveInvoice(i); loadData(); setIsRevenueModalOpen(false); }} />}
      {isImportModalOpen && <FinanceImportModal type={importType} patients={patients} onClose={() => setIsImportModalOpen(false)} onImported={loadData} />}
    </div>
  );
};

const FinanceImportModal = ({ type, onClose, onImported, patients }: { type: 'EXPENSE' | 'REVENUE', onClose: () => void, onImported: () => void, patients: Patient[] }) => {
  const [previews, setPreviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) => str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

  const parseExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }
    if (typeof val === 'string' && val.trim().length > 0) {
        const parts = val.split(/[\/\-\.]/);
        if (parts.length === 3) {
            let d, m, y;
            if (parts[2].length === 4) { d = parts[0]; m = parts[1]; y = parts[2]; }
            else if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
            else { d = parts[0]; m = parts[1]; y = '20' + parts[2]; }
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mapped = data.map(row => {
          const keys = Object.keys(row);
          const getVal = (keywords: string[]) => {
            const foundKey = keys.find(k => keywords.some(kw => normalize(k).includes(normalize(kw))));
            return foundKey ? row[foundKey] : null;
          };

          const amount = parseFloat((getVal(['montant', 'prix', 'total', 'valeur']) || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'));
          const date = parseExcelDate(getVal(['date', 'jour', 'le']));
          const modeRaw = normalize((getVal(['paiement', 'mode', 'reglement', 'type']) || 'Especes').toString());
          
          let paymentMethod = PaymentType.CASH;
          if (modeRaw.includes('cheque')) paymentMethod = PaymentType.CHECK;
          else if (modeRaw.includes('virement')) paymentMethod = PaymentType.VIREMENT;
          else if (modeRaw.includes('carte')) paymentMethod = PaymentType.CARD;

          if (type === 'EXPENSE') {
            return { id: `IMP-E-${Math.random()}`, date, amount, description: (getVal(['designation', 'motif', 'label']) || 'Dépense Importée').toString(), category: 'OTHER', paymentMethod };
          } else {
            const patientName = (getVal(['patient', 'client', 'nom']) || '').toString();
            let patientId = 'divers';
            if (patientName) {
                const p = patients.find(pat => normalize(pat.lastName).includes(normalize(patientName)) || normalize(patientName).includes(normalize(pat.lastName)));
                if (p) patientId = p.id;
            }
            return { id: `IMP-R-${Math.random()}`, date, amount, patientId, patientName: patientName || 'Divers', paymentMethod };
          }
        });
        setPreviews(mapped.filter(m => m.amount > 0));
      } catch (err) { alert("Erreur fichier"); } finally { setIsLoading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    setIsLoading(true);
    try {
      for(const item of previews) {
        if (type === 'EXPENSE') {
          await DataService.saveExpense({ ...item, id: `EXP-${Date.now()}-${Math.random()}` });
        } else {
          await DataService.saveInvoice({ 
            id: `INV-${Date.now()}-${Math.random()}`, 
            patientId: item.patientId, 
            date: item.date, 
            amount: item.amount, 
            status: 'PAID', 
            paymentMethod: item.paymentMethod, 
            items: [{ description: 'Recette Importée', price: item.amount }] 
          });
        }
      }
      onImported();
      onClose();
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className={`p-6 text-white flex justify-between items-center ${type === 'EXPENSE' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><FileSpreadsheet size={18}/> Import {type === 'EXPENSE' ? 'Dépenses' : 'Recettes'}</h2>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto min-h-[300px]">
          {previews.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
              <Upload size={48} className="text-slate-300 mb-4"/>
              <p className="font-black text-slate-800 uppercase tracking-tighter">Cliquer pour charger le fichier Excel</p>
              <input type="file" ref={fileInputRef} onChange={handleFile} accept=".xlsx, .xls" className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500">{previews.length} lignes identifiées. Prêt pour l'import.</p>
              <div className="border border-slate-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 font-black uppercase sticky top-0"><tr><th className="p-3">Date</th><th className="p-3">Détail</th><th className="p-3 text-right">Montant</th></tr></thead>
                  <tbody className="divide-y">
                    {previews.map((p, i) => (
                      <tr key={i}>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3 truncate max-w-[200px]">{type === 'EXPENSE' ? p.description : p.patientName}</td>
                        <td className="p-3 text-right font-bold">{p.amount} MAD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase">Annuler</button>
           <button disabled={previews.length === 0 || isLoading} onClick={confirmImport} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl shadow-xl font-black text-[10px] uppercase disabled:opacity-50">Confirmer l'importation</button>
        </div>
      </div>
    </div>
  );
};

const ExpenseModal = ({ onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({ 
          id: `EXP-${Date.now()}`, 
          date: formData.get('date') as string, 
          category: formData.get('category') as ExpenseCategory, 
          amount: parseFloat(formData.get('amount') as string), 
          description: formData.get('description') as string, 
          paymentMethod: formData.get('paymentMethod') as PaymentType 
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fade-in">
                <div className="p-8 bg-rose-600 text-white flex justify-between items-center"><h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingDown size={18}/> Nouvelle Dépense</h2><button onClick={onClose} className="text-3xl">&times;</button></div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border rounded-xl font-bold outline-none"/></div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant</label><input name="amount" type="number" step="0.01" required className="w-full p-3 border rounded-xl font-black outline-none"/></div>
                    </div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Désignation</label><input name="description" required className="w-full p-3 border rounded-xl outline-none"/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Catégorie</label><select name="category" className="w-full p-3 border rounded-xl text-xs font-bold outline-none">{Object.entries(EXPENSE_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode</label><select name="paymentMethod" className="w-full p-3 border rounded-xl text-xs font-bold outline-none">{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    </div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Annuler</button><button type="submit" className="flex-[2] py-4 bg-rose-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-lg">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};

const RevenueModal = ({ patients, onClose, onSave }: any) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({ 
          id: `INV-${Date.now()}`, 
          patientId: formData.get('patientId') as string, 
          date: formData.get('date') as string, 
          amount: parseFloat(formData.get('amount') as string), 
          status: 'PAID', 
          paymentMethod: formData.get('paymentMethod') as PaymentType, 
          items: [{ description: 'Recette Directe', price: parseFloat(formData.get('amount') as string) }] 
        });
    };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fade-in">
                <div className="p-8 bg-emerald-600 text-white flex justify-between items-center"><h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><TrendingUp size={18}/> Nouvelle Recette</h2><button onClick={onClose} className="text-3xl">&times;</button></div>
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border rounded-xl font-bold outline-none"/></div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant</label><input name="amount" type="number" step="0.01" required className="w-full p-3 border rounded-xl font-black outline-none"/></div>
                    </div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient</label><select name="patientId" className="w-full p-3 border rounded-xl text-xs font-bold outline-none"><option value="divers">-- Recette Divers --</option>{patients.map((p: Patient) => <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName}</option>)}</select></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode</label><select name="paymentMethod" className="w-full p-3 border rounded-xl text-xs font-bold outline-none">{Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Annuler</button><button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-lg">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};