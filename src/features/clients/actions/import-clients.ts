'use server';

import Papa from 'papaparse';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeSegment } from '@/lib/segments';

async function getBusinessId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', userId)
    .single();
  return data?.business_id as string | null;
}

type ParsedRow = Record<string, string>;

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const result = Papa.parse<ParsedRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => v.trim(),
  });

  const rows = (result.data || []).filter((r) =>
    Object.values(r).some((v) => v && String(v).trim().length > 0)
  );

  const errors: string[] = [];
  for (const err of result.errors) {
    errors.push(`Row ${err.row !== undefined ? err.row + 2 : '?'}: ${err.message}`);
  }
  return { rows, errors };
}

function normalizeEmail(value: string | null | undefined): { normalized: string | null; valid: boolean } {
  if (!value) return { normalized: null, valid: true };
  const trimmed = value.trim();
  if (!trimmed) return { normalized: null, valid: true };
  const lower = trimmed.toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower);
  return { normalized: valid ? lower : null, valid };
}

export async function importClients(csvText: string) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return { error: 'Not authenticated' };

  const businessId = await getBusinessId(supabase, authData.user.id);
  if (!businessId) return { error: 'Business not found' };

  const { rows, errors: parseErrors } = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      error: parseErrors.length > 0
        ? `No valid rows. ${parseErrors.slice(0, 3).join(' ')}`
        : 'No valid rows found in CSV',
    };
  }

  let imported = 0;
  let invoicesCreated = 0;
  const rowErrors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const name = r.name || r['client name'] || r['full name'] || '';
    if (!name) {
      rowErrors.push(`Row ${rowNum}: missing name — skipped`);
      continue;
    }

    const segment = normalizeSegment((r.segment || r['client segment'] || '').toUpperCase());

    const { normalized: email, valid: emailValid } = normalizeEmail(r.email || r['email address'] || null);
    if (email && !emailValid) {
      rowErrors.push(`Row ${rowNum} (${name}): invalid email "${email}" — imported without email`);
    }

    const amountStr = r.amount || r['invoice amount'] || '';
    const amountNum = amountStr ? parseFloat(amountStr) : NaN;
    if (amountStr && (Number.isNaN(amountNum) || amountNum < 0)) {
      rowErrors.push(`Row ${rowNum} (${name}): invalid amount "${amountStr}" — invoice skipped`);
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        business_id: businessId,
        name,
        email,
        phone: r.phone || r['phone number'] || r.mobile || null,
        company: r.company || r['company name'] || r.organization || null,
        notes: r.notes || r.note || null,
        segment,
      })
      .select('id')
      .single();

    if (clientError) {
      rowErrors.push(`Row ${rowNum} (${name}): ${clientError.message}`);
      continue;
    }
    imported++;

    const invNum = r.invoice_number || r['invoice no'] || r['inv no'] || '';
    if (invNum && !Number.isNaN(amountNum) && amountNum >= 0) {
      const dueDateRaw = r.due_date || r['due date'] || '';
      let dueDate = new Date().toISOString().split('T')[0];
      if (dueDateRaw) {
        const parsed = new Date(dueDateRaw);
        if (!Number.isNaN(parsed.getTime())) {
          dueDate = parsed.toISOString().split('T')[0];
        } else {
          rowErrors.push(`Row ${rowNum} (${name}): invalid due_date "${dueDateRaw}" — used today`);
        }
      }

      const { error: invError } = await supabase.from('invoices').insert({
        business_id: businessId,
        client_id: client.id,
        invoice_number: invNum,
        amount: amountNum,
        due_date: dueDate,
        description: r.description || r['invoice description'] || null,
        status: 'pending',
      });
      if (invError) {
        rowErrors.push(`Row ${rowNum} (${name}) invoice: ${invError.message}`);
      } else {
        invoicesCreated++;
      }
    }
  }

  if (imported === 0) {
    return { error: `No valid rows could be imported. ${rowErrors.slice(0, 3).join(' ')}` };
  }

  return {
    success: true,
    count: imported,
    invoicesCreated,
    rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
  };
}
