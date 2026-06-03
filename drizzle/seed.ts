import { businesses, users, clients, invoices } from './schema';

export const seedBusinesses = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Corp',
    industry: 'Software',
    region: 'IN',
    onboardingComplete: true,
  },
];

export const seedUsers = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'owner@acme.com',
    name: 'Ravi Sharma',
    businessId: '00000000-0000-0000-0000-000000000001',
    role: 'owner',
  },
];

export const seedClients = [
  {
    businessId: '00000000-0000-0000-0000-000000000001',
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '+919876543210',
    company: 'Patel Designs',
  },
];

export const seedInvoices = [
  {
    businessId: '00000000-0000-0000-0000-000000000001',
    clientId: BigInt(1),
    invoiceNumber: 'INV-001',
    amount: '25000.00',
    currency: 'INR',
    dueDate: '2026-05-15',
    status: 'overdue',
  },
];
