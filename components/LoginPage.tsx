import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { User } from '../types';
import { AppLogo } from './common/AppLogo';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await AuthService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 min-h-[600px]">
        
        {/* Left Side - Brand */}
        <div className="bg-medical-900 p-12 flex flex-col justify-between text-white md:w-5/12 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-medical-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="relative z-10">
            <div className="mb-12">
               {/* Utilisation de AppLogo avec une taille généreuse et un style propre pour le branding */}
               <AppLogo size={180} className="shadow-2xl shadow-black/40" />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter leading-tight uppercase">CMHE<br/>Manager Pro</h1>
            <p className="text-medical-200 font-medium leading-relaxed">Solution de gestion intelligente pour le cabinet du Dr. Hasnaa El Malki.</p>
          </div>
          <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-medical-400 relative z-10">
            Ait Melloul • Version 2025
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 md:p-16 flex-1 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Espace Professionnel</h2>
            <p className="text-slate-400 mt-2 font-medium text-sm">Veuillez vous identifier pour accéder au logiciel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-rose-100 animate-fade-in">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  placeholder="nom@cmhe.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 shadow-xl shadow-slate-200"
            >
              {isLoading ? 'Authentification...' : 'Accéder au cabinet'}
              {!isLoading && <ChevronRight size={18} />}
            </button>
            
            {onBack && (
              <button 
                type="button"
                onClick={onBack}
                className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition mt-4"
              >
                Retour à l'accueil
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
