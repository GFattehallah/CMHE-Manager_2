
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Phone, MapPin, Activity, AlertCircle, FileText, 
  Pill, ChevronLeft, Clock, Loader2, Info, 
  LayoutDashboard, History, Receipt, ArrowRight,
  TrendingUp, CheckCircle2, Wallet, FileCode, Heart, Bookmark,
  Scale, Ruler, Thermometer, Wind, Droplets, TestTube
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { Consultation, Invoice, Patient } from '../types';
import { DMPTemplate } from './DMPTemplate';

type DMPTab = 'overview' | 'medical' | 'billing';

export const PatientDMP: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const exportRef = useRef<HTMLDivElement>(null);

  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

  const calculateIMC = () => {
    if (!patient?.weight || !patient?.height) return null;
    const w = parseFloat(patient.weight);
    const h = parseFloat(patient.height) / 100;
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return (w / (h * h)).toFixed(1);
  };

  const handleExportHTML = () => {
    if (!patient || !exportRef.current) return;

    const innerContent = exportRef.current.innerHTML;
    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DMP - ${patient.lastName} ${patient.firstName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 1rem; }
        @page { size: A5 portrait; margin: 0; }
        .export-container { width: 148mm; min-height: 210mm; margin: 0 auto; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; }
        @media print { 
          body { padding: 0; background: white; } 
          .export-container { box-shadow: none; border-radius: 0; width: 148mm; height: 210mm; } 
          .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="export-container">
        ${innerContent}
    </div>
    <div class="mt-8 text-center no-print">
        <button onclick="window.print()" style="background: #0ea5e9; color: white; padding: 0.75rem 2rem; border-radius: 1rem; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; border: none; box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.3);">
            Imprimer (A5)
        </button>
    </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DMP_${patient.lastName.toUpperCase()}_${patient.firstName}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!patient) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <Loader2 className="animate-spin mb-4" size={32}/>
      <p className="font-black uppercase text-[10px] tracking-widest">Initialisation du dossier...</p>
    </div>
  );

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);
  const imc = calculateIMC();

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
            onClick={handleExportHTML}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <FileCode size={18} /> Exporter (Format A5)
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm no-print">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutDashboard size={14}/> Résumé</button>
        <button onClick={() => setActiveTab('medical')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'medical' ? 'bg-medical-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><History size={14}/> Médical</button>
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
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Né(e) le: {new Date(patient.birthDate).toLocaleDateString('fr-FR')}</p>
                  
                  <div className="mt-6 space-y-3 text-left">
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl"><Phone size={16} className="text-medical-500" /> {patient.phone}</div>
                     <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl"><MapPin size={16} className="text-medical-500" /> <span className="truncate">{patient.address}</span></div>
                  </div>
               </div>

               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Activity size={14}/> Constantes Profil</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Poids / Taille</p>
                         <p className="text-sm font-black">{patient.weight || '--'} kg / {patient.height || '--'} cm</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                         <p className="text-[9px] font-black text-slate-500 uppercase mb-1">IMC / Sang</p>
                         <p className="text-sm font-black text-medical-400">{imc || '--'} • <span className="text-rose-400">{patient.bloodType || '--'}</span></p>
                      </div>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 font-black text-[10px] text-slate-800 uppercase tracking-widest">Dernières visites</div>
                  <div className="p-8 space-y-6">
                     {consultations.slice(0, 5).map(c => (
                       <div key={c.id} className="flex gap-4 border-b border-slate-50 pb-6 last:border-0 group">
                          <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-medical-600 group-hover:text-white transition-all"><Activity size={18}/></div>
                          <div className="flex-1">
                             <div className="flex justify-between mb-2">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.diagnosis}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                             </div>
                             <p className="text-xs text-slate-500 italic mb-2 leading-relaxed">"{c.symptoms.substring(0, 150)}..."</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Autres onglets medical/billing inchangés mais formatés en DMPTemplate si exportés */}
      </div>

      <div className="hidden" ref={exportRef}>
        <DMPTemplate patient={patient} consultations={consultations} />
      </div>

    </div>
  );
};
