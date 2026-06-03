'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { addDaysISO } from '@/lib/dates';

const DEMO_FLAG = 'demo_data_loaded';

type DemoClient = {
  name: string;
  email: string;
  phone: string;
  company: string;
  segment: 'A' | 'B' | 'C' | 'D' | 'E';
};

const DEMO_CLIENTS: DemoClient[] = [
  { name: 'Priya Sharma',  email: 'priya@studio.com',  phone: '+919876543210', company: 'Studio Priya',   segment: 'A' },
  { name: 'Rohan Mehta',   email: 'rohan@mehta.io',    phone: '+919812345670', company: 'Mehta & Co',     segment: 'B' },
  { name: 'Anita Iyer',    email: 'anita@iyer.in',     phone: '+919800112233', company: 'Iyer Designs',   segment: 'B' },
  { name: 'Karthik Rao',   email: 'karthik@rao.dev',   phone: '+919887766554', company: 'Rao Web Studio', segment: 'C' },
  { name: 'Neha Kapoor',   email: 'neha@kapoor.co',    phone: '+919765432100', company: 'Kapoor Creations', segment: 'D' },
  { name: 'Vikram Singh',  email: 'vikram@singh.com',  phone: '+919899887766', company: 'Singh Trading',  segment: 'E' },
];

export async function loadDemoData(): Promise<{
  clients_created: number;
  invoices_created: number;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { clients_created: 0, invoices_created: 0, error: 'Not authenticated' };

  const { data: user } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', auth.user.id)
    .single();
  if (!user?.business_id) return { clients_created: 0, invoices_created: 0, error: 'Business not found' };

  const businessId = user.business_id;

  const { data: business } = await supabase
    .from('businesses')
    .select('onboarding_complete')
    .eq('id', businessId)
    .single();

  if (!business?.onboarding_complete) {
    return { clients_created: 0, invoices_created: 0, error: 'Complete voice setup first to load demo data' };
  }

  const { data: existing } = await supabase
    .from('clients')
    .select('id, email')
    .eq('business_id', businessId);
  const existingEmails = new Set((existing || []).map((c) => c.email?.toLowerCase()).filter(Boolean));

  let clientsCreated = 0;
  let invoicesCreated = 0;
  const today = new Date();

  for (const demo of DEMO_CLIENTS) {
    if (existingEmails.has(demo.email.toLowerCase())) continue;

    const { data: client, error: cErr } = await supabase
      .from('clients')
      .insert({
        business_id: businessId,
        name: demo.name,
        email: demo.email,
        phone: demo.phone,
        company: demo.company,
        segment: demo.segment,
      })
      .select('id')
      .single();

    if (cErr || !client) {
      logger.warn({ email: demo.email, err: cErr?.message }, 'demo data: client insert failed');
      continue;
    }
    clientsCreated++;

    const invoiceSpecs = [
      { number: `${demo.company.slice(0, 3).toUpperCase()}-001`, amount: 25000, due: -7,  desc: 'Logo design — Q1' },
      { number: `${demo.company.slice(0, 3).toUpperCase()}-002`, amount: 45000, due: 14,  desc: 'Website redesign — phase 1' },
      { number: `${demo.company.slice(0, 3).toUpperCase()}-003`, amount: 15000, due: 30,  desc: 'Branding retainer' },
    ];

    for (const inv of invoiceSpecs) {
      const { error: iErr } = await supabase.from('invoices').insert({
        business_id: businessId,
        client_id: client.id,
        invoice_number: inv.number,
        amount: inv.amount,
        due_date: addDaysISO(today, inv.due),
        description: inv.desc,
        status: 'pending',
      });
      if (!iErr) invoicesCreated++;
    }
  }

  logger.info({
    businessId,
    actorUserId: auth.user.id,
    clientsCreated,
    invoicesCreated,
    action: DEMO_FLAG,
  }, 'demo data loaded');

  return { clients_created: clientsCreated, invoices_created: invoicesCreated };
}
