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
      try { await supabase!.from('users').upsert(user); } catch (e) { console.error("Sync error:", e); }
    }
  },
  deleteUser: async (id: string) => {
    const users = getFromStorage(KEYS.USERS, MOCK_USERS).filter(u => u.id !== id);
    saveToStorage(KEYS.USERS, users);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('users').delete().eq('id', id); } catch (e) { console.error(e); }
    }
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
    const patients = getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS);
    const index = patients.findIndex(p => p.id === patient.id);
    if (index >= 0) patients[index] = patient; else patients.push(patient);
    saveToStorage(KEYS.PATIENTS, patients);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('patients').upsert(patient); } catch (e) { console.error("Cloud Save Failed (Patient):", e); }
    }
  },
  deletePatient: async (id: string) => {
    const patients = getFromStorage(KEYS.PATIENTS, MOCK_PATIENTS).filter(p => p.id !== id);
    saveToStorage(KEYS.PATIENTS, patients);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('patients').delete().eq('id', id); } catch (e) { console.error(e); }
    }
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
    const appts = getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS);
    const index = appts.findIndex(a => a.id === apt.id);
    if (index >= 0) appts[index] = apt; else appts.push(apt);
    saveToStorage(KEYS.APPOINTMENTS, appts);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('appointments').upsert(apt); } catch (e) { console.error(e); }
    }
  },
  deleteAppointment: async (id: string) => {
    const appts = getFromStorage(KEYS.APPOINTMENTS, MOCK_APPOINTMENTS).filter(a => a.id !== id);
    saveToStorage(KEYS.APPOINTMENTS, appts);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('appointments').delete().eq('id', id); } catch (e) { console.error(e); }
    }
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
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES);
    const index = invoices.findIndex(i => i.id === inv.id);
    if (index >= 0) invoices[index] = inv; else invoices.push(inv);
    saveToStorage(KEYS.INVOICES, invoices);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').upsert(inv); } catch (e) { console.error(e); }
    }
  },
  deleteInvoice: async (id: string) => {
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES).filter(i => i.id !== id);
    saveToStorage(KEYS.INVOICES, invoices);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').delete().eq('id', id); } catch (e) { console.error(e); }
    }
  },
  deleteInvoicesBulk: async (ids: string[]) => {
    const invoices = getFromStorage(KEYS.INVOICES, MOCK_INVOICES).filter(i => !ids.includes(i.id));
    saveToStorage(KEYS.INVOICES, invoices);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('invoices').delete().in('id', ids); } catch (e) { console.error(e); }
    }
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
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []);
    const index = consultations.findIndex(c => c.id === cons.id);
    if (index >= 0) consultations[index] = cons; else consultations.push(cons);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('consultations').upsert(cons); } catch (e) { console.error(e); }
    }
  },
  deleteConsultation: async (id: string) => {
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []).filter(c => c.id !== id);
    saveToStorage(KEYS.CONSULTATIONS, consultations);
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase!.from('consultations').delete().eq('id', id);
        if (error) console.error("Cloud delete error:", error);
      } catch (e) { console.error(e); }
    }
  },
  deleteConsultationsBulk: async (ids: string[]) => {
    const consultations = getFromStorage(KEYS.CONSULTATIONS, []).filter(c => !ids.includes(c.id));
    saveToStorage(KEYS.CONSULTATIONS, consultations);
    if (isSupabaseConfigured()) {
      try { 
        const { error } = await supabase!.from('consultations').delete().in('id', ids);
        if (error) console.error("Cloud bulk delete error:", error);
      } catch (e) { console.error(e); }
    }
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
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES);
    const index = expenses.findIndex(e => e.id === exp.id);
    if (index >= 0) expenses[index] = exp; else expenses.push(exp);
    saveToStorage(KEYS.EXPENSES, expenses);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').upsert(exp); } catch (e) { console.error(e); }
    }
  },
  deleteExpense: async (id: string) => {
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES).filter(e => e.id !== id);
    saveToStorage(KEYS.EXPENSES, expenses);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').delete().eq('id', id); } catch (e) { console.error(e); }
    }
  },
  deleteExpensesBulk: async (ids: string[]) => {
    const expenses = getFromStorage(KEYS.EXPENSES, MOCK_EXPENSES).filter(e => !ids.includes(e.id));
    saveToStorage(KEYS.EXPENSES, expenses);
    if (isSupabaseConfigured()) {
      try { await supabase!.from('expenses').delete().in('id', ids); } catch (e) { console.error(e); }
    }
  }
};