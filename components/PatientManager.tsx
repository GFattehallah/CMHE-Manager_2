import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, UserCircle, Loader2, Scale, Ruler, Thermometer, Activity, Wind, Droplets, TestTube, AlertCircle, Database } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Patient } from '../types';

export const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await DataService.getPatients();
      setPatients([...data]);
    } catch (err) {
      console.error("Load Patients Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Fonction utilitaire pour nettoyer les valeurs
    const clean = (val: any): string | null => {
        if (val === undefined || val === null) return null;
        const str = val.toString().trim();
        return str === "" ? null : str;
    };

    const medicalHistoryRaw = clean(formData.get('medicalHistory')) || "";
    const allergiesRaw = clean(formData.get('allergies')) || "";

    const newPatient: Patient = {
      id: editingPatient ? editingPatient.id : `P-${Date.now()}`,
      firstName: clean(formData.get('firstName')) || "Prénom",
      lastName: (clean(formData.get('lastName')) || "NOM").toUpperCase(),
      birthDate: formData.get('birthDate') as string,
      phone: clean(formData.get('phone')) || "",
      email: (clean(formData.get('email')))?.toLowerCase() || null,
      cin: (clean(formData.get('cin')))?.toUpperCase() || null,
      insuranceType: formData.get('insuranceType') as any,
      insuranceNumber: clean(formData.get('insuranceNumber')) || "",
      address: clean(formData.get('address')) || "",
      medicalHistory: medicalHistoryRaw.split(',').map(s => s.trim()).filter(s => s),
      allergies: allergiesRaw.split(',').map(s => s.trim()).filter(s => s),
      bloodType: formData.get('bloodType') as any,
      weight: clean(formData.get('weight')),
      height: clean(formData.get('height')),
      temperature: clean(formData.get('temperature')),
      bloodPressure: clean(formData.get('bloodPressure')),
      heartRate: clean(formData.get('heartRate')),
      respiratoryRate: clean(formData.get('respiratoryRate')),
      oximetry: clean(formData.get('oximetry')),
      urinaryStrip: clean(formData.get('urinaryStrip')),
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString()
    };

    try {
      await DataService.savePatient(newPatient);
      
      setIsModalOpen(false);
      setEditingPatient(null);
      
      // Mise à jour locale immédiate pour réactivité
      setPatients(prev => {
        const idx = prev.findIndex(p => p.id === newPatient.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newPatient;
          return next;
        }
        return [newPatient, ...prev];
      });

      // Rafraîchissement complet après un court délai
      setTimeout(() => loadPatients(), 300);
    } catch (err: any) {
      // Transformation robuste de l'erreur en string pour l'affichage UI
      console.error("Erreur capturée dans l'UI:", err);
      const errorMessage = err?.message || (typeof err === 'string' ? err : "Une erreur inconnue est survenue.");
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Confirmer la suppression de ce patient ?')) {
      try {
        await DataService.deletePatient(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert("Erreur lors de la suppression : " + (err.message || "Erreur inconnue"));
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cin || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestion Patients</h1>
          <p className="text-slate-500 font-medium">Répertoire complet des dossiers médicaux</p>
        </div>
        <button 
          onClick={() => { setError(null); setEditingPatient(null); setIsModalOpen(true); }}
          className="bg-medical-600 hover:bg-medical-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition shadow-lg shadow-medical-100 font-bold"
        >
          <Plus size={20} /> Nouveau Patient
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher (Nom, CIN, etc.)" 
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500 font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 px-4">
             {isLoading && <Loader2 className="animate-spin text-medical-500" size={20}/>}
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredPatients.length} patients</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="p-5 pl-8">Patient</th>
                <th className="p-5">Identité</th>
                <th className="p-5">Contact</th>
                <th className="p-5 text-center">Biométrie</th>
                <th className="p-5">Couverture</th>
                <th className="p-5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 transition group">
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center font-black text-sm border border-medical-100">
                         {patient.lastName?.[0]}{patient.firstName?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm uppercase tracking-tighter">{patient.lastName} {patient.firstName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(patient.birthDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                      {patient.cin || '---'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-bold text-slate-700">{patient.phone}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{patient.email}</div>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] font-black text-slate-700">{patient.weight ? `${patient.weight}kg` : '--'}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{patient.height ? `${patient.height}cm` : '--'}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      patient.insuranceType === 'CNSS' ? 'bg-orange-100 text-orange-700' : 
                      patient.insuranceType === 'CNOPS' ? 'bg-purple-100 text-purple-700' : 
                      patient.insuranceType === 'PRIVEE' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {patient.insuranceType}
                    </span>
                  </td>
                  <td className="p-5 text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => navigate(`/dmp/${patient.id}`)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center gap-1 font-black text-[10px] uppercase tracking-tighter"
                      >
                        <UserCircle size={18} /> Dossier
                      </button>
                      <button 
                        onClick={() => { setError(null); setEditingPatient(patient); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition shadow-none hover:shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                         onClick={() => handleDelete(patient.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest">
                {editingPatient ? 'Modifier Dossier' : 'Nouveau Dossier Patient'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-5 rounded-2xl animate-fade-in shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <AlertCircle className="shrink-0 mt-0.5 text-rose-600" size={20} />
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-rose-800">Échec de synchronisation Cloud</p>
                        <p className="text-[11px] font-bold leading-relaxed">{error}</p>
                    </div>
                  </div>
                  {error.includes("STRUCTURE SQL") && (
                    <div className="mt-4 p-4 bg-white/60 border border-rose-200 rounded-xl flex flex-col gap-3">
                        <p className="text-[10px] font-black text-rose-900 uppercase">Action Requise :</p>
                        <Link to="/maintenance" onClick={() => setIsModalOpen(false)} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-700 transition">
                            <Database size={14}/> Aller vers Migration & Backup
                        </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prénom</label>
                  <input name="firstName" defaultValue={editingPatient?.firstName} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-medical-500 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom</label>
                  <input name="lastName" defaultValue={editingPatient?.lastName} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-medical-500 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Naissance</label>
                  <input type="date" name="birthDate" defaultValue={editingPatient?.birthDate} required className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CIN</label>
                  <input name="cin" defaultValue={editingPatient?.cin} placeholder="A123456" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Groupe Sang.</label>
                  <select name="bloodType" defaultValue={editingPatient?.bloodType} className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold bg-white">
                    <option value="">--</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Examen Clinique de base</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Scale size={12} className="text-medical-500"/> Poids (kg)
                    </label>
                    <input type="text" name="weight" defaultValue={editingPatient?.weight} placeholder="ex: 75.5" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Ruler size={12} className="text-medical-500"/> Taille (cm)
                    </label>
                    <input type="text" name="height" defaultValue={editingPatient?.height} placeholder="ex: 175" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Thermometer size={12} className="text-orange-500"/> Température (°C)
                    </label>
                    <input type="text" name="temperature" defaultValue={editingPatient?.temperature} placeholder="ex: 37.2" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Activity size={12} className="text-rose-500"/> Tension (mmHg)
                    </label>
                    <input type="text" name="bloodPressure" defaultValue={editingPatient?.bloodPressure} placeholder="ex: 120/80" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Activity size={12} className="text-red-500"/> F.C (bpm)
                    </label>
                    <input type="text" name="heartRate" defaultValue={editingPatient?.heartRate} placeholder="bpm" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Wind size={12} className="text-blue-500"/> F.R (cpm)
                    </label>
                    <input type="text" name="respiratoryRate" defaultValue={editingPatient?.respiratoryRate} placeholder="cpm" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <Droplets size={12} className="text-cyan-500"/> SpO2 (%)
                    </label>
                    <input type="text" name="oximetry" defaultValue={editingPatient?.oximetry} placeholder="%" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    <TestTube size={12} className="text-amber-600"/> Bandelettes Urinaires
                  </label>
                  <input type="text" name="urinaryStrip" defaultValue={editingPatient?.urinaryStrip} placeholder="ex: Glu -, Prot +, Leu ++" className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none focus:ring-2 focus:ring-medical-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Téléphone</label>
                  <input name="phone" defaultValue={editingPatient?.phone} required className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <input type="email" name="email" defaultValue={editingPatient?.email} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assurance</label>
                  <select name="insuranceType" defaultValue={editingPatient?.insuranceType || 'AUCUNE'} className="w-full p-3 border border-slate-200 rounded-xl text-xs font-black uppercase bg-white">
                    <option value="CNSS">CNSS</option>
                    <option value="CNOPS">CNOPS</option>
                    <option value="PRIVEE">Privée</option>
                    <option value="AUCUNE">Aucune</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">N° Immatriculation</label>
                  <input name="insuranceNumber" defaultValue={editingPatient?.insuranceNumber} className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Adresse</label>
                <input name="address" defaultValue={editingPatient?.address} className="w-full p-3 border border-slate-200 rounded-xl font-medium outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Antécédents (séparés par des virgules)</label>
                <textarea name="medicalHistory" defaultValue={editingPatient?.medicalHistory?.join(', ')} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none h-20 resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Allergies (séparées par des virgules)</label>
                <textarea name="allergies" defaultValue={editingPatient?.allergies?.join(', ')} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none h-20 resize-none" />
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-medical-100 hover:bg-medical-700 transition active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sauvegarde...
                    </>
                  ) : "Valider l'enregistrement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};