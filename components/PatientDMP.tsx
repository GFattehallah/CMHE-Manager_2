import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  User as UserType, Shield, Phone, Mail, MapPin, Calendar, Activity, 
  AlertCircle, FileText, Pill, CreditCard, ChevronLeft, 
  Clock, Heart, Scale, Ruler, ExternalLink, Hash, Trash2, Loader2, Info, Printer, Download,
  LayoutDashboard, History, Receipt, ArrowRight
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

  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<DMPTab>('overview');

  const loadData = async () => {
    const [pats, cons, invs, apts] = await Promise.all([
      DataService.getPatients(),
      DataService.getConsultations(),
      DataService.getInvoices(),
      DataService.getAppointments()
    ]);
    
    const currentPatient = pats.find(p => p.id === patientId);
    setPatient(currentPatient);
    setConsultations(cons.filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setInvoices(invs.filter(i => i.patientId === patientId));
    setAppointments(apts.filter(a => a.patientId === patientId)
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
    }, 600);
  };

  const handleDownloadPDF = async () => {
    if (!patient || isDownloading) return;
    
    const html2pdfLib = (window as any).html2pdf;
    if (!html2pdfLib) {
      alert("Erreur : Bibliothèque PDF non chargée. Veuillez rafraîchir la page.");
      return;
    }

    setIsDownloading(true);

    // On utilise un élément temporaire pour le rendu PDF afin d'éviter les styles de scroll ou de masquage
    const pdfArea = document.getElementById('dmp-pdf-render-area');
    if (!pdfArea) {
      alert("Erreur technique : Zone de rendu PDF introuvable.");
      setIsDownloading(false);
      return;
    }

    const opt = {
      margin: 10,
      filename: `DMP_${patient.lastName.toUpperCase()}_${patient.firstName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // On lance la génération sur l'élément qui contient le DMPTemplate
      await html2pdfLib().set(opt).from(pdfArea).save();
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Une erreur est survenue lors du téléchargement.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      setIsDeleting(true);
      try {
        await DataService.deleteConsultation(id);
        setConsultations(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert("Erreur suppression.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!patient) return (
    <div className="p-12 text-center flex flex-col items-center">
       <Loader2 size={40} className="animate-spin text-medical-600 mb-4" />
       <p className="font-bold text-slate-400 font-sans">Chargement du DMP...</p>
    </div>
  );

  const canSeeMedical = currentUser?.permissions.includes(Permission.CONSULTATIONS);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

  const printPortal = document.getElementById('global-print-portal');
  const pdfPortal = document.getElementById('dmp-pdf-render-area');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 overflow-y-auto h-full custom-scrollbar">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-800 transition shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
             <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Shield className="text-medical-600" size={24}/> Dossier Patient
             </h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{patient.lastName} {patient.firstName} • {patient.cin}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Télécharger Dossier
          </button>

          <button 
            onClick={handlePrint} 
            className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm"
          >
            <Printer size={16} /> Imprimer
          </button>

          {canSeeMedical && (
            <button 
              onClick={() => navigate('/consultations')} 
              className="flex-1 md:flex-none bg-medical-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-medical-100 hover:bg-medical-700 transition"
            >
              Nouvelle Visite
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION ONGLES */}
      <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm no-print">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <LayoutDashboard size={14}/> Résumé
        </button>
        <button 
          onClick={() => setActiveTab('medical')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'medical' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <History size={14}/> Médical
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Receipt size={14}/> Facturation
        </button>
      </div>

      {/* CONTENU ONGLES */}
      <div className="no-print animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                  <div className="w-20 h-20 bg-medical-50 text-medical-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-2 border-medical-100">
                    {patient.lastName[0]}{patient.firstName[0]}
                  </div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{patient.lastName} {patient.firstName}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">CIN: {patient.cin}</p>
                  
                  <div className="mt-8 space-y-3 text-left">
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                       <Phone size={16} className="text-medical-500" /> {patient.phone}
                     </div>
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                       <MapPin size={16} className="text-medical-500" /> <span className="truncate">{patient.address}</span>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Activity size={14}/> Paramètres</h3>
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
               </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultations</p>
                     <p className="text-2xl font-black text-slate-800">{consultations.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Réglé</p>
                     <p className="text-2xl font-black text-emerald-600">{totalPaid} <span className="text-xs">MAD</span></p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impayés</p>
                     <p className="text-2xl font-black text-rose-600">{totalPending} <span className="text-xs">MAD</span></p>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 font-black text-[10px] text-slate-800 uppercase tracking-widest">
                     Derniers Événements
                  </div>
                  <div className="p-8 space-y-6">
                     {consultations.slice(0, 3).map(c => (
                       <div key={c.id} className="flex gap-4 border-b border-slate-50 pb-6 last:border-0">
                          <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-xl flex items-center justify-center shrink-0">
                             <Activity size={18}/>
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.diagnosis}</p>
                             <p className="text-xs text-slate-400 font-bold mb-2">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                             <p className="text-xs text-slate-500 italic">"{c.symptoms.substring(0, 100)}..."</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
             {consultations.map(c => (
               <div key={c.id} className="relative pl-10 border-l-2 border-slate-100 pb-10 last:pb-0">
                  <div className="absolute -left-[11px] top-0 w-5 h-5 bg-medical-600 rounded-full border-4 border-white shadow-md"></div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-xs font-black text-slate-400 mb-1">{new Date(c.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{c.diagnosis}</h4>
                     </div>
                     <button onClick={() => handleDeleteConsultation(c.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"><Trash2 size={18}/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={12}/> Signes Cliniques</p>
                        <p className="text-sm text-slate-600 italic whitespace-pre-wrap leading-relaxed">"{c.symptoms}"</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Pill size={12}/> Prescription</p>
                        <ul className="text-xs font-bold text-slate-800 space-y-1">
                           {c.prescription.map((m, i) => <li key={i} className="flex items-center gap-2"><ArrowRight size={10} className="text-medical-500"/> {m}</li>)}
                        </ul>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <tr>
                      <th className="p-5 pl-8">Date</th>
                      <th className="p-5">Mode</th>
                      <th className="p-5 text-right">Montant</th>
                      <th className="p-5 text-center">Statut</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {invoices.map(inv => (
                     <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="p-5 pl-8 font-bold text-sm text-slate-700">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-5 text-[10px] font-black uppercase text-slate-500">{inv.paymentMethod}</td>
                        <td className="p-5 text-right font-black text-slate-900">{inv.amount} MAD</td>
                        <td className="p-5 text-center">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {inv.status === 'PAID' ? '✔ Payée' : 'Attente'}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Rendu Portals pour Print et PDF */}
      {printPortal && createPortal(<div className="print-only"><DMPTemplate patient={patient} consultations={consultations} /></div>, printPortal)}
      {pdfPortal && createPortal(<DMPTemplate patient={patient} consultations={consultations} />, pdfPortal)}

    </div>
  );
};