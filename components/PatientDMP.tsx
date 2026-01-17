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
    // On laisse le temps au portail d'impression de se mettre à jour
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 600);
  };

  const handleDownloadPDF = async () => {
    if (!patient) return;
    
    const html2pdfLib = (window as any).html2pdf;
    if (!html2pdfLib) {
      alert("Erreur : La bibliothèque PDF (html2pdf) n'est pas encore chargée. Veuillez patienter quelques secondes.");
      return;
    }

    setIsDownloading(true);
    // On cible la zone de rendu dédiée au PDF
    const element = document.getElementById('dmp-pdf-render-area');
    
    if (!element) {
      alert("Erreur technique : Zone de rendu PDF introuvable dans le DOM.");
      setIsDownloading(false);
      return;
    }

    const opt = {
      margin: 10,
      filename: `DMP_${patient.lastName.toUpperCase()}_${patient.firstName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdfLib().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Une erreur est survenue lors de la création du fichier PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette consultation ? Cette action est définitive.')) {
      setIsDeleting(true);
      try {
        await DataService.deleteConsultation(id);
        setConsultations(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!patient) return (
    <div className="p-12 text-center flex flex-col items-center">
       <Loader2 size={40} className="animate-spin text-medical-600 mb-4" />
       <p className="font-bold text-slate-400">Chargement du dossier patient...</p>
    </div>
  );

  const canSeeMedical = currentUser?.permissions.includes(Permission.CONSULTATIONS);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

  // Portail d'impression pour garantir la visibilité au moteur d'impression du navigateur
  const printPortal = document.getElementById('global-print-portal');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 overflow-y-auto h-full custom-scrollbar">
      
      {/* HEADER DE NAVIGATION & ACTIONS */}
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
               <Shield className="text-medical-600" size={24}/> DMP : {patient.lastName} {patient.firstName}
             </h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dossier Médical Partagé • {patient.cin}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 border-b-4 active:translate-y-0.5 active:border-b-0"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin text-medical-600" /> : <Download size={16} className="text-medical-600" />}
            Télécharger Dossier
          </button>

          <button 
            onClick={handlePrint} 
            disabled={isPrinting}
            className="flex-1 md:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 border-b-4 active:translate-y-0.5 active:border-b-0"
          >
            {isPrinting ? <Loader2 size={16} className="animate-spin text-medical-600" /> : <Printer size={16} className="text-medical-600" />}
            Imprimer Dossier
          </button>

          {canSeeMedical && (
            <button 
              onClick={() => navigate('/consultations')} 
              className="flex-1 md:flex-none bg-medical-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-medical-100 hover:bg-medical-700 transition border-b-4 border-medical-800 active:translate-y-0.5 active:border-b-0"
            >
              Nouvelle Visite
            </button>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
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

      {/* CONTENU SELON L'ONGLET */}
      <div className="no-print animate-fade-in min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profil Gauche */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-medical-50 rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="w-24 h-24 bg-medical-50 text-medical-600 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6 border-4 border-white shadow-md relative z-10">
                  {patient.lastName[0]}{patient.firstName[0]}
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter relative z-10">{patient.lastName} {patient.firstName}</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">CIN: {patient.cin}</p>
                
                <div className="mt-8 space-y-4 text-left border-t border-slate-50 pt-6">
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                     <Phone size={16} className="text-medical-500" /> {patient.phone}
                   </div>
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                     <Mail size={16} className="text-medical-500" /> {patient.email || 'Non renseigné'}
                   </div>
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl">
                     <MapPin size={16} className="text-medical-500" /> <span className="truncate">{patient.address}</span>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Activity size={14}/> Profil Clinique</h3>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Poids</p>
                         <p className="text-lg font-black text-slate-100">{patient.weight || '--'} kg</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Taille</p>
                         <p className="text-lg font-black text-slate-100">{patient.height || '--'} cm</p>
                      </div>
                   </div>
                   <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20">
                      <p className="text-[10px] font-black text-rose-400 uppercase mb-2">Allergies</p>
                      <p className="text-sm font-bold text-rose-100 leading-relaxed">{patient.allergies.length > 0 ? patient.allergies.join(' • ') : 'AUCUNE ALLERGIE SIGNALÉE'}</p>
                   </div>
                   <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Antécédents</p>
                      <ul className="text-xs font-bold text-slate-300 space-y-1">
                        {patient.medicalHistory.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                             <span className="text-medical-500 mt-0.5">•</span> {h}
                          </li>
                        ))}
                        {patient.medicalHistory.length === 0 && <li className="italic opacity-50">Aucun antécédent</li>}
                      </ul>
                   </div>
                </div>
              </div>
            </div>

            {/* Stats Droite */}
            <div className="lg:col-span-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultations</p>
                       <p className="text-3xl font-black text-slate-800">{consultations.length}</p>
                     </div>
                     <div className="p-3 bg-medical-50 text-medical-600 rounded-2xl"><Activity size={24}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Réglé</p>
                       <p className="text-3xl font-black text-emerald-600">{totalPaid} <span className="text-xs">MAD</span></p>
                     </div>
                     <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CreditCard size={24}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à payer</p>
                       <p className="text-3xl font-black text-rose-600">{totalPending} <span className="text-xs">MAD</span></p>
                     </div>
                     <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><AlertCircle size={24}/></div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                     <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                       <Clock size={14} className="text-medical-600"/> Historique Récent
                     </h3>
                     <span className="text-[9px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">Dernières Visites</span>
                  </div>
                  <div className="p-8 space-y-6">
                     {consultations.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-12 opacity-30">
                          <FileText size={48} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest text-[10px]">Aucune donnée enregistrée</p>
                       </div>
                     ) : consultations.slice(0, 4).map(c => (
                       <div key={c.id} className="flex gap-6 items-start group">
                          <div className="w-12 h-12 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-medical-100 group-hover:bg-medical-100 transition-colors">
                             <Activity size={20}/>
                          </div>
                          <div className="flex-1 pb-6 border-b border-slate-50 last:border-0">
                             <div className="flex justify-between mb-1">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.diagnosis}</p>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                             </div>
                             <p className="text-xs text-slate-500 italic leading-relaxed">"{c.symptoms.substring(0, 150)}{c.symptoms.length > 150 ? '...' : ''}"</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
             <div className="p-6 border-b border-slate-50 bg-slate-50/30 font-black text-slate-800 text-[11px] uppercase tracking-widest flex justify-between items-center">
                <span className="flex items-center gap-2"><History size={16} className="text-medical-600"/> Timeline Médicale</span>
                <span className="bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">{consultations.length} Consultations</span>
             </div>
             <div className="p-8 space-y-10 max-h-[700px] overflow-y-auto custom-scrollbar">
                {consultations.length === 0 ? (
                   <div className="text-center py-20 opacity-20 flex flex-col items-center">
                      <FileText size={60} className="mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Dossier médical vide</p>
                   </div>
                ) : consultations.map(c => (
                  <div key={c.id} className="relative pl-10 border-l-2 border-slate-100 pb-10 last:pb-0">
                     <div className="absolute -left-[11px] top-0 w-5 h-5 bg-medical-600 rounded-full border-4 border-white shadow-md"></div>
                     <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div>
                           <p className="text-xs font-black text-slate-400 mb-1 flex items-center gap-2">
                             <Calendar size={12}/> {new Date(c.date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                           </p>
                           <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{c.diagnosis}</h4>
                        </div>
                        <div className="flex gap-2 shrink-0">
                           {isDeleting && <Loader2 size={16} className="animate-spin text-rose-600" />}
                           <button onClick={() => handleDeleteConsultation(c.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition border border-rose-100 bg-white" title="Supprimer la consultation"><Trash2 size={18}/></button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-medical-100 transition-all shadow-sm">
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={12} className="text-medical-600"/> Signes & Symptômes</p>
                           <p className="text-sm text-slate-600 italic whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-2xl border border-slate-100/50">"{c.symptoms}"</p>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Pill size={12} className="text-medical-600"/> Prescription Associée</p>
                           <ul className="text-xs font-bold text-slate-800 space-y-2 bg-white/50 p-4 rounded-2xl border border-slate-100/50">
                              {c.prescription.length > 0 ? c.prescription.map((m, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <ArrowRight size={10} className="text-medical-500 shrink-0"/> {m}
                                </li>
                              )) : <li className="italic opacity-50">Aucun médicament prescrit</li>}
                           </ul>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'billing' && (
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30 font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                 <Receipt size={16} className="text-emerald-600"/> Historique Financier Patient
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                        <th className="p-5 pl-8">Date d'émission</th>
                        <th className="p-5">Mode de paiement</th>
                        <th className="p-5 text-right">Montant (MAD)</th>
                        <th className="p-5 text-center pr-8">Statut du règlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center opacity-30 flex flex-col items-center">
                          <Receipt size={40} className="mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Aucune facture enregistrée</p>
                        </td>
                      </tr>
                    ) : invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="p-5 pl-8 font-bold text-sm text-slate-700">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                          <td className="p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">{inv.paymentMethod}</td>
                          <td className="p-5 text-right font-black text-slate-900">{inv.amount.toLocaleString('fr-FR')} MAD</td>
                          <td className="p-5 text-center pr-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {inv.status === 'PAID' ? '✔ Payée' : '⏳ Attente'}
                            </span>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </div>

      {/* Rendu Invisible pour le Print via PORTAL */}
      {printPortal && createPortal(
        <div className="print-only">
           <DMPTemplate patient={patient} consultations={consultations} />
        </div>,
        printPortal
      )}

      {/* Zone de rendu invisible dédiée à html2pdf (hors écran) */}
      <div className="pdf-offscreen-render" id="dmp-pdf-render-area">
        {patient && <DMPTemplate patient={patient} consultations={consultations} />}
      </div>

    </div>
  );
};