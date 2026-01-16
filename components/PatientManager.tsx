
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, UserCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Patient } from '../types';

export const PatientManager: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    const data = await DataService.getPatients();
    setPatients([...data]); // Force a new array reference
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newPatient: Patient = {
      id: editingPatient ? editingPatient.id : `P-${Date.now()}`,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      birthDate: formData.get('birthDate') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      cin: formData.get('cin') as string,
      insuranceType: formData.get('insuranceType') as any,
      insuranceNumber: formData.get('insuranceNumber') as string,
      address: formData.get('address') as string,
      medicalHistory: (formData.get('medicalHistory') as string).split(',').map(s => s.trim()).filter(s => s),
      allergies: (formData.get('allergies') as string).split(',').map(s => s.trim()).filter(s => s),
      bloodType: formData.get('bloodType') as any,
      weight: formData.get('weight') as string,
      height: formData.get('height') as string,
      createdAt: editingPatient ? editingPatient.createdAt : new Date().toISOString()
    };

    // Mise à jour de l'état local AVANT de fermer la modale pour un feedback visuel immédiat
    setPatients(prev => {
      const idx = prev.findIndex(p => p.id === newPatient.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newPatient;
        return next;
      }
      return [newPatient, ...prev];
    });

    await DataService.savePatient(newPatient);
    setIsModalOpen(false);
    setEditingPatient(null);
    
    // Rafraîchissement final pour s'assurer de la cohérence
    setTimeout(() => loadPatients(), 500);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Confirmer la suppression de ce patient ?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
      await DataService.deletePatient(id);
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
          onClick={() => { setEditingPatient(null); setIsModalOpen(true); }}
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
                        onClick={() => { setEditingPatient(patient); setIsModalOpen(true); }}
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
              {filteredPatients.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                      <Search size={40} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucun patient trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest">
                {editingPatient ? 'Modifier Dossier' : 'Nouveau Dossier Patient'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-3xl font-light hover:rotate-90 transition-transform">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5 overflow-y-auto">
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
                  <input name="cin" defaultValue={editingPatient?.cin} required className="w-full p-3 border border-slate-200 rounded-xl font-black outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sang</label>
                  <select name="bloodType" defaultValue={editingPatient?.bloodType} className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold">
                    <option value="">--</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
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
                  <select name="insuranceType" defaultValue={editingPatient?.insuranceType || 'AUCUNE'} className="w-full p-3 border border-slate-200 rounded-xl text-xs font-black uppercase">
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

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] hover:bg-slate-50 rounded-2xl transition">Annuler</button>
                <button type="submit" className="flex-[2] py-4 bg-medical-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-medical-100 hover:bg-medical-700 transition active:scale-95">Valider l'enregistrement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
