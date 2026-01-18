import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Shield, Phone, Mail, MapPin, Activity, AlertCircle, FileText, 
  Pill, CreditCard, ChevronLeft, Clock, Trash2, Loader2, Info, 
  Printer, Download, LayoutDashboard, History, Receipt, ArrowRight,
  TrendingUp, CheckCircle2, Wallet
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Permission, Consultation, Invoice, Appointment, Patient } from '../types';
import { DMPTemplate } from './DMPTemplate';

type DMPTab = 'overview' | 'medical' | 'billing';

export const PatientDMP: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<DMPTab>('overview');

  const loadData = async () => {
    const [pats, cons, invs] = await Promise.all([
      DataService.getPatients(),
      DataService.getConsultations(),
      DataService.getInvoices()
    ]);
    
    const currentPatient = pats.find(p => p.id === patientId);
    setPatient(currentPatient);
    setConsultations(cons.filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setInvoices(invs.filter(i => i.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 700);
  };

  const handleDownloadPDF = async () => {
    if (!patient || isDownloading) return;
    const html2pdfLib = (window as any).html2pdf;
    if (!html2pdfLib) {
      alert("La bibliothèque PDF n'est pas chargée.");
      return;
    }
    setIsDownloading(true);
    const element = pdfContainerRef.current;
    if (!element) {
      alert("Erreur technique : Conteneur de rendu introuvable.");
      setIsDownloading(false);
      return;
    }
    const opt = {
      margin: 10,
      filename: `DMP_${patient.lastName.toUpperCase()}_${patient.firstName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await html2pdfLib().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!patient) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <Loader2 className="animate-spin mb-4" size={32}/>
      <p className="font-black uppercase text-[10px] tracking-widest">Chargement du dossier...</p>
    </div>
  );

  const canSeeMedical = currentUser?.permissions.includes(Permission.CONSULTATIONS);
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

  const printPortal = document.getElementById('global-print-portal');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 overflow-y-auto h-full custom-scrollbar">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-800 transition shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Shield className="text-medical-600" size={24}/> DMP : {patient.lastName} {patient.firstName}
             </h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Identifiant Unique • {patient.cin}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Télécharger
          </button>
          <button onClick={handlePrint} className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm">
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm no-print">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutDashboard size={14}/> Résumé du dossier</button>
        <button onClick={() => setActiveTab('medical')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'medical' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><History size={14}/> Historique Médical</button>
        <button onClick={() => setActiveTab('billing')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Receipt size={14}/> Facturation</button>
      </div>

      {/* CONTENT SECTIONS */}
      <div className="no-print animate-fade-in">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                  <div className="w-20 h-20 bg-medical-50 text-medical-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-2 border-medical-100 uppercase">
                    {patient.lastName[0]}{patient.firstName[0]}
                  </div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{patient.lastName} {patient.firstName}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">CIN: {patient.cin}</p>
                  <div className="mt-8 space-y-3 text-left">
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl"><Phone size={16} className="text-medical-500" /> {patient.phone}</div>
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl"><MapPin size={16} className="text-medical-500" /> <span className="truncate">{patient.address}</span></div>
                  </div>
               </div>
               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Activity size={14}/> Paramètres cliniques</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Poids</p>
                         <p className="text-lg font-black">{patient.weight || '--'} kg</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Taille</p>
                         <p className="text-lg font-black">{patient.height || '--'} cm</p>
                      </div>
                   </div>
                   <div className="mt-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      <p className="text-[9px] font-black text-rose-400 uppercase mb-1">Allergies</p>
                      <p className="text-xs font-bold text-rose-100">{patient.allergies.length ? patient.allergies.join(', ') : 'Aucune'}</p>
                   </div>
               </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultations</p>
                     <p className="text-2xl font-black text-slate-800">{consultations.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total réglé</p>
                     <p className="text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} MAD</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dettes patient</p>
                     <p className="text-2xl font-black text-rose-600">{totalPending.toLocaleString()} MAD</p>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 font-black text-[10px] text-slate-800 uppercase tracking-widest">Derniers événements médicaux</div>
                  <div className="p-8 space-y-6">
                     {consultations.slice(0, 3).map(c => (
                       <div key={c.id} className="flex gap-4 border-b border-slate-50 pb-6 last:border-0 group">
                          <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-medical-600 group-hover:text-white transition-all"><Activity size={18}/></div>
                          <div className="flex-1">
                             <div className="flex justify-between mb-1">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.diagnosis}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                             </div>
                             <p className="text-xs text-slate-500 italic mb-3">"{c.symptoms.substring(0, 100)}..."</p>
                             {/* MEDICAMENTS DANS LE RESUME */}
                             {c.prescription && c.prescription.length > 0 && (
                               <div className="flex flex-wrap gap-2">
                                 {c.prescription.map((m, i) => (
                                   <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                      <Pill size={10} className="text-medical-500"/> {m}
                                   </span>
                                 ))}
                               </div>
                             )}
                          </div>
                       </div>
                     ))}
                     {consultations.length === 0 && <p className="text-center py-10 text-slate-300 font-black uppercase text-[10px]">Aucune visite enregistrée</p>}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDICAL */}
        {activeTab === 'medical' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in p-8 space-y-8">
             <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-4">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2"><History size={18} className="text-medical-600"/> Chronologie des soins</h3>
                <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full uppercase tracking-widest">{consultations.length} Visites</span>
             </div>
             {consultations.map(c => (
               <div key={c.id} className="relative pl-10 border-l-2 border-slate-100 pb-12 last:pb-0">
                  <div className="absolute -left-[11px] top-0 w-5 h-5 bg-white border-4 border-medical-600 rounded-full shadow-sm"></div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-xs font-black text-slate-400 mb-1 flex items-center gap-2"><Clock size={12}/> {new Date(c.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{c.diagnosis}</h4>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={12} className="text-medical-600"/> Observations</p>
                        <p className="text-sm text-slate-600 italic whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-2xl border border-slate-200/50">"{c.symptoms}"</p>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Pill size={12} className="text-medical-600"/> Traitement prescrit</p>
                        <ul className="text-xs font-bold text-slate-800 space-y-2 bg-white p-4 rounded-2xl border border-slate-200/50">
                           {c.prescription && c.prescription.length > 0 ? c.prescription.map((m, i) => (
                             <li key={i} className="flex items-center gap-2"><ArrowRight size={10} className="text-medical-500 shrink-0"/> {m}</li>
                           )) : <li className="text-slate-300 italic font-medium">Aucun médicament</li>}
                        </ul>
                     </div>
                  </div>
               </div>
             ))}
             {consultations.length === 0 && <div className="text-center py-20 opacity-20 flex flex-col items-center"><FileText size={48} className="mb-2"/><p className="font-black uppercase tracking-widest text-[10px]">Dossier médical vierge</p></div>}
          </div>
        )}

        {/* TAB 3: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-fade-in">
             {/* RESUME FINANCIER DANS LA FACTURATION */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0"><Receipt size={24}/></div>
                   <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Honoraires</p><p className="text-xl font-black text-slate-800">{totalInvoiced.toLocaleString()} MAD</p></div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><CheckCircle2 size={24}/></div>
                   <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Réglé</p><p className="text-xl font-black text-emerald-600">{totalPaid.toLocaleString()} MAD</p></div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0"><AlertCircle size={24}/></div>
                   <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reste à payer</p><p className="text-xl font-black text-rose-600">{totalPending.toLocaleString()} MAD</p></div>
                </div>
                <div className="bg-slate-900 p-5 rounded-3xl shadow-xl flex items-center gap-4 text-white">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp size={24}/></div>
                   <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taux Recouvrement</p><p className="text-xl font-black text-white">{totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%</p></div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="p-5 pl-8">Date d'édition</th>
                         <th className="p-5">Prestation / Motif</th>
                         <th className="p-5">Mode de paiement</th>
                         <th className="p-5 text-right">Montant</th>
                         <th className="p-5 text-center pr-8">Statut</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition group">
                           <td className="p-5 pl-8 font-bold text-xs text-slate-600">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                           <td className="p-5">
                             <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{inv.items && inv.items[0] ? inv.items[0].description : 'Consultation'}</div>
                             {inv.items && inv.items.length > 1 && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+ {inv.items.length - 1} autre(s) acte(s)</div>}
                           </td>
                           <td className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">{inv.paymentMethod}</td>
                           <td className="p-5 text-right font-black text-slate-900 text-sm">{inv.amount.toLocaleString()} MAD</td>
                           <td className="p-5 text-center pr-8">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                 {inv.status === 'PAID' ? '✔ Réglé' : '⏳ Attente'}
                              </span>
                           </td>
                        </tr>
                      ))}
                      {invoices.length === 0 && <tr><td colSpan={5} className="p-20 text-center opacity-30 flex flex-col items-center"><Wallet size={40} className="mb-2"/><p className="text-[10px] font-black uppercase tracking-widest">Aucune transaction enregistrée</p></td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {/* Renders for Print & PDF */}
      {printPortal && createPortal(<div className="print-only"><DMPTemplate patient={patient} consultations={consultations} /></div>, printPortal)}
      <div className="pdf-capture-container" ref={pdfContainerRef}><DMPTemplate patient={patient} consultations={consultations} /></div>

    </div>
  );
};