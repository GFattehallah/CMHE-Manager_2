import React, { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Code, Copy, Check, Info, Server } from 'lucide-react';
import { BackupService } from '../services/backupService';
import { isSupabaseConfigured } from '../services/supabase';

export const MaintenanceManager: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [copied, setCopied] = useState(false);
  
  const isCloud = isSupabaseConfigured();

  const SQL_UPDATE_SCHEMA = `-- 🚀 SCRIPT DE CONFIGURATION CMHE MANAGER (V2025)
-- Instructions : Copiez ce code et collez-le dans "SQL Editor" sur votre dashboard Supabase.

-- 1. CRÉATION / MISE À JOUR DE LA TABLE PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  "birthDate" text,
  phone text,
  email text,
  cin text,
  "insuranceType" text DEFAULT 'AUCUNE',
  "insuranceNumber" text,
  address text,
  "medicalHistory" text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 2. AJOUT DES COLONNES BIOMÉTRIQUES (Si manquantes)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "bloodType" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "weight" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "height" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "temperature" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "bloodPressure" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "heartRate" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "respiratoryRate" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "oximetry" text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "urinaryStrip" text;

-- 3. CRÉATION DE LA TABLE CONSULTATIONS
CREATE TABLE IF NOT EXISTS consultations (
  id text PRIMARY KEY,
  "patientId" text REFERENCES patients(id) ON DELETE CASCADE,
  "appointmentId" text,
  date timestamp with time zone DEFAULT now(),
  symptoms text,
  diagnosis text,
  notes text,
  prescription text[] DEFAULT '{}',
  vitals jsonb DEFAULT '{}'::jsonb
);

-- 4. CRÉATION DE LA TABLE FACTURES
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  "patientId" text REFERENCES patients(id) ON DELETE SET NULL,
  date timestamp with time zone DEFAULT now(),
  amount numeric DEFAULT 0,
  status text DEFAULT 'PAID',
  "paymentMethod" text DEFAULT 'Espèces',
  items jsonb DEFAULT '[]'::jsonb
);

-- 5. RÉINITIALISATION DU CACHE API (CRITIQUE pour corriger PGRST204)
NOTIFY pgrst, 'reload schema';

-- ✅ CONFIGURATION TERMINÉE`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_UPDATE_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await BackupService.exportAllData();
      setStatus({ type: 'success', message: 'Fichier de sauvegarde généré avec succès.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Échec de la génération de la sauvegarde.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Attention : Cette action va fusionner les données du fichier avec votre base actuelle. Continuer ?")) {
        e.target.value = '';
        return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const result = await BackupService.importData(content);
        
        if (result.success) {
          setStatus({ type: 'success', message: `${result.count} entrées ont été synchronisées avec succès.` });
        } else {
          setStatus({ type: 'error', message: `Erreur lors de l'import : ${result.error}` });
        }
      } catch (err) {
        setStatus({ type: 'error', message: "Le fichier importé est invalide ou corrompu." });
      } finally {
        setIsProcessing(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-xl text-white">
                <Database size={24} />
             </div>
             Maintenance & Migration
          </h1>
          <p className="text-slate-500 font-medium mt-1">Maintenance de la base de données Cloud et Backups</p>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Server size={160} className="text-white"/>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <Code size={18} className="text-indigo-300"/> Assistant SQL de Configuration
                    </h3>
                    <p className="text-indigo-200 text-xs mt-1 font-medium">Corrige les erreurs de colonnes manquantes (Tension, Poids, etc.)</p>
                </div>
                <button 
                  onClick={handleCopySQL}
                  className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase transition-all shadow-xl ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900 hover:bg-indigo-50'}`}
                >
                  {copied ? <Check size={16}/> : <Copy size={16}/>}
                  {copied ? 'Code Copié !' : 'Copier le script SQL'}
                </button>
            </div>
            
            <div className="bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 border border-white/5 whitespace-pre-wrap leading-relaxed overflow-x-auto custom-scrollbar max-h-48">
                {SQL_UPDATE_SCHEMA}
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 bg-white/10 rounded-xl border border-white/5 text-[11px] text-indigo-100 leading-relaxed">
                <Info size={18} className="shrink-0 text-white"/>
                <div>
                  <p className="font-bold mb-1">Comment appliquer ce correctif ?</p>
                  <ol className="list-decimal list-inside space-y-1 opacity-80">
                    <li>Copiez le script ci-dessus via le bouton blanc.</li>
                    <li>Ouvrez votre Dashboard Supabase.</li>
                    <li>Allez dans l'onglet <strong>"SQL Editor"</strong> (icône &gt;_).</li>
                    <li>Cliquez sur <strong>"+ New Query"</strong>, collez le code et cliquez sur <strong>"Run"</strong>.</li>
                  </ol>
                </div>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-medical-300 transition-all">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-medical-50 group-hover:text-medical-600 transition-colors">
            <Download size={32} />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Sauvegarde JSON</h3>
          <p className="text-slate-500 text-sm mb-8 px-4 font-medium leading-relaxed">Téléchargez une archive complète de vos données locales et cloud.</p>
          <button 
            onClick={handleExport}
            disabled={isProcessing}
            className="w-full py-4 bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Download size={16}/>}
            Générer Backup (.json)
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-emerald-300 transition-all">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
            <Upload size={32} />
          </div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-2">Restaurer des données</h3>
          <p className="text-slate-500 text-sm mb-8 px-4 font-medium leading-relaxed">Fusionnez un fichier de sauvegarde précédemment exporté avec vos données actuelles.</p>
          
          <label className={`w-full py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'}`}>
            <Database size={16}/>
            Sélectionner et Importer
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={isProcessing} />
          </label>
        </div>
      </div>

      {status.type && (
        <div className={`p-6 rounded-[2rem] border animate-fade-in flex items-center gap-4 ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
            {status.type === 'success' ? <CheckCircle2 size={24}/> : <ShieldAlert size={24}/>}
            <div className="flex-1">
                <p className="font-black text-xs uppercase tracking-widest">{status.type === 'success' ? 'Opération réussie' : 'Erreur de procédure'}</p>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{status.message}</p>
            </div>
            <button onClick={() => setStatus({type: null, message: ''})} className="text-xs font-bold underline px-4 py-2 hover:bg-black/5 rounded-lg">Fermer</button>
        </div>
      )}
    </div>
  );
};