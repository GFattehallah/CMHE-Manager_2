import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Stethoscope, FileText, 
  LogOut, Menu, X, ScrollText, Banknote, FileSpreadsheet, Shield, UserCircle, Database,
  Cloud, CloudOff, RefreshCw, AlertTriangle, ExternalLink, Activity, ArrowRight, Heart
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { PatientManager } from './components/PatientManager';
import { PatientDMP } from './components/PatientDMP';
import { ConsultationManager } from './components/ConsultationManager';
import { AppointmentManager } from './components/AppointmentManager';
import { PrescriptionManager } from './components/PrescriptionManager';
import { BillingManager } from './components/BillingManager';
import { FinanceManager } from './components/FinanceManager';
import { AccountManager } from './components/AccountManager';
import { ImportPatients } from './components/ImportPatients';
import { MaintenanceManager } from './components/MaintenanceManager';
import { LoginPage } from './components/LoginPage';
import { AuthService } from './services/authService';
import { isSupabaseConfigured, getConfigurationStatus } from './services/supabase';
import { User, Permission, Role } from './types';
import { AppLogo } from './components/common/AppLogo';

const LandingPage = ({ onGoToLogin }: { onGoToLogin: () => void }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
    <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 md:px-12 flex items-center justify-between">
      <AppLogo size={40} showText={true} />
      <button 
        onClick={onGoToLogin}
        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
      >
        Espace Pro
      </button>
    </header>

    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 text-center max-w-6xl mx-auto">
      <div className="mb-12 inline-flex items-center gap-2 px-4 py-2 bg-medical-50 rounded-full border border-medical-100 text-[10px] font-black text-medical-700 uppercase tracking-widest animate-fade-in">
        <Activity size={14}/> Cabinet Médical Moderne Ait Melloul
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
        Gérez votre cabinet avec <span className="text-medical-600">excellence.</span>
      </h1>
      
      <p className="text-xl text-slate-500 max-w-2xl mb-12 font-medium leading-relaxed">
        La plateforme intelligente de gestion pour les professionnels de santé. 
        Dossiers médicaux, agenda partagé et facturation simplifiée.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-20">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <UserCircle size={28}/>
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Dossier Patient</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">Centralisation complète des antécédents, allergies et documents médicaux.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <Calendar size={28}/>
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Agenda Intelligent</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">Planification optimisée des rendez-vous et rappels automatiques pour l'équipe.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
          <div className="w-14 h-14 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <Banknote size={28}/>
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Facturation MAD</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">Suivi des honoraires, gestion des dépenses et exportations comptables Excel.</p>
        </div>
      </div>

      <button 
        onClick={onGoToLogin}
        className="group bg-medical-900 text-white px-10 py-6 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center gap-4 hover:bg-black transition-all shadow-2xl hover:-translate-y-1"
      >
        Accéder au Logiciel <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </main>

    <footer className="py-12 border-t border-slate-100 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <AppLogo size={32} className="grayscale opacity-30" />
      </div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        Cabinet Médical CMHE Manager Pro &copy; 2025
      </p>
    </footer>
  </div>
);

const SidebarItem = ({ icon: Icon, label, path, active }: any) => (
  <Link 
    to={path} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-medical-900 text-white font-bold shadow-lg shadow-medical-100' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm tracking-tight">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [view, setView] = useState<'landing' | 'login'>('landing');

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsReady(true);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setView('landing');
  };

  if (!isReady) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Activity size={32} className="text-medical-600 animate-spin" />
    </div>
  );

  return (
    <Router>
      {!user ? (
        view === 'landing' ? (
          <LandingPage onGoToLogin={() => setView('login')} />
        ) : (
          <LoginPage onLogin={handleLogin} onBack={() => setView('landing')} />
        )
      ) : (
        <MainLayout user={user} onLogout={handleLogout} />
      )}
    </Router>
  );
};

