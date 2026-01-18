import { Patient, Appointment, Invoice, Consultation, Expense, User } from '../types';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_INVOICES, MOCK_EXPENSES, MOCK_USERS } from '../constants';
import { supabase, isSupabaseConfigured } from './supabase';

const KEYS = {
  PATIENTS: 'cmhe_patients',
  APPOINTMENTS: 'cmhe_appointments',
  INVOICES: 'cmhe_invoices',
  CONSULTATIONS: 'cmhe_consultations',
  EXPENSES: 'cmhe_expenses',
  USERS: 'cmhe_users'
};

const getFromStorage = <T>(key: string, defaultData: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultData;
    return JSON.parse(stored);
  } catch (err) {
    return defaultData;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Erreur de sauvegarde locale:", err);
  }
};

/**
 * Gère les erreurs retournées par le client Supabase (PostgrestError)
 * Garantit que l'erreur remontée est une chaîne de caractères détaillée et lisible.
 */
const handleSupabaseError = (error: any, context: string) => {
  console.group(`Détails techniques Supabase [${context}]`);
  try {
    console.dir(error); 
    console.log("JSON Error:", JSON.stringify(error, null, 2));
  } catch (e) {
    console.error("Impossible de sérialiser l'erreur:", error);
  }
  console.groupEnd();

  if (!error) throw new Error(`${context}: Une erreur inconnue est survenue.`);

  const code = error.code || error.status || 'N/A';
  const message = error.message || (typeof error === 'string' ? error : 'Erreur technique sans message');
  const details = error.details ? ` | Détails: ${error.details}` : '';
  const hint = error.hint ? ` | Aide: ${error.hint}` : '';

  let finalMessage = `[Supabase ${code}] ${message}${details}${hint}`;

  if (code === '42703' || code === 'PGRST204') {
    finalMessage = "STRUCTURE SQL ABSENTE : Une ou plusieurs colonnes (ex: bloodPressure, weight) manquent dans votre table 'patients'. Allez dans l'onglet 'Migration & Backup', copiez le script SQL et exécutez-le dans votre Dashboard Supabase.";
  }

  if (code === '42501') {
    finalMessage = "PERMISSION REFUSÉE : Vérifiez les politiques RLS de votre table dans Supabase. Assurez-vous que l'accès anonyme ou authentifié est autorisé.";
  }

  throw new Error(finalMessage);
};

