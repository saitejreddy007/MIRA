import type { SupabaseClient } from '@supabase/supabase-js';
import { generateJson } from '@/features/ai/openrouter-client';
import { determineNextAction, type TimingInputs } from '../utils/follow-up-timing';
import { FOLLOW_UP_SYSTEM, buildFollowUpPrompt } from '../prompts/generate-follow-up';
import { sendFollowUpEmail } from '@/features/channels/email/send';
import { complianceCheckWithRetry } from '@/features/voice/algorithm/quality-gate';
import type { VoiceConstitution } from '@/features/voice/types';
import { searchVoiceVault } from '@/features/voice-vault/rag';
import { logger } from '@/lib/logger';

export type ProcessInvoiceInput = {
  invoiceId: number;
  businessId: string;
  forcePosition?: number;
};

export type ProcessInvoiceResult =
  | { outcome: 'sent'; followUpId: number | null }
  | { outcome: 'skipped_wait'; reason: string; nextFollowUpAt: string | null }
  | { outcome: 'skipped_stop'; reason: string }
  | { outcome: 'escalated'; reason: string }
  | { outcome: 'error'; error: string };

const INVOICE_SELECT =
  'id, business_id, client_id, invoice_number, amount, currency, due_date, status, segment_override, owner_override, human_escalation_required, pre_due_reminder_sent, clients!inner(segment, name, email)';

type InvoiceClient = { segment: string; name: string; email: string };
type InvoiceRow = {
  id: number;
  business_id: string;
  client_id: number;
  invoice_number: string;
  amount: string;
  currency: string;
  due_date: string;
  status: string;
  segment_override: string | null;
  owner_override: string | null;
  human_escalation_required: boolean;
  pre_due_reminder_sent: boolean;
  clients: InvoiceClient[] | InvoiceClient;
};

function getClient(row: InvoiceRow): InvoiceClient {
  return Array.isArray(row.clients) ? row.clients[0] : row.clients;
}