const MainLayout: React.FC<{user: User, onLogout: () => void}> = ({ user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const isCloud = isSupabaseConfigured();
  const configStatus = getConfigurationStatus();
  const location = useLocation();

  const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/', permission: Permission.DASHBOARD },
    { label: 'Dossiers Médicaux (DMP)', icon: UserCircle, path: '/patients', permission: Permission.DMP_VIEW },
    { label: 'Agenda & RDV', icon: Calendar, path: '/agenda', permission: Permission.AGENDA },
    { label: 'Consultations', icon: Stethoscope, path: '/consultations', permission: Permission.CONSULTATIONS },
    { label: 'Ordonnances', icon: ScrollText, path: '/prescriptions', permission: Permission.PRESCRIPTIONS },
    { label: 'Facturation & Honoraires', icon: FileText, path: '/billing', permission: Permission.BILLING },
    { label: 'Trésorerie & Finance', icon: Banknote, path: '/finance', permission: Permission.FINANCE },
    { label: 'Importation Patients', icon: FileSpreadsheet, path: '/import-patients', permission: Permission.IMPORT },
    { label: 'Gestion du Personnel', icon: Shield, path: '/users', permission: Permission.USERS },
    { label: 'Migration & Backup', icon: Database, path: '/maintenance', permission: Permission.USERS },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (user?.role === Role.ADMIN) return true;
    return user?.permissions.includes(item.permission);
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside 
        className={`bg-white border-r border-slate-200 fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20 lg:hover:w-72 group'
        } no-print`}
      >
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <AppLogo size={36} className="mr-3" />
            <div className={`flex flex-col ${!isSidebarOpen && 'lg:hidden group-hover:flex'}`}>
              <span className="font-black text-lg text-slate-800 tracking-tighter uppercase leading-tight">CMHE Mgr</span>
              <div className="flex items-center gap-1.5">
                {isCloud ? (
                  <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest"><Cloud size={8}/> Cloud Sync</span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-widest"><CloudOff size={8}/> Local Mode</span>
                )}
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {visibleNavItems.map((item, idx) => (
              <SidebarItem key={`${item.path}-${idx}`} {...item} active={location.pathname === item.path} />
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            {!isCloud && (
              <div className={`mb-4 p-4 ${configStatus.isWrongProvider ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'} border rounded-2xl ${!isSidebarOpen && 'lg:hidden group-hover:block'}`}>
                <div className={`flex items-center gap-2 mb-2 ${configStatus.isWrongProvider ? 'text-rose-800' : 'text-amber-800'}`}>
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {configStatus.isWrongProvider ? 'Mauvaise Clé détectée' : 'Action requise'}
                  </span>
                </div>
                <p className={`text-[9px] ${configStatus.isWrongProvider ? 'text-rose-800' : 'text-amber-800'} leading-normal mb-3`}>
                  {configStatus.isWrongProvider 
                    ? "Vous avez utilisé une clé CLERK (ssb_). Supabase nécessite la clé 'anon' qui commence par 'eyJ'."
                    : "Configurez Supabase pour la synchronisation :"}
                </p>
                <div className="space-y-2">
                  <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer" className={`flex items-center justify-between p-2 bg-white rounded-lg border ${configStatus.isWrongProvider ? 'border-rose-200 text-rose-900' : 'border-amber-200 text-amber-900'} hover:bg-slate-50 transition text-[9px] font-bold`}>
                    1. Ouvrir Supabase <ExternalLink size={10}/>
                  </a>
                </div>
              </div>
            )}

            <div className={`mb-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 ${!isSidebarOpen && 'lg:hidden group-hover:flex'}`}>
               <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                 {user?.name ? user.name[0] : '?'}
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-800 truncate w-32">{user?.name}</span>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">{user?.role}</span>
               </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all font-bold text-sm">
              <LogOut size={20} />
              <span className={`${!isSidebarOpen && 'lg:hidden group-hover:block'}`}>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print lg:hidden">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-500">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <AppLogo size={32} showText={true} />
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            {isCloud ? <Cloud size={16} className="text-emerald-500"/> : <CloudOff size={16} className="text-amber-500"/>}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientManager />} />
            <Route path="/dmp/:patientId" element={<PatientDMP />} />
            <Route path="/import-patients" element={<ImportPatients />} />
            <Route path="/consultations" element={<ConsultationManager />} />
            <Route path="/agenda" element={<AppointmentManager />} />
            <Route path="/prescriptions" element={<PrescriptionManager />} />
            <Route path="/billing" element={<BillingManager />} />
            <Route path="/finance" element={<FinanceManager />} />
            <Route path="/users" element={<AccountManager />} />
            <Route path="/maintenance" element={<MaintenanceManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/20 z-40 lg:hidden" />}
    </div>
  );
};

export default App;