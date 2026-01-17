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
    <div className="bg-white p-10 font-sans text-slate-900 max-w-[210mm] mx-auto min-h-[297mm]">
      {/* Header (Même style que l'ordonnance) */}
      <div className="border-b-4 border-slate-900 pb-4 mb-8 grid grid-cols-3 items-center">
        <div className="text-left">
          <h1 className="text-lg font-black text-slate-900 uppercase">Dr. Hasnaa El Malki</h1>
          <p className="text-xs font-bold text-slate-600 italic">Médecine Générale</p>
          <p className="text-[10px] text-slate-500 mt-1">Cabinet Médical Ait Melloul</p>
        </div>
        <div className="flex justify-center">
          <AppLogo size={60} />
        </div>
        <div className="text-right font-sans" dir="rtl">
          <h1 className="text-xl font-bold text-slate-900">الدكتورة حسناء المـالكي</h1>
          <p className="text-sm font-bold text-slate-600">طب عــــام</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase tracking-[0.2em] border-y-2 border-slate-100 py-2 inline-block px-12">Dossier Médical Partagé</h2>
      </div>

      {/* Patient Identity */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Identité du Patient</h3>
          <p className="text-xl font-black text-slate-900 uppercase">{patient.lastName} {patient.firstName}</p>
          <div className="grid grid-cols-2 text-xs gap-y-2">
            <span className="text-slate-500">Date de Naissance:</span>
            <span className="font-bold">{new Date(patient.birthDate).toLocaleDateString('fr-FR')}</span>
            <span className="text-slate-500">CIN:</span>
            <span className="font-bold">{patient.cin}</span>
            <span className="text-slate-500">Sexe:</span>
            <span className="font-bold">N/A</span>
            <span className="text-slate-500">Couverture:</span>
            <span className="font-bold">{patient.insuranceType}</span>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Contact & Coordonnées</h3>
          <div className="grid grid-cols-1 text-xs gap-y-2">
            <p className="font-bold">{patient.phone}</p>
            <p className="text-slate-600">{patient.email || 'Email non renseigné'}</p>
            <p className="text-slate-600 italic leading-relaxed">{patient.address}</p>
          </div>
        </div>
      </div>

      {/* Vitals & Clinical Profile */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-center">
          <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Poids / Taille</p>
          <p className="text-xl font-black text-indigo-900">{patient.weight || '--'} kg / {patient.height || '--'} cm</p>
          <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">IMC: {imcValue || '--'}</p>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 text-center col-span-2">
          <p className="text-[10px] font-black text-rose-400 uppercase mb-2">Allergies connues</p>
          <p className="text-sm font-black text-rose-800">
            {patient.allergies.length > 0 ? patient.allergies.join(' • ') : 'AUCUNE ALLERGIE SIGNALÉE'}
          </p>
        </div>
      </div>

      {/* History */}
      <div className="mb-10">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">Historique des Consultations</h3>
        <div className="space-y-6">
          {consultations.length > 0 ? consultations.map((c, idx) => (
            <div key={c.id} className="border-l-4 border-medical-500 pl-4 py-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-black text-slate-400">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                <span className="text-[10px] bg-medical-50 text-medical-700 px-2 py-0.5 rounded-lg font-black uppercase">Examen Clinique</span>
              </div>
              <div className="mb-3">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">Diagnostic :</p>
                <p className="text-sm font-bold text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100 whitespace-pre-wrap">{c.diagnosis}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Motif / Symptômes</p>
                  <p className="text-xs text-slate-600 italic whitespace-pre-wrap">"{c.symptoms}"</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Prescription</p>
                  <ul className="text-[10px] font-bold text-slate-800 space-y-0.5">
                    {c.prescription.map((m, i) => <li key={i}>• {m}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center py-10 text-slate-400 italic text-sm">Aucun historique de consultation enregistré.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t pt-6 text-[9px] text-slate-400 flex justify-between items-end">
        <div>
          <p>Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
          <p className="font-bold">Dossier médical confidentiel - CMHE Ait Melloul</p>
        </div>
        <div className="text-right">
          <p>Page 1 / 1</p>
        </div>
      </div>
    </div>
  );
};