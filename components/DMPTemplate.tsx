
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

  const formatList = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const medicalHistory = formatList(patient.medicalHistory);
  const allergies = formatList(patient.allergies);

  return (
    <div className="bg-white p-6 font-sans text-slate-900 mx-auto" style={{ width: '148mm', minHeight: '210mm', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
      {/* Header Professionnel Réduit */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4 grid grid-cols-3 items-center">
        <div className="text-left">
          <h1 className="text-[11px] font-black text-slate-900 uppercase leading-tight">Dr. Hasnaa El Malki</h1>
          <p className="text-[8px] font-bold text-slate-600 italic">Médecine Générale</p>
        </div>
        <div className="flex justify-center">
          <AppLogo size={40} />
        </div>
        <div className="text-right font-sans" dir="rtl">
          <h1 className="text-xs font-bold text-slate-900">الدكتورة حسناء المـالكي</h1>
          <p className="text-[9px] font-bold text-slate-600">طب عــــام</p>
        </div>
      </div>

      <div className="text-center mb-4">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] border-y border-slate-100 py-1.5 inline-block px-8 text-medical-900">
          Dossier Médical (DMP)
        </h2>
      </div>

      {/* État Civil Compact */}
      <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{patient.lastName} {patient.firstName}</p>
          <div className="text-[9px] font-bold text-slate-600 space-y-0.5">
            <p><span className="text-slate-400 uppercase font-black text-[7px] mr-1">Né(e) le:</span> {new Date(patient.birthDate).toLocaleDateString('fr-FR')}</p>
            <p><span className="text-slate-400 uppercase font-black text-[7px] mr-1">CIN:</span> {patient.cin || '---'}</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black text-medical-700">{patient.phone}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase">{patient.insuranceType}</p>
        </div>
      </div>

      {/* Médical - 2 Colonnes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
           <h3 className="text-[7px] font-black text-blue-400 uppercase mb-1">Antécédents</h3>
           <p className="text-[9px] font-bold text-slate-700 leading-tight">
             {medicalHistory.length > 0 ? medicalHistory.join(', ') : 'Aucun.'}
           </p>
        </div>
        <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
           <h3 className="text-[7px] font-black text-rose-400 uppercase mb-1">Allergies</h3>
           <p className="text-[9px] font-bold text-slate-700 leading-tight">
             {allergies.length > 0 ? allergies.join(', ') : 'Aucune.'}
           </p>
        </div>
      </div>

      {/* Consultations - Liste compacte */}
      <div>
        <h3 className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Historique des Visites</h3>
        <div className="space-y-3">
          {consultations.slice(0, 5).map((c) => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-black text-slate-500 uppercase">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{c.diagnosis}</span>
              </div>
              {c.vitals && (
                  <div className="flex gap-2 text-[7px] font-bold text-slate-400 mb-1 opacity-70">
                     {c.vitals.weight && <span>{c.vitals.weight}kg</span>}
                     {c.vitals.bloodPressure && <span>TA: {c.vitals.bloodPressure}</span>}
                     {c.vitals.temperature && <span>{c.vitals.temperature}°C</span>}
                  </div>
              )}
              <p className="text-[8px] text-slate-500 italic truncate italic">"{c.symptoms}"</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center absolute bottom-6 left-6 right-6">
        <p className="text-[7px] font-black text-slate-300 uppercase">Document A5 - CMHE Ait Melloul</p>
        <p className="text-[7px] font-bold text-slate-300">Édité le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  );
};
