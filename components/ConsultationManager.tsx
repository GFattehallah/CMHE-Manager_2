import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { GeminiService } from '../services/geminiService';
import { Patient, Consultation, Vitals } from '../types';
import { 
  Sparkles, Save, Printer, History, FileText, Activity, AlertCircle, Pill, 
  Download, Eye, Trash2, CheckSquare, Square, MinusSquare, Loader2,
  Thermometer, Wind, Droplets, TestTube, Scale, Ruler, Calendar, Info
} from 'lucide-react';
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
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Vitals State
  const [vitals, setVitals] = useState<Vitals>({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oximetry: '',
    urinaryStrip: '',
    weight: '',
    height: ''
  });

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
      
      // Pré-remplir les vitals avec les dernières connues du patient
      const p = patients.find(pat => pat.id === selectedPatientId);
      if (p) {
        setVitals({
          temperature: p.temperature || '',
          bloodPressure: p.bloodPressure || '',
          heartRate: p.heartRate || '',
          respiratoryRate: p.respiratoryRate || '',
          oximetry: p.oximetry || '',
          urinaryStrip: p.urinaryStrip || '',
          weight: p.weight || '',
          height: p.height || ''
        });
      }
    } else {
      setConsultationHistory([]);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedPatientId, patients]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAIAnalysis = async () => {
    if (!selectedPatient || !symptoms) return;
    setIsAnalyzing(true);
    const analysis = await GeminiService.analyzeSymptoms(symptoms, selectedPatient.medicalHistory);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis.trim()) {
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
      filename: `Ordonnance_${selectedPatient?.lastName || 'Patient'}_${consultationDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };
    (window as any).html2pdf().set(opt).from(element).save();
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    if (!diagnosis.trim()) {
        alert("Le diagnostic est obligatoire pour sauvegarder.");
        return;
    }

    const newConsultation: Consultation = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      appointmentId: 'manual', 
      date: new Date(consultationDate).toISOString(),
      symptoms,
      diagnosis,
      notes: aiAnalysis,
      prescription,
      vitals
    };

    try {
        await DataService.saveConsultation(newConsultation);
        
        // Mettre à jour les constantes sur le profil patient aussi
        await DataService.savePatient({
            ...selectedPatient,
            ...vitals
        });

        await loadHistory();
        alert('Consultation et constantes sauvegardées avec succès !');
        setSymptoms('');
        setAiAnalysis('');
        setPrescription([]);
        setDiagnosis('');
        setActiveTab('history');
    } catch (err) {
        alert("Erreur lors de la sauvegarde. Vérifiez votre connexion.");
    }
  };

  const updateVital = (field: keyof Vitals, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)] relative overflow-hidden">
      
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden no-print">
        
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
                <option key={p.id} value={p.id}>{p.lastName} {p.firstName} (CIN: {p.cin})</option>
                ))}
            </select>
            <button onClick={loadHistory} className="bg-white border border-slate-300 p-2 rounded-lg text-slate-500 hover:text-medical-600 hover:border-medical-600 transition">
                <History size={20}/>
            </button>
           </div>
           
           {selectedPatient && (
             <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-600">
                    <AlertCircle size={14} className="text-orange-500"/> 
                    Allergies: <strong className="text-rose-600">{selectedPatient.allergies.length ? selectedPatient.allergies.join(', ') : 'Aucune'}</strong>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                    <Activity size={14} className="text-red-500"/> 
                    Antécédents: <strong>{selectedPatient.medicalHistory.length ? selectedPatient.medicalHistory.join(', ') : 'Aucun'}</strong>
                </span>
             </div>
           )}
        </div>

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

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                
                {activeTab === 'new' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        
                        {/* SECTION DATE & CONSTANTES */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-50">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                        <Calendar size={14} className="text-medical-600" /> Date de la visite
                                    </label>
                                    <input 
                                        type="date" 
                                        value={consultationDate} 
                                        onChange={(e) => setConsultationDate(e.target.value)}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-medical-500 bg-slate-50 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold italic pt-4 md:pt-6">
                                    <Info size={14} className="shrink-0"/>
                                    Modifier pour enregistrer une consultation passée.
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4 pt-2">
                                <Activity size={18} className="text-medical-600" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Constantes de la visite</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <VitalInput icon={Thermometer} label="Temp (°C)" value={vitals.temperature} onChange={(v) => updateVital('temperature', v)} placeholder="37.0" />
                                <VitalInput icon={Activity} label="Tension (mmHg)" value={vitals.bloodPressure} onChange={(v) => updateVital('bloodPressure', v)} placeholder="120/80" />
                                <VitalInput icon={Activity} label="F.C (bpm)" value={vitals.heartRate} onChange={(v) => updateVital('heartRate', v)} placeholder="75" />
                                <VitalInput icon={Wind} label="F.R (cpm)" value={vitals.respiratoryRate} onChange={(v) => updateVital('respiratoryRate', v)} placeholder="16" />
                                <VitalInput icon={Droplets} label="SpO2 (%)" value={vitals.oximetry} onChange={(v) => updateVital('oximetry', v)} placeholder="98" />
                                <VitalInput icon={Scale} label="Poids (kg)" value={vitals.weight} onChange={(v) => updateVital('weight', v)} placeholder="70" />
                                <VitalInput icon={Ruler} label="Taille (cm)" value={vitals.height} onChange={(v) => updateVital('height', v)} placeholder="175" />
                                <VitalInput icon={TestTube} label="B.U" value={vitals.urinaryStrip} onChange={(v) => updateVital('urinaryStrip', v)} placeholder="Glu-, Prot-" />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Symptômes & Motif</label>
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-medical-500 outline-none text-slate-700 resize-y"
                                placeholder="Le patient se plaint de..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing || !symptoms}
                                    className="text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 font-bold"
                                >
                                    <Sparkles size={16} />
                                    {isAnalyzing ? 'Analyse...' : 'Analyse Gemini'}
                                </button>
                            </div>
                            {aiAnalysis && (
                                <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                                    <div className="font-semibold text-indigo-800 mb-1 flex items-center gap-2"><Sparkles size={12}/> Diagnostic Différentiel</div>
                                    <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Diagnostic Final</label>
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-medical-500 outline-none text-slate-700 resize-y font-bold"
                                placeholder="Diagnostic retenu..."
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                            />
                            <div className="mt-3 flex justify-end">
                                <button 
                                    onClick={handleGeneratePrescription}
                                    className="text-xs bg-medical-50 text-medical-700 px-3 py-1.5 rounded-lg hover:bg-medical-100 transition flex items-center gap-2 font-bold"
                                >
                                    <Pill size={14} /> Suggérer Traitement
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">Ordonnance</label>
                                <button onClick={() => setPrescription([...prescription, ''])} className="text-xs text-medical-600 font-bold hover:underline">+ Ajouter Médicament</button>
                            </div>
                            <div className="space-y-2">
                                {prescription.map((med, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <input 
                                        value={med} 
                                        onChange={(e) => {
                                            const newPresc = [...prescription];
                                            newPresc[idx] = e.target.value;
                                            setPrescription(newPresc);
                                        }}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:border-medical-500 outline-none font-medium"
                                        placeholder="Médicament, dosage..."
                                    />
                                    <button onClick={() => setPrescription(prescription.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500">&times;</button>
                                </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3 pb-8">
                            <button onClick={handleSave} className="flex-1 bg-medical-600 text-white py-3 rounded-xl hover:bg-medical-700 shadow-md flex items-center justify-center gap-2 font-bold transition">
                                <Save size={18} /> Enregistrer Consultation
                            </button>
                            <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"><Eye size={18} /></button>
                            <button onClick={handleDownloadPDF} className="px-4 bg-rose-600 text-white py-3 rounded-xl hover:bg-rose-700 shadow-md transition"><Download size={18} /></button>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in pb-16">
                        {consultationHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                <History size={48} className="mx-auto mb-2 opacity-20"/>
                                <p className="font-bold uppercase tracking-widest text-[10px]">Aucune visite enregistrée.</p>
                            </div>
                        ) : (
                            consultationHistory.map((consult) => (
                                <div key={consult.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-medical-300 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase text-center flex-col">
                                                <span>{new Date(consult.date).getDate()}</span>
                                                <span className="text-[8px]">{new Date(consult.date).toLocaleString('fr-FR', {month: 'short'})}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase">{consult.diagnosis}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold">{new Date(consult.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {consult.vitals && (
                                        <div className="grid grid-cols-4 gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            {consult.vitals.temperature && <div className="text-[9px] font-bold text-slate-500">T°: <span className="text-orange-600">{consult.vitals.temperature}°C</span></div>}
                                            {consult.vitals.bloodPressure && <div className="text-[9px] font-bold text-slate-500">TA: <span className="text-rose-600">{consult.vitals.bloodPressure}</span></div>}
                                            {consult.vitals.heartRate && <div className="text-[9px] font-bold text-slate-500">FC: <span className="text-red-600">{consult.vitals.heartRate}</span></div>}
                                            {consult.vitals.oximetry && <div className="text-[9px] font-bold text-slate-500">SpO2: <span className="text-cyan-600">{consult.vitals.oximetry}%</span></div>}
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-600 italic border-l-2 border-slate-100 pl-3 mb-3 leading-relaxed">"{consult.symptoms}"</p>
                                    
                                    <div className="flex flex-wrap gap-1">
                                        {consult.prescription.map((m, i) => (
                                            <span key={i} className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                                                <Pill size={10}/> {m}
                                            </span>
                                        ))}
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
                <FileText size={64} className="mb-4 opacity-10" />
                <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">Aucun patient sélectionné</p>
                <p className="text-xs font-medium text-slate-400 mt-1 text-center max-w-xs">Veuillez sélectionner un dossier patient pour initier la consultation et la prise de constantes.</p>
            </div>
        )}
      </div>

      {showPreview && (
          <div className="w-[148mm] shrink-0 bg-white shadow-2xl p-4 overflow-y-auto h-full border border-slate-200 animate-fade-in no-print">
            <div id="prescription-preview-content">
                <PrescriptionTemplate patient={selectedPatient} prescription={prescription} date={new Date(consultationDate)} />
            </div>
          </div>
      )}
      
      <div className="print-only">
         <PrescriptionTemplate patient={selectedPatient} prescription={prescription} date={new Date(consultationDate)} />
      </div>
    </div>
  );
};

const VitalInput = ({ icon: Icon, label, value, onChange, placeholder }: any) => (
    <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
            <Icon size={12} className="text-medical-500" /> {label}
        </label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full p-2 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-medical-500 transition-all text-slate-700"
        />
    </div>
);