import React, { useState, useEffect } from 'react';
import { Search, Printer, Plus, FileText, Calendar, Eye, Pill, Download, Trash2, Loader2 } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Consultation, Patient } from '../types';
import { PrescriptionTemplate } from './PrescriptionTemplate';

export const PrescriptionManager: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // State for printing/viewing
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isQuickPrescriptionOpen, setIsQuickPrescriptionOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [consData, patsData] = await Promise.all([
      DataService.getConsultations(),
      DataService.getPatients()
    ]);
    setConsultations(consData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setPatients(patsData);
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  // Filter logic
  const filteredConsultations = consultations.filter(c => {
    if (!c.prescription || c.prescription.length === 0) return false;
    const patient = getPatient(c.patientId);
    if (!patient) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.firstName.toLowerCase().includes(searchLower) ||
      c.prescription.some(med => med.toLowerCase().includes(searchLower))
    );
  });

  const handlePrint = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    // Allow React to render the template in the hidden print div, then print
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadPDF = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    
    // Wait for render in the off-screen container then PDF
    setTimeout(() => {
        if (typeof (window as any).html2pdf === 'undefined') {
            alert("Erreur: Librairie PDF non chargée.");
            return;
        }
        const element = document.getElementById('pdf-render-target');
        const patient = getPatient(consultation.patientId);
        
        const opt = {
          margin: 0,
          filename: `Ordonnance_${patient?.lastName || 'Patient'}_${new Date(consultation.date).toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        
        (window as any).html2pdf().set(opt).from(element).save();
    }, 100);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche le clic sur la ligne du tableau
    
    if (window.confirm('Voulez-vous vraiment supprimer cette ordonnance et la consultation associée ?')) {
      setIsDeleting(id);
      try {
        await DataService.deleteConsultation(id);
        setConsultations(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        alert(err.message || "Erreur lors de la suppression.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestion des Ordonnances</h1>
          <p className="text-slate-500 font-medium">Historique des prescriptions médicales</p>
        </div>
        <button 
          onClick={() => setIsQuickPrescriptionOpen(true)}
          className="bg-medical-600 hover:bg-medical-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-medical-100 font-bold text-sm"
        >
          <Plus size={20} /> Ordonnance Rapide
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher patient ou médicament..." 
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 pl-8">Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Contenu (Aperçu)</th>
                <th className="p-4 text-center">Médicaments</th>
                <th className="p-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredConsultations.map(consult => {
                const patient = getPatient(consult.patientId);
                const isItemDeleting = isDeleting === consult.id;

                return (
                  <tr key={consult.id} className={`hover:bg-slate-50 transition group ${isItemDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        <Calendar size={14} className="text-medical-500" />
                        {new Date(consult.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase ml-5">
                        {new Date(consult.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="p-4">
                      {patient ? (
                        <div>
                          <div className="font-black text-slate-800 text-sm uppercase tracking-tighter">{patient.lastName} {patient.firstName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">CIN: {patient.cin}</div>
                        </div>
                      ) : <span className="text-rose-400 font-bold text-xs">Patient supprimé</span>}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-600 font-medium truncate max-w-xs italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                        {consult.prescription[0]} {consult.prescription.length > 1 && `+ ${consult.prescription.length - 1} autres...`}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-medical-50 text-medical-700 border border-medical-100">
                         {consult.prescription.length}
                       </span>
                    </td>
                    <td className="p-4 pr-8 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                            onClick={() => handleDownloadPDF(consult)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Télécharger PDF"
                        >
                            <Download size={18} />
                        </button>
                        <button 
                            onClick={() => handlePrint(consult)}
                            className="p-2.5 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-xl transition-all"
                            title="Imprimer"
                        >
                            <Printer size={18} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => handleDelete(e, consult.id)}
                            className="p-2.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-xl transition-all border border-rose-100 hover:border-rose-600 shadow-sm"
                            title="Supprimer l'ordonnance"
                        >
                            {isItemDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredConsultations.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-300 flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <Pill size={32} className="opacity-20"/>
                          </div>
                          <p className="font-black uppercase tracking-widest text-[10px]">Aucune ordonnance trouvée</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Container */}
      <div className="print-only">
        {selectedConsultation && (
            <PrescriptionTemplate 
                patient={getPatient(selectedConsultation.patientId)}
                prescription={selectedConsultation.prescription}
                date={new Date(selectedConsultation.date)}
            />
        )}
      </div>

      {/* Off-screen PDF Render Container */}
      <div className="pdf-container">
        {selectedConsultation && (
            <div id="pdf-render-target">
                <PrescriptionTemplate 
                    patient={getPatient(selectedConsultation.patientId)}
                    prescription={selectedConsultation.prescription}
                    date={new Date(selectedConsultation.date)}
                />
            </div>
        )}
      </div>

      {/* Quick Prescription Modal */}
      {isQuickPrescriptionOpen && (
        <QuickPrescriptionModal 
            patients={patients} 
            onClose={() => setIsQuickPrescriptionOpen(false)} 
            onSave={async (consult: Consultation) => {
                await DataService.saveConsultation(consult);
                loadData();
                setIsQuickPrescriptionOpen(false);
                handlePrint(consult);
            }}
        />
      )}
    </div>
  );
};

const QuickPrescriptionModal = ({ patients, onClose, onSave }: any) => {
    const [patientId, setPatientId] = useState('');
    const [diagnosis, setDiagnosis] = useState('Consultation Standard');
    const [meds, setMeds] = useState<string[]>(['']);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const validMeds = meds.filter(m => m.trim() !== '');
        if(!patientId || validMeds.length === 0) return;

        const newConsult: Consultation = {
            id: Date.now().toString(),
            patientId,
            appointmentId: 'quick',
            date: new Date().toISOString(),
            symptoms: 'Renouvellement Ordonnance / Rapide',
            diagnosis: diagnosis,
            notes: 'Ordonnance rapide',
            prescription: validMeds
        };
        onSave(newConsult);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">Ordonnance Rapide</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-light hover:rotate-90 transition-transform">&times;</button>
                </div>
                <form onSubmit={handleSave} className="p-8 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Patient bénéficiaire</label>
                        <select 
                            required 
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 font-bold bg-white"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                        >
                            <option value="">Sélectionner un patient...</option>
                            {patients.map((p: Patient) => (
                                <option key={p.id} value={p.id}>{p.lastName.toUpperCase()} {p.firstName}</option>
                            ))}
                        </select>
                    </div>

                    {/* FORCE TEXTAREA POUR DIAGNOSTIC DANS ORDONNANCE RAPIDE */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Diagnostic(s)</label>
                        <textarea 
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-medical-500 font-bold bg-white h-24 resize-y"
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            placeholder="Entrez le diagnostic..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                          <span>Médicaments & Posologies</span>
                          <button type="button" onClick={() => setMeds([...meds, ''])} className="text-medical-600 hover:underline">+ Ajouter ligne</button>
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {meds.map((med, idx) => (
                                <div key={idx} className="flex gap-2 items-center animate-fade-in">
                                    <span className="w-6 flex items-center justify-center text-slate-300 font-black text-[10px]">{idx + 1}</span>
                                    <input 
                                        autoFocus={idx === meds.length - 1 && idx > 0}
                                        value={med}
                                        onChange={(e) => {
                                            const newMeds = [...meds];
                                            newMeds[idx] = e.target.value;
                                            setMeds(newMeds);
                                        }}
                                        className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-medical-500"
                                        placeholder="Ex: Doliprane 1g, 3 fois par jour..."
                                    />
                                    <button type="button" onClick={() => setMeds(meds.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 px-1 text-xl font-light">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-6 flex gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                        <button type="submit" className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-medical-100 hover:bg-medical-700 transition flex items-center justify-center gap-2">
                            <Printer size={16} /> Enregistrer et Imprimer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};