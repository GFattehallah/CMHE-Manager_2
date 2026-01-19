
import { Patient, Appointment, AppointmentStatus, Invoice, PaymentType, Expense, User, Role, Permission } from './types.ts';

/**
 * LOGO DU CABINET
 * Utilisation de "./logo.png" pour forcer la résolution relative au répertoire actuel.
 */
export const LOGO_URL = "./logo.png";

// Auth Users
export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Dr. Hasnaa El Malki',
    email: 'admin@cmhe.ma',
    role: Role.ADMIN,
    avatar: 'HM',
    permissions: Object.values(Permission)
  },
  {
    id: 'u2',
    name: 'Secrétaire Principale',
    email: 'secretaire@cmhe.ma',
    role: Role.SECRETARY,
    avatar: 'SP',
    permissions: [Permission.DASHBOARD, Permission.PATIENTS, Permission.AGENDA, Permission.BILLING, Permission.BILLING_VIEW, Permission.IMPORT, Permission.STATS, Permission.DMP_VIEW]
  },
  {
    id: 'u3',
    name: 'Assistante Cabinet',
    email: 'assistante@cmhe.ma',
    role: Role.ASSISTANT,
    avatar: 'AC',
    permissions: [Permission.DASHBOARD, Permission.PATIENTS, Permission.AGENDA, Permission.BILLING, Permission.DMP_VIEW]
  }
];

// Seed Data
export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    firstName: 'Amine',
    lastName: 'Benjelloun',
    birthDate: '1985-04-12',
    phone: '0661123456',
    email: 'amine.ben@example.com',
    cin: 'A123456',
    insuranceType: 'CNSS',
    insuranceNumber: '123456789',
    address: '12, Av Hassan II, Casablanca',
    medicalHistory: ['Hypertension', 'Asthme'],
    allergies: ['Pénicilline'],
    createdAt: '2023-01-15T10:00:00Z',
    bloodType: 'O+',
    weight: '78',
    height: '180'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    durationMinutes: 30,
    reason: 'Suivi hypertension',
    status: AppointmentStatus.SCHEDULED
  }
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    patientId: 'p1',
    date: new Date().toISOString(),
    amount: 300,
    status: 'PAID',
    paymentMethod: PaymentType.CASH,
    items: [{ description: 'Consultation Généraliste', price: 300 }]
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    date: new Date().toISOString(),
    category: 'FIXED',
    amount: 4500,
    description: 'Loyer Cabinet',
    paymentMethod: PaymentType.VIREMENT
  }
];
