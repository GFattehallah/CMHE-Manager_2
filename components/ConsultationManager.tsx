import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { GeminiService } from '../services/geminiService';
import { Patient, Consultation } from '../types';
import { Sparkles, Save, Printer, History, FileText, Activity, AlertCircle, Pill, Download, Eye, EyeOff, Trash2, CheckSquare, Square, MinusSquare, Loader2 } from 'lucide-react';
import { PrescriptionTemplate } from './PrescriptionTemplate';

export const ConsultationManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [symptoms, setSymptoms] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prescription, setPrescription] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      const data = await DataService.getPatients();
      setPatients(data);
    };
    loadPatients();
  }, []);

  const loadHistory = async () => {
    if (selectedPatientId) {
      const allConsultations = await DataService.getConsultations();
      const patientHistory = allConsultations
        .filter(c => c.patientId === selectedPatientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setConsultationHistory(patientHistory);
      setSelectedIds([]);
    } else {
      setConsultationHistory([]);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAIAnalysis = async () => {
    if (!selectedPatient || !symptoms) return;
    setIsAnalyzing(true);
    const analysis = await GeminiService.analyzeSymptoms(symptoms, selectedPatient.medicalHistory);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis) {
      alert("Veuillez entrer un diagnostic d'abord");
      return;
    }
    setIsAnalyzing(true);
    const meds = await GeminiService.generatePrescriptionSuggestion(diagnosis);
    setPrescription(meds);
    setIsAnalyzing(false);
  };

  const handlePrint = () => { window.print(); };

  const handleDownloadPDF = () => {
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("Erreur: Librairie PDF non chargée.");
        return;
    }
    const element = document.getElementById('prescription-preview-content');
    const opt = {
      margin: 0,
      filename: `Ordonnance_${selectedPatient?.lastName || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };
    (window as any).html2pdf().set(opt).from(element).save();
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    if (!diagnosis) {
        alert("Le diagnostic est obligatoire pour sauvegarder.");
        return;
    }

    const newConsultation: Consultation = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      appointmentId: 'manual', 
      date: new Date().toISOString(),
      symptoms,
      diagnosis,
      notes: aiAnalysis,
      prescription
    };

    try {
        await DataService.saveConsultation(newConsultation);
        await loadHistory();
        alert('Consultation sauvegardée avec succès !');
        setSymptoms('');
        setAiAnalysis('');
        setPrescription([]);
        setDiagnosis('');
        setActiveTab('history');
    } catch (err) {
        alert("Erreur lors de la sauvegarde. Vérifiez votre connexion.");
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette consultation ?')) {
      setIsDeleting(true);
      try {
          await DataService.deleteConsultation(id);
          // Update local state immediately for better UX
          setConsultationHistory(prev => prev.filter(c => c.id !== id));
          alert("Consultation supprimée.");
      } catch (err) {
          console.error(err);
          alert("Erreur lors de la suppression. Vérifiez vos droits d'accès Supabase (RLS).");
          await loadHistory(); // Re-sync in case of error
      } finally {
          setIsDeleting(false);
      }
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} consultations sélectionnées ?`)) {
      setIsDeleting(true);
      try {
          await DataService.deleteConsultationsBulk(selectedIds);
          setConsultationHistory(prev => prev.filter(c => !selectedIds.includes(c.id)));
          setSelectedIds([]);
          alert("Sélection supprimée.");
      } catch (err) {
          console.error(err);
          alert("Erreur lors de la suppression groupée.");
          await loadHistory();
      } finally {
          setIsDeleting(false);
      }
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === consultationHistory.length && consultationHistory.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(consultationHistory.map(c => c.id));
    }
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)] relative overflow-hidden">
      
      {/* LEFT PANEL: Controls & Inputs */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden no-print">
        
        {/* Header / Patient Selection */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dossier Patient</label>
           <div className="flex gap-2">
            <select 
                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-medical-500 outline-none font-medium"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
            >
                <option value="">-- Rechercher un patient --</option>
                {patients.map(p => (
                <option key={p.id} value={p.id}>{p.lastName} {p.firstName} (Né le {new Date(p.birthDate).getFullYear()})</option>
                ))}
            </select>
            <button className="bg-white border border-slate-300 p-2 rounded-lg text-slate-500 hover:text-medical-600 hover:border-medical-600 transition">
                <History size={20}/>
            </button>
           </div>
           
           {selectedPatient && (
             <div className="mt-3 flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-600">
                    <Activity size={14} className="text-red-500"/> 
                    Antécédents: <strong>{selectedPatient.medicalHistory.length ? selectedPatient.medicalHistory.join(', ') : 'Aucun'}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                    <AlertCircle size={14} className="text-orange-500"/> 
                    Allergies: <strong>{selectedPatient.allergies.length ? selectedPatient.allergies.join(', ') : 'Aucune'}</strong>
                </span>
             </div>
           )}
        </div>

        {/* Tabs */}
        {selectedPatient ? (
        <>
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'new' ? 'text-medical-600 border-b-2 border-medical-600 bg-medical-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FileText size={16}/> Nouvelle Consultation
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-medical-600 border-b-2 border-medical-600 bg-medical-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <History size={16}/> Historique ({consultationHistory.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                
                {activeTab === 'new' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Symptômes & Motif</label>
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-medical-500 outline-none text-slate-700 resize-none"
                                placeholder="Le patient se plaint de..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing || !symptoms}
                                    className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    <Sparkles size={16} />
                                    {isAnalyzing ? 'Analyse...' : 'Analyser avec IA'}
                                </button>
                            </div>
                            {aiAnalysis && (
                                <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                                    <div className="font-semibold text-indigo-800 mb-1 flex items-center gap-2"><Sparkles size={12}/> Suggestion Gemini</div>
                                    <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Diagnostic</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Diagnostic médical..."
                                />
                                <button 
                                    onClick={handleGeneratePrescription}
                                    className="bg-medical-50 text-medical-700 px-3 py-2 rounded-lg hover:bg-medical-100 transition"
                                    title="Suggérer ordonnance"
                                >
                                    <Pill size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Médicaments</label>
                                <button onClick={() => setPrescription([...prescription, ''])} className="text-xs text-medical-600 font-medium hover:underline">+ Ajouter</button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {prescription.map((med, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <span className="w-6 flex items-center justify-center text-slate-300 text-xs">{idx + 1}</span>
                                    <input 
                                        value={med} 
                                        onChange={(e) => {
                                            const newPresc = [...prescription];
                                            newPresc[idx] = e.target.value;
                                            setPrescription(newPresc);
                                        }}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:border-medical-500 outline-none"
                                        placeholder="Nom du médicament, dosage, fréquence..."
                                    />
                                    <button onClick={() => setPrescription(prescription.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                        &times;
                                    </button>
                                </div>
                                ))}
                                {prescription.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Aucun médicament prescrit.</p>}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3 pb-8">
                            <button onClick={handleSave} className="flex-1 bg-medical-600 text-white py-3 rounded-lg hover:bg-medical-700 shadow-md flex items-center justify-center gap-2 font-medium transition">
                                <Save size={18} /> Enregistrer
                            </button>
                            <div className="h-full w-px bg-slate-200 mx-1"></div>
                            <button onClick={() => setShowPreview(!showPreview)} className={`px-4 py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition border ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`} title={showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}><Eye size={18} /></button>
                            <button onClick={handleDownloadPDF} className="px-4 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 shadow-md flex items-center justify-center gap-2 transition" title="Télécharger PDF"><Download size={18} /></button>
                            <button onClick={handlePrint} className="px-4 bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 shadow-md flex items-center justify-center gap-2 transition" title="Imprimer"><Printer size={18} /></button>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in pb-16">
                        <div className="flex justify-between items-center mb-4 px-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm sticky top-0 z-20">
                           <button onClick={handleSelectAll} className="text-xs font-bold text-slate-600 flex items-center gap-3 hover:text-medical-600 transition-all bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                             {selectedIds.length === consultationHistory.length && consultationHistory.length > 0 ? (
                               <CheckSquare size={18} className="text-medical-600" />
                             ) : selectedIds.length > 0 ? (
                               <MinusSquare size={18} className="text-medical-400" />
                             ) : (
                               <Square size={18} />
                             )}
                             {selectedIds.length > 0 ? `Désélectionner (${selectedIds.length})` : 'Sélectionner tout'}
                           </button>
                           {isDeleting && (
                             <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-[10px] tracking-widest animate-pulse">
                               <Loader2 size={12} className="animate-spin" /> Mise à jour...
                             </div>
                           )}
                        </div>

                        {consultationHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                                <History size={48} className="mx-auto mb-2 opacity-20"/>
                                <p className="font-bold uppercase tracking-widest text-[10px]">Aucun historique de consultation.</p>
                            </div>
                        ) : (
                            consultationHistory.map((consult) => (
                                <div 
                                    key={consult.id} 
                                    className={`relative bg-white p-5 rounded-2xl border transition-all duration-300 group ${selectedIds.includes(consult.id) ? 'border-medical-500 shadow-xl ring-2 ring-medical-500/10' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
                                >
                                    {/* Select Checkbox (Always Visible & Interactive) */}
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleToggleSelect(consult.id); }}
                                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-slate-300 hover:text-medical-600 transition-colors cursor-pointer"
                                    >
                                      {selectedIds.includes(consult.id) ? <CheckSquare size={24} className="text-medical-600"/> : <Square size={24}/>}
                                    </button>

                                    <div className="flex justify-between items-start mb-2 pl-12">
                                        <div className="flex items-center gap-3 text-medical-700 font-bold">
                                            <CalendarIcon date={consult.date} />
                                            <div className="flex flex-col">
                                                <span className="text-sm capitalize">{new Date(consult.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded w-fit font-black">À {new Date(consult.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteConsultation(consult.id); }}
                                              className="p-2.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all border border-rose-100 hover:border-rose-600 shadow-sm bg-rose-50/30 cursor-pointer"
                                              title="Supprimer cette consultation"
                                            >
                                              <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-3 pl-12">
                                        <p className="text-sm text-slate-800 font-black mb-1">Diagnostic: <span className="text-medical-600 uppercase tracking-tight">{consult.diagnosis}</span></p>
                                        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg italic">"{consult.symptoms}"</p>
                                    </div>
                                    <div className="bg-slate-900/5 p-4 rounded-xl text-xs text-slate-600 ml-12 border border-slate-100">
                                        <div className="font-black mb-2 text-slate-400 uppercase tracking-[0.2em] text-[9px] flex items-center gap-2"><Pill size={12}/> Traitement prescrit</div>
                                        <ul className="space-y-1.5">
                                            {consult.prescription && consult.prescription.length > 0 ? (
                                              consult.prescription.map((med, i) => (
                                                  <li key={i} className="flex items-start gap-2 font-bold text-slate-700">
                                                      <span className="text-medical-500 mt-1">•</span> {med}
                                                  </li>
                                              ))
                                            ) : (
                                              <li className="text-slate-400 italic">Aucune prescription</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                    <UserIcon />
                </div>
                <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">Aucun patient sélectionné</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Recherchez un dossier patient pour commencer une consultation.</p>
            </div>
        )}
      </div>

      {/* Floating Bulk Delete Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-fade-in no-print">
          <div className="bg-slate-900 text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md bg-opacity-95 ring-1 ring-white/20">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">{selectedIds.length}</div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Consultations</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Sélectionnées</p>
              </div>
            </div>
            <div className="flex gap-2 pr-2">
              <button type="button" onClick={() => setSelectedIds([])} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-2xl transition-all">Annuler</button>
              <button type="button" onClick={handleDeleteBulk} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-900/40 transition-all active:scale-95">
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT PANEL: LIVE PREVIEW */}
      <div className={`${showPreview ? 'block' : 'hidden'} w-[148mm] shrink-0 bg-white shadow-2xl p-0 overflow-hidden border border-slate-200 relative group transition-all duration-300`}>
         <div className="absolute top-4 right-4 bg-slate-900 text-white text-[9px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 uppercase tracking-[0.2em] font-black shadow-lg">Aperçu A5</div>
         <div className="h-full overflow-y-auto p-4 origin-top bg-slate-50/20">
            <div id="prescription-preview-content">
                <PrescriptionTemplate 
                    patient={selectedPatient} 
                    prescription={prescription} 
                    date={new Date()} 
                />
            </div>
         </div>
      </div>
      
      {/* Hidden Print Container */}
      <div className="print-only">
         <PrescriptionTemplate patient={selectedPatient} prescription={prescription} date={new Date()} />
      </div>
    </div>
  );
};

// Helper Components
const CalendarIcon = ({ date }: { date: string }) => (
    <div className="flex flex-col items-center justify-center w-12 h-12 bg-medical-50 text-medical-600 rounded-xl border border-medical-100 shadow-sm shrink-0">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">{new Date(date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
        <span className="text-xl font-black leading-none mt-0.5">{new Date(date).getDate()}</span>
    </div>
);

const UserIcon = () => (
    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);