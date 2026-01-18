import React from 'react';
import { Patient, Consultation } from '../types';
import { AppLogo } from './common/AppLogo';

interface DMPTemplateProps {
  patient: Patient;
  consultations: Consultation[];
}

export const DMPTemplate: React.FC<DMPTemplateProps> = ({ patient, consultations }) => {
  const calculateIMC = () => {
    if (!patient?.weight || !patient?.height) return null;
    const w = parseFloat(patient.weight);
    const h = parseFloat(patient.height) / 100;
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return (w / (h * h)).toFixed(1);
  };

  const imcValue = calculateIMC();

  return (
    <div className="bg-white p-10 font-sans text-slate-900 mx-auto" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
      {/* Header Professionnel */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 grid grid-cols-3 items-center">
        <div className="text-left">
          <h1 className="text-lg font-black text-slate-900 uppercase leading-tight">Dr. Hasnaa El Malki</h1>
          <p className="text-xs font-bold text-slate-600 italic">Médecine Générale</p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Cabinet Médical Ait Melloul</p>
        </div>
        <div className="flex justify-center">
          <AppLogo size={70} />
        </div>
        <div className="text-right font-sans" dir="rtl">
          <h1 className="text-xl font-bold text-slate-900">الدكتورة حسناء المـالكي</h1>
          <p className="text-sm font-bold text-slate-600">طب عــــام</p>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-black uppercase tracking-[0.3em] border-y-2 border-slate-100 py-3 inline-block px-16 text-medical-900">
          Dossier Médical Partagé
        </h2>
      </div>

      {/* État Civil & Identité */}
      <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">Identité</h3>
          <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">{patient.lastName} {patient.firstName}</p>
          <div className="grid grid-cols-1 text-[11px] gap-y-2 font-bold text-slate-600">
            <p><span className="text-slate-400 uppercase font-black text-[9px] mr-2">Né(e) le:</span> {new Date(patient.birthDate).toLocaleDateString('fr-FR')}</p>
            <p><span className="text-slate-400 uppercase font-black text-[9px] mr-2">CIN:</span> {patient.cin}</p>
            <p><span className="text-slate-400 uppercase font-black text-[9px] mr-2">Mutuelle:</span> {patient.insuranceType} {patient.insuranceNumber ? `(N° ${patient.insuranceNumber})` : ''}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">Contact</h3>
          <div className="space-y-2">
            <p className="text-lg font-black text-medical-700">{patient.phone}</p>
            <p className="text-sm font-bold text-slate-500">{patient.email || 'Email non renseigné'}</p>
            <p className="text-xs text-slate-400 italic leading-relaxed">{patient.address}</p>
          </div>
        </div>
      </div>

      {/* Constantes Cliniques */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Biométrie</p>
          <p className="text-lg font-black text-slate-800">{patient.weight || '--'} kg / {patient.height || '--'} cm</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">IMC</p>
          <p className="text-lg font-black text-medical-600">{imcValue || '--'}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Groupe Sanguin</p>
          <p className="text-lg font-black text-rose-600">{patient.bloodType || '--'}</p>
        </div>
      </div>

      {/* PROFIL MÉDICAL (Antécédents & Allergies) */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
           <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 border-b border-blue-100 pb-2">Antécédents Médicaux</h3>
           <p className="text-xs font-bold text-slate-700 leading-relaxed">
             {patient.medicalHistory && patient.medicalHistory.length > 0 
               ? patient.medicalHistory.join(', ') 
               : 'Aucun antécédent majeur renseigné'}
           </p>
        </div>
        <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
           <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 border-b border-rose-100 pb-2">Allergies & Intolérances</h3>
           <p className="text-xs font-bold text-slate-700 leading-relaxed">
             {patient.allergies && patient.allergies.length > 0 
               ? patient.allergies.join(', ') 
               : 'Aucune allergie connue'}
           </p>
        </div>
      </div>

      {/* Historique Médical Détaillé */}
      <div className="mb-10">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-6">Historique des Consultations</h3>
        <div className="space-y-8">
          {consultations.length > 0 ? consultations.map((c) => (
            <div key={c.id} className="relative pl-8 border-l-2 border-slate-200 pb-2">
              <div className="absolute -left-[7px] top-0 w-3 h-3 bg-medical-600 rounded-full border-2 border-white shadow-sm"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-400">{new Date(c.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">Acte Médical</span>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic</p>
                <p className="text-sm font-black text-slate-900 mb-4 whitespace-pre-wrap">{c.diagnosis}</p>
                
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Symptômes</p>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">"{c.symptoms}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Prescription</p>
                    <ul className="text-[11px] font-bold text-slate-700 space-y-1">
                      {c.prescription && c.prescription.length > 0 ? (
                        c.prescription.map((m, i) => <li key={i}>• {m}</li>)
                      ) : (
                        <li className="italic text-slate-300">Aucune prescription</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center py-16 text-slate-300 font-black uppercase tracking-widest text-xs border-2 border-dashed border-slate-50 rounded-[2rem]">
              Aucun historique enregistré
            </p>
          )}
        </div>
      </div>

      {/* Footer Sécurisé */}
      <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase">Document Médical Confidentiel</p>
          <p className="text-[8px] text-slate-300">Généré le {new Date().toLocaleDateString('fr-FR')} - CMHE Manager v2025</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">
            Ait Melloul, Maroc
          </div>
        </div>
      </div>
    </div>
  );
};