export async function processInvoice(
  supabase: SupabaseClient,
  input: ProcessInvoiceInput
): Promise<ProcessInvoiceResult> {
  const { invoiceId, businessId, forcePosition } = input;

  try {
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .select('id, name, max_follow_up_days, auto_escalation_after_days, disclosure_level, phone, gmail_refresh_token')
      .eq('id', businessId)
      .single();

    if (bizErr || !business) {
      return { outcome: 'error', error: `business lookup failed: ${bizErr?.message ?? 'not found'}` };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('business_id', businessId)
      .limit(1)
      .single();

    const { data: constitution, error: constErr } = await supabase
      .from('constitutions')
      .select('content')
      .eq('business_id', businessId)
      .order('locked_at', { ascending: false })
      .limit(1)
      .single();

    if (constErr || !constitution) {
      return { outcome: 'skipped_wait', reason: 'no voice constitution — complete onboarding first', nextFollowUpAt: null };
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .single();

    if (invErr || !invoice) {
      return { outcome: 'error', error: `invoice lookup failed: ${invErr?.message ?? 'not found'}` };
    }

    const inv = invoice as unknown as InvoiceRow;
    const client = getClient(inv);

    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return { outcome: 'skipped_stop', reason: `invoice status is ${invoice.status}` };
    }

    const { data: followUps, error: fuErr } = await supabase
      .from('follow_ups')
      .select('id, message_text, sent_at, opened_at')
      .eq('invoice_id', invoiceId)
      .eq('business_id', businessId)
      .eq('status', 'sent')  // ignore failed attempts — they don't count toward sequence
      .order('created_at', { ascending: false });

    if (fuErr) {
      return { outcome: 'error', error: `follow_ups lookup failed: ${fuErr.message}` };
    }

    const messagesSent = followUps?.length ?? 0;
    const lastMessage = followUps?.[0] ?? null;
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    const effectiveSegment = inv.segment_override || client?.segment || 'D';

    const maxMessages =
      typeof business.max_follow_up_days === 'number' && business.max_follow_up_days > 0
        ? Math.min(business.max_follow_up_days, 10)
        : 3;
    const escalationAfterDays =
      typeof business.auto_escalation_after_days === 'number' && business.auto_escalation_after_days > 0
        ? business.auto_escalation_after_days
        : 7;

    const timingInputs: TimingInputs = {
      invoice_due_date: invoice.due_date,
      days_overdue: daysOverdue,
      messages_sent: messagesSent,
      last_message_sent_date: lastMessage?.sent_at ?? null,
      last_message_opened: !!lastMessage?.opened_at,
      last_message_open_date: lastMessage?.opened_at ?? null,
      payment_received: invoice.status === 'paid',
      reply_received: false,
      reply_date: null,
      client_segment: effectiveSegment as TimingInputs['client_segment'],
      detected_state: null,
      owner_override: invoice.owner_override ?? null,
      human_escalation_required: invoice.human_escalation_required ?? false,
      max_messages: maxMessages,
      escalation_after_days: escalationAfterDays,
    };

    const action = determineNextAction(timingInputs);

    const position = forcePosition ?? action.message_position;
    const effectiveAction: typeof action = forcePosition !== undefined
      ? { ...action, type: 'send', scheduled_date: 'immediately', scheduled_time: action.scheduled_time, message_position: position as 0 | 1 | 2 | 3 | null }
      : action;

    if (effectiveAction.type === 'escalate') {
      await supabase.from('invoices').update({ human_escalation_required: true }).eq('id', invoiceId);
      return { outcome: 'escalated', reason: action.reason };
    }

    if (effectiveAction.type === 'stop') {
      return { outcome: 'skipped_stop', reason: action.reason };
    }

    if (effectiveAction.type === 'wait' || position === null) {
      await supabase
        .from('invoices')
        .update({
          next_follow_up_at: action.scheduled_date
            ? new Date(`${action.scheduled_date}T${action.scheduled_time || '09:00'}:00`).toISOString()
            : null,
        })
        .eq('id', invoiceId);
      return { outcome: 'skipped_wait', reason: action.reason, nextFollowUpAt: null };
    }

    if (effectiveAction.type !== 'send') {
      return { outcome: 'skipped_wait', reason: action.reason, nextFollowUpAt: null };
    }

    const today = new Date().toISOString().split('T')[0];
    const shouldSendNow =
      effectiveAction.scheduled_date === 'immediately' ||
      (typeof effectiveAction.scheduled_date === 'string' && effectiveAction.scheduled_date <= today);

    if (!shouldSendNow) {
      await supabase
        .from('invoices')
        .update({
          next_follow_up_at: effectiveAction.scheduled_date
            ? new Date(`${effectiveAction.scheduled_date}T${effectiveAction.scheduled_time || '09:00'}:00`).toISOString()
            : null,
        })
        .eq('id', invoiceId);
      return { outcome: 'skipped_wait', reason: `scheduled for ${effectiveAction.scheduled_date}`, nextFollowUpAt: null };
    }


    const intentQuery = position === 0 ? 'Friendly pre-due reminder' 
                      : position === 1 ? 'Firm overdue reminder' 
                      : position === 2 ? 'Strong overdue warning' 
                      : 'Final overdue notice';
                      
    const ragResults = await searchVoiceVault(businessId, intentQuery, 3);
    const ragExamples = ragResults.map((r: any) => r.content);

    const promptParams = {
      constitution: constitution.content as Record<string, unknown>,
      position: position,
      clientName: client?.name || 'Client',
      invoiceNumber: inv.invoice_number,
      amount: inv.amount,
      currency: inv.currency,
      dueDate: inv.due_date,
      daysOverdue: Math.max(0, daysOverdue),
      previousMessages: (followUps ?? []).map((f) => f.message_text).filter(Boolean),
      ragExamples,
      businessName: business.name || 'Business',
    };

    const prompt = buildFollowUpPrompt(promptParams);

    const generated = await generateJson<{ message_text: string; max_pressure_level?: number }>(prompt, FOLLOW_UP_SYSTEM);
    if (!generated?.message_text) {
      return { outcome: 'error', error: 'AI returned empty message' };
    }

    const constitutionTyped = constitution.content as unknown as VoiceConstitution;

    const messagePressure = typeof generated.max_pressure_level === 'number'
      ? generated.max_pressure_level
      : 3; // AI omitted pressure level — default to moderate (3)

    const constitutionMaxPressure = typeof constitutionTyped.tension_rules?.max_pressure_level === 'number'
      ? constitutionTyped.tension_rules.max_pressure_level
      : null; // Constitution missing pressure limit — skip comparison

    if (constitutionMaxPressure !== null && messagePressure > constitutionMaxPressure) {
      logger.warn({ invoiceId, messagePressure, constitutionMaxPressure }, 'message pressure exceeds constitution limit');
      return {
        outcome: 'error',
        error: `pressure level ${messagePressure} exceeds constitution max ${constitutionMaxPressure}`,
      };
    }

    let messageText = generated.message_text;
    try {
      const compliance = await complianceCheckWithRetry(
        messageText,
        constitutionTyped,
        async (_current, violations) => {
          const regenPrompt =
            buildFollowUpPrompt(promptParams) +
            `\n\nCRITICAL — Your previous message violated the owner's Voice Constitution. The specific violations were:\n${violations
              .map((v) => `- ${v}`)
              .join('\n')}\n\nRewrite the message so it passes ALL of the constitution's rules. Keep the same intent and natural flow, but fix every violation listed above.`;
          const regen = await generateJson<{ message_text: string }>(regenPrompt, FOLLOW_UP_SYSTEM);
          return regen?.message_text || '';
        }
      );
      messageText = compliance.final_message;

      if (!compliance.passed) {
        logger.warn({ invoiceId, businessId, attempts: compliance.attempts, violations: compliance.violations }, 'compliance failed after retries');
        await supabase.from('invoices').update({ human_escalation_required: true }).eq('id', invoiceId);
        return {
          outcome: 'error',
          error: `compliance failed after ${compliance.attempts} attempts: ${compliance.violations.join('; ')}`,
        };
      }
    } catch (complianceErr) {
      return {
        outcome: 'error',
        error: `compliance check error: ${complianceErr instanceof Error ? complianceErr.message : 'unknown'}`,
      };
    }

    let followUpId: number | null = null;
    let emailSent = false;
    let emailError: string | null = null;

    if (client?.email) {
      const emailResult = await sendFollowUpEmail({
        to: client.email,
        clientName: client.name,
        messageText,
        invoiceNumber: inv.invoice_number,
        position: position,
        businessName: business.name || 'Business',
        ownerEmail: userData?.email || '',
        ownerPhone: business.phone,
        gmailRefreshToken: business.gmail_refresh_token,
        disclosureLevel: business.disclosure_level ?? 'PROACTIVE',
        followUpId: null,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error ?? null;
    } else {
      emailError = 'client has no email address — no send attempted';
    }

    const { data: fuRow, error: fuInsertErr } = await supabase
      .from('follow_ups')
      .insert({
        business_id: businessId,
        invoice_id: invoiceId,
        message_text: messageText,
        message_type: 'generated',
        message_position: position,
        status: emailSent ? 'sent' : 'failed',
        sent_at: emailSent ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (fuInsertErr) {
      return { outcome: 'error', error: `follow_ups insert failed: ${fuInsertErr.message}` };
    }

    followUpId = fuRow?.id ?? null;

    if (!emailSent) {
      return { outcome: 'error', error: emailError ?? 'email send failed' };
    }

    if (position === 0) {
      await supabase.from('invoices').update({ pre_due_reminder_sent: true }).eq('id', invoiceId);
    }

    if (followUpId) {
      const { error: linkErr } = await supabase
        .from('follow_ups')
        .update({ message_text: messageText })
        .eq('id', followUpId);
      if (linkErr) {
        logger.warn({ followUpId, err: linkErr.message }, 'follow_ups update with tracking id failed (non-fatal)');
      }
    }

    await supabase.from('invoices').update({ next_follow_up_at: null }).eq('id', invoiceId);

    return { outcome: 'sent', followUpId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    logger.error({ invoiceId, businessId, err: msg }, 'processInvoice: unhandled error');
    return { outcome: 'error', error: msg };
  }
}
