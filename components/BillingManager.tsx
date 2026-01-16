
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileText, Plus, Search, Printer, Download, CreditCard, 
  CheckCircle, AlertCircle, TrendingUp, RefreshCw, Trash2, Filter, Receipt, Upload, 
  ChevronRight, FileSpreadsheet, CheckCircle2, RefreshCcw, CheckSquare, Square, MinusSquare
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Invoice, Patient, PaymentType, Permission } from '../types';
import { InvoiceTemplate } from './InvoiceTemplate';

const MEDICAL_ACTS = [
  { label: 'Consultation Standard', price: 200.00 },
  { label: 'Consultation + ECG', price: 350.00 },
  { label: 'Échographie Abdominale', price: 400.00 },
  { label: 'Échographie Pelvienne', price: 400.00 },
  { label: 'Suivi de Grossesse', price: 250.00 },
  { label: 'Certificat Médical', price: 100.00 },
];

export const BillingManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'month' | 'year' | 'all'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const currentUser = AuthService.getCurrentUser();
  const canSeeStats = currentUser?.permissions.includes(Permission.STATS);
  const canViewHistory = currentUser?.permissions.includes(Permission.BILLING_VIEW);

  useEffect(() => {
    loadData();
  }, [canViewHistory]);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, periodFilter]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      if (canViewHistory) {
        const allInvoices = await DataService.getInvoices();
        setInvoices(allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setInvoices([]);
      }
      const allPatients = await DataService.getPatients();
      setPatients(allPatients);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    return invoices.filter(inv => {
      const p = getPatient(inv.patientId);
      const term = searchTerm.toLowerCase();
      const matchSearch = term 
        ? (p ? (p.lastName.toLowerCase().includes(term) || p.firstName.toLowerCase().includes(term)) : "divers".includes(term))
        : true;

      if (!matchSearch) return false;

      const invDate = new Date(inv.date);
      if (periodFilter === 'today') return inv.date.startsWith(todayStr);
      if (periodFilter === 'month') return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      if (periodFilter === 'year') return invDate.getFullYear() === now.getFullYear();
      
      return true;
    });
  }, [invoices, patients, searchTerm, periodFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Confirmer la suppression de ${selectedIds.length} facture(s) ?`)) {
      setIsRefreshing(true);
      try {
        await DataService.deleteInvoicesBulk(selectedIds);
        setSelectedIds([]);
        await loadData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = filteredInvoices.map(inv => {
      const p = getPatient(inv.patientId);
      return {
        'N° Facture': inv.id.slice(-6).toUpperCase(),
        'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
        'Patient': p ? `${p.lastName.toUpperCase()} ${p.firstName}` : 'Divers',
        'Montant (MAD)': inv.amount,
        'Mode': inv.paymentMethod,
        'Statut': inv.status === 'PAID' ? 'Payée' : 'Attente'
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Factures');
    XLSX.writeFile(wb, `Factures_${new Date().getFullYear()}.xlsx`);
  };

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => {
        const element = document.getElementById('invoice-render-target');
        const p = getPatient(invoice.patientId);
        const opt = {
          margin: 0,
          filename: `Facture_${invoice.id}_${p?.lastName || 'Divers'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        (window as any).html2pdf().set(opt).from(element).save();
    }, 100);
  };

  const handleStatusToggle = async (invoice: Invoice) => {
    const newStatus: 'PAID' | 'PENDING' = invoice.status === 'PAID' ? 'PENDING' : 'PAID';
    await DataService.saveInvoice({ ...invoice, status: newStatus });
    loadData();
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      setIsRefreshing(true);
      try {
        await DataService.deleteInvoice(id);
        await loadData();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const formatMAD = (val: number) => val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Receipt size={24} />
              </div>
              Facturation & Honoraires
            </h1>
            <p className="text-slate-500 font-medium ml-1 flex items-center gap-2">
              Gestion des revenus
              {isRefreshing && <RefreshCcw size={14} className="animate-spin text-medical-600" />}
            </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 hover:border-emerald-500 transition font-bold text-sm shadow-sm"
          >
            <FileSpreadsheet size={18} /> Exporter
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition font-bold text-sm shadow-sm"
          >
            <Upload size={18} /> Importer
          </button>
          <button 
            onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}
            className="bg-medical-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-medical-100 hover:bg-medical-700 transition active:scale-95 font-bold text-sm"
          >
            <Plus size={20} /> Nouvelle Facture
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden relative z-10">
          {canViewHistory ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Chercher un patient..." 
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-medical-500 bg-white text-sm outline-none font-medium"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                        {['today', 'month', 'year', 'all'].map(p => (
                          <button key={p} onClick={() => setPeriodFilter(p as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${periodFilter === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                            {p === 'today' ? "Aujourd'hui" : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Tout'}
                          </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-20">
                            <tr>
                                <th className="p-4 pl-8 w-10">
                                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-600 transition">
                                    {selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0 ? (
                                      <CheckSquare size={18} className="text-indigo-600" />
                                    ) : selectedIds.length > 0 ? (
                                      <MinusSquare size={18} className="text-indigo-400" />
                                    ) : (
                                      <Square size={18} />
                                    )}
                                  </button>
                                </th>
                                <th className="p-4">Facture</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Mode</th>
                                <th className="p-4 text-right">Montant</th>
                                <th className="p-4 text-center">Statut</th>
                                <th className="p-4 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInvoices.map((inv: Invoice) => {
                                const p = getPatient(inv.patientId);
                                const isSelected = selectedIds.includes(inv.id);
                                return (
                                    <tr key={inv.id} className={`transition group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                        <td className="p-4 pl-8">
                                          <button onClick={() => handleToggleSelect(inv.id)} className={`transition ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                          </button>
                                        </td>
                                        <td className="p-4 font-mono text-slate-400 text-xs">#{inv.id.slice(-6).toUpperCase()}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-sm">{p ? `${p.lastName} ${p.firstName}` : "Divers"}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(inv.date).toLocaleDateString('fr-FR')}</div>
                                        </td>
                                        <td className="p-4 text-[10px] font-black uppercase text-slate-500">{inv.paymentMethod}</td>
                                        <td className="p-4 text-right font-black text-slate-900 text-sm">{inv.amount.toLocaleString('fr-FR')} MAD</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleStatusToggle(inv)} className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {inv.status === 'PAID' ? 'Payée' : 'Attente'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => handleDownloadPDF(inv)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"><Download size={18} /></button>
                                                <button onClick={() => handlePrint(inv)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Printer size={18} /></button>
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-fade-in">
              <Receipt size={48} className="text-medical-600 mb-6" />
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Saisie Rapide</h2>
              <button onClick={() => setIsModalOpen(true)} className="mt-8 bg-medical-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-medical-700 transition">Nouvelle facture</button>
            </div>
          )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in w-full max-w-lg px-4">
          <div className="bg-slate-900 text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md bg-slate-900/90 pointer-events-auto">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">{selectedIds.length}</div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Éléments</p>
            </div>
            <div className="flex gap-2 pr-2">
              <button onClick={() => setSelectedIds([])} className="px-4 py-2.5 text-[10px] font-black uppercase hover:bg-white/5 rounded-xl transition">Annuler</button>
              <button onClick={handleDeleteBulk} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase shadow-lg shadow-rose-900/20 transition-all">
                <Trash2 size={14} /> Supprimer Tout
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <InvoiceModal 
            patients={patients} 
            onClose={() => setIsModalOpen(false)} 
            onSave={async (inv: Invoice) => {
                await DataService.saveInvoice(inv);
                loadData();
                setIsModalOpen(false);
                if (!canViewHistory) handlePrint(inv);
            }} 
        />
      )}

      {isImportModalOpen && (
        <InvoiceImportModal 
            patients={patients}
            onClose={() => setIsImportModalOpen(false)}
            onImported={() => { loadData(); setIsImportModalOpen(false); }}
        />
      )}

      <div className="print-only">
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} patient={getPatient(selectedInvoice.patientId)} />}
      </div>
      <div className="pdf-container">
        {selectedInvoice && (
            <div id="invoice-render-target">
                <InvoiceTemplate invoice={selectedInvoice} patient={getPatient(selectedInvoice.patientId)} />
            </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: translate(-50%, 100px); opacity: 0; }
          60% { transform: translate(-50%, -10px); opacity: 1; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

// --- MODAL D'IMPORTATION EXCEL POUR FACTURES ---
const InvoiceImportModal = ({ onClose, onImported, patients }: { onClose: () => void, onImported: () => void, patients: Patient[] }) => {
  const [previews, setPreviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultDate, setDefaultDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const normalize = (str: string) => 
    str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") : "";

  const parseExcelDate = (val: any): string => {
    if (!val) return defaultDate;
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    try {
      if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) {}
    return defaultDate;
  };

  const parseAmount = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    let str = val.toString().replace(/\s/g, '').replace(/[A-Za-z]/g, '').replace(',', '.'); 
    const parts = str.split('.');
    if (parts.length > 2) {
      const decimal = parts.pop();
      str = parts.join('') + '.' + decimal;
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
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
            const normalizedKeywords = keywords.map(k => normalize(k));
            const foundKey = keys.find(k => {
              const nk = normalize(k);
              return normalizedKeywords.some(kw => nk.includes(kw));
            });
            return foundKey ? row[foundKey] : null;
          };

          const amount = parseAmount(getVal(['montant', 'prix', 'valeur', 'somme', 'amount', 'total', 'honoraire', 'frais']));
          const date = parseExcelDate(getVal(['date', 'jour', 'periode']));
          const description = (getVal(['designation', 'motif', 'acte', 'libelle', 'description']) || 'Recette Importée').toString();
          const patientName = (getVal(['patient', 'client', 'nom', 'prenom', 'beneficiaire']) || '').toString();
          
          const rawPayment = normalize((getVal(['paiement', 'mode', 'reglement', 'type']) || 'Especes').toString());
          let paymentMethod = PaymentType.CASH;
          if (rawPayment.includes('cheque')) paymentMethod = PaymentType.CHECK;
          else if (rawPayment.includes('virement')) paymentMethod = PaymentType.VIREMENT;
          else if (rawPayment.includes('carte') || rawPayment.includes('cb')) paymentMethod = PaymentType.CARD;

          let patientId = 'divers';
          if (patientName.trim()) {
              const p = patients.find(pat => normalize(pat.lastName).includes(normalize(patientName)) || normalize(patientName).includes(normalize(pat.lastName)));
              if (p) patientId = p.id;
          }

          return { date, amount, patientId, patientName: patientName || 'Divers', paymentMethod, description };
        });
        setPreviews(mapped.filter(m => m.amount > 0));
      } catch (err) {
        alert("Erreur de lecture.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (previews.length === 0) return;
    setIsLoading(true);
    try {
      const payload = previews.map(item => ({
        id: `INV-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientId: item.patientId || 'divers',
        date: item.date,
        amount: item.amount,
        status: 'PAID' as any,
        paymentMethod: item.paymentMethod,
        items: [{ description: item.description, price: item.amount }]
      }));
      for(const inv of payload) await DataService.saveInvoice(inv);
      onImported();
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><FileSpreadsheet size={18}/> Importer les Recettes</h2>
          <button onClick={onClose} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto">
          {previews.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 rounded-[2rem] p-20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
              <Upload size={48} className="text-slate-300 mb-4 group-hover:scale-110 transition-transform"/>
              <p className="font-black text-slate-800 text-sm uppercase tracking-tighter">Choisir un fichier Excel (.xlsx)</p>
              <input type="file" ref={fileInputRef} onChange={handleFile} accept=".xlsx, .xls" className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3 text-indigo-700 text-xs font-bold border border-indigo-100">
                 <CheckCircle2 size={16}/> {previews.length} lignes détectées.
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="p-4">Date</th><th className="p-4">Patient / Motif</th><th className="p-4">Mode</th><th className="p-4 text-right">Montant</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {previews.map((p, i) => (
                      <tr key={i}><td className="p-4 font-bold text-slate-400">{p.date}</td><td className="p-4"><div>{p.patientName}</div><div className="text-[9px] font-bold text-slate-400 uppercase">{p.description}</div></td><td className="p-4 uppercase font-black text-slate-500">{p.paymentMethod}</td><td className="p-4 text-right font-black text-emerald-600">{p.amount.toFixed(2)} MAD</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] bg-white border border-slate-200 rounded-2xl transition">Annuler</button>
           <button disabled={previews.length === 0 || isLoading} onClick={confirmImport} className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-medical-700 transition disabled:opacity-50">Valider l'importation</button>
        </div>
      </div>
    </div>
  );
};

const InvoiceModal = ({ patients, onClose, onSave }: any) => {
    const [patientId, setPatientId] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<{description: string, price: number}[]>([{description: 'Consultation', price: 200.00}]);
    const [paymentMethod, setPaymentMethod] = useState(PaymentType.CASH);
    const [status, setStatus] = useState<'PAID' | 'PENDING'>('PAID');

    const addItem = (description: string, price: number) => setItems([...items, { description, price: Number(price) }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: 'description' | 'price', value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: field === 'price' ? Number(value) : value };
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) return;
        onSave({ id: `INV-${Date.now()}`, patientId, date: issueDate, amount: total, status, paymentMethod, items });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Émettre une Facture (MAD)</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light hover:rotate-90 transition-transform">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient bénéficiaire</label>
                            <select required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 font-bold bg-white" value={patientId} onChange={e => setPatientId(e.target.value)}>
                                <option value="">-- Sélectionner --</option>
                                {patients.map((p: Patient) => <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date d'émission</label>
                            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 bg-white font-bold" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actes médicaux & Honoraires</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {MEDICAL_ACTS.map((act, idx) => <button key={idx} type="button" onClick={() => addItem(act.label, act.price)} className="px-3 py-1.5 text-[10px] font-bold bg-medical-50 text-medical-700 rounded-lg border border-medical-100 hover:bg-medical-100 transition">+ {act.label}</button>)}
                        </div>
                        <div className="space-y-2 mb-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 animate-fade-in">
                                    <input type="text" className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm outline-none font-medium" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description"/>
                                    <input type="number" step="0.01" className="w-28 p-2.5 border border-slate-200 rounded-xl text-sm text-right font-black outline-none focus:ring-2 focus:ring-medical-500" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)}/>
                                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 px-2 text-xl font-light">&times;</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center p-5 bg-slate-900 rounded-2xl text-white shadow-lg">
                            <span className="font-black text-xs uppercase tracking-[0.2em] opacity-60">Total Honoraires</span>
                            <span className="text-2xl font-black">{total.toLocaleString('fr-FR')} <span className="text-xs">MAD</span></span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mode de règlement</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentType)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none font-bold bg-white">
                                {Object.values(PaymentType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">État</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setStatus('PAID')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition ${status === 'PAID' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>PAYÉE</button>
                                <button type="button" onClick={() => setStatus('PENDING')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition ${status === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>ATTENTE</button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                        <button type="submit" className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-medical-700 transition">Valider</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