export const DataService = {
  // --- UTILISATEURS ---
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('users').select('*');
        if (!error && data) {
          saveToStorage(KEYS.USERS, data);
          return data as User[];
        }
      } catch (e) { console.error(e); }
    }
    return getFromStorage(KEYS.USERS, MOCK_USERS);
  },
  saveUser: async (user: User) => {
    const users = getFromStorage(KEYS.USERS, MOCK_USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = user; else users.push(user);
    saveToStorage(KEYS.USERS, users);
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('users').upsert(user); 
      if (error) handleSupabaseError(error, "saveUser");
    }
  },
  deleteUser: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('users').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deleteUser");
    }
    const users = getFromStorage(KEYS.USERS, MOCK_USERS).filter(u => u.id !== id);
    saveToStorage(KEYS.USERS, users);
  },

  // --- PATIENTS ---
  getPatients: async (): Promise<Patient[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('patients').select('*').order('lastName', { ascending: true });
        if (!error && data) {
          saveToStorage(KEYS.PATIENTS, data);
          return data as Patient[];
        }
      } catch (e) { console.error("Cloud Get Error (Patients):", e); }
    }
    return getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS);
  },
  savePatient: async (patient: Patient) => {
    // 1. Sauvegarde locale (toujours prioritaire pour éviter les pertes)
    const patients = getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS);
    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) patients[index] = patient; else patients.push(patient);
    saveToStorage(KEYS.PATIENTS, patients);

    // 2. Synchronisation Cloud
    if (isSupabaseConfigured()) {
      const cleanPatient = Object.fromEntries(
        Object.entries(patient).filter(([_, v]) => v !== undefined)
      );

      const { error } = await supabase!.from('patients').upsert(cleanPatient);
      
      if (error) {
        // Tentative de sauvegarde de secours (Core Fallback)
        // Si l'erreur est "Column not found" (PGRST204 ou 42703)
        if (error.code === '42703' || error.code === 'PGRST204') {
          console.warn("Schema mismatch detected. Attempting core save fallback...");
          const coreFields = ['id', 'firstName', 'lastName', 'birthDate', 'phone', 'email', 'cin', 'insuranceType', 'insuranceNumber', 'address', 'medicalHistory', 'allergies', 'createdAt'];
          const corePatient = Object.fromEntries(
            Object.entries(cleanPatient).filter(([k]) => coreFields.includes(k))
          );
          
          const { error: retryError } = await supabase!.from('patients').upsert(corePatient);
          if (retryError) handleSupabaseError(retryError, "savePatient (Fallback failed)");
          
          // On lève quand même l'erreur initiale pour avertir l'utilisateur de mettre à jour son schéma
          handleSupabaseError(error, "savePatient (Auto-Fallback executed but warning still raised)");
        } else {
          handleSupabaseError(error, "savePatient");
        }
      }
    }
  },
  deletePatient: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('patients').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deletePatient");
    }
    const patients = getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS).filter(p => p.id !== id);
    saveToStorage(KEYS.PATIENTS, patients);
  },

  // --- RENDEZ-VOUS ---
  getAppointments: async (): Promise<Appointment[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('appointments').select('*');
        if (!error && data) {
          saveToStorage(KEYS.APPOINTMENTS, data);
          return data as Appointment[];
        }
      } catch (e) { console.error(e); }
    }
    return getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS);
  },
  saveAppointment: async (apt: Appointment) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('appointments').upsert(apt);
      if (error) handleSupabaseError(error, "saveAppointment");
    }
    const appts = getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS);
    const index = appts.findIndex(a => a.id === apt.id);
    if (index >= 0) appts[index] = apt; else appts.push(apt);
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },
  deleteAppointment: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('appointments').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deleteAppointment");
    }
    const appts = getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS).filter(a => a.id !== id);
    saveToStorage(KEYS.APPOINTMENTS, appts);
  },

  // --- FACTURES ---
  getInvoices: async (): Promise<Invoice[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('invoices').select('*').order('date', { ascending: false });
        if (!error && data) {
          saveToStorage(KEYS.INVOICES, data);
          return data as Invoice[];
        }
      } catch (e) { console.error(e); }
    }
    return getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
  },
  saveInvoice: async (inv: Invoice) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('invoices').upsert(inv);
      if (error) handleSupabaseError(error, "saveInvoice");
    }
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
    const index = invoices.findIndex(i => i.id === inv.id);
    if (index >= 0) invoices[index] = inv; else invoices.push(inv);
    saveToStorage(KEYS.INVOICES, invoices);
  },
  deleteInvoice: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('invoices').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deleteInvoice");
    }
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES).filter(i => i.id !== id);
    saveToStorage(KEYS.INVOICES, invoices);
  },
  deleteInvoicesBulk: async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('invoices').delete().in('id', ids);
      if (error) handleSupabaseError(error, "deleteInvoicesBulk");
    }
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES).filter(i => !ids.includes(i.id));
    saveToStorage(KEYS.INVOICES, invoices);
  },

  // --- CONSULTATIONS ---
  getConsultations: async (): Promise<Consultation[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('consultations').select('*').order('date', { ascending: false });
        if (!error && data) {
          saveToStorage(KEYS.CONSULTATIONS, data);
          return data as Consultation[];
        }
      } catch (e) { console.error(e); }
    }
    return getFromStorage(KEYS.CONSULTATIONS, []);
  },
  saveConsultation: async (cons: Consultation) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('consultations').upsert(cons);
      if (error) handleSupabaseError(error, "saveConsultation");
    }
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []);
    const index = consultations.findIndex(c => c.id === cons.id);
    if (index >= 0) consultations[index] = cons; else consultations.push(cons);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
  },
  deleteConsultation: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('consultations').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deleteConsultation");
    }
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []).filter(c => c.id !== id);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
  },
  deleteConsultationsBulk: async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('consultations').delete().in('id', ids);
      if (error) handleSupabaseError(error, "deleteConsultationsBulk");
    }
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []).filter(c => !ids.includes(c.id));
    saveToStorage(KEYS.CONSULTATIONS, consultations);
  },

  // --- DEPENSES ---
  getExpenses: async (): Promise<Expense[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase!.from('expenses').select('*').order('date', { ascending: false });
        if (!error && data) {
          saveToStorage(KEYS.EXPENSES, data);
          return data as Expense[];
        }
      } catch (e) { console.error(e); }
    }
    return getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
  },
  saveExpense: async (exp: Expense) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('expenses').upsert(exp);
      if (error) handleSupabaseError(error, "saveExpense");
    }
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
    const index = expenses.findIndex(e => e.id === exp.id);
    if (index >= 0) expenses[index] = exp; else expenses.push(exp);
    saveToStorage(KEYS.EXPENSES, expenses);
  },
  deleteExpense: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('expenses').delete().eq('id', id);
      if (error) handleSupabaseError(error, "deleteExpense");
    }
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES).filter(e => e.id !== id);
    saveToStorage(KEYS.EXPENSES, expenses);
  },
  deleteExpensesBulk: async (ids: string[]) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase!.from('expenses').delete().in('id', ids);
      if (error) handleSupabaseError(error, "deleteExpensesBulk");
    }
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES).filter(e => !ids.includes(e.id));
    saveToStorage(KEYS.EXPENSES, expenses);
  }
};