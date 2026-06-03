import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  bigserial,
  integer,
  numeric,
  boolean,
  date,
  bigint,
} from 'drizzle-orm/pg-core';

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().default(''),
  industry: text('industry').default(''),
  region: text('region').default('IN'),
  ownerEmail: text('owner_email'),
  ownerPhone: text('owner_phone'),
  gmailRefreshToken: text('gmail_refresh_token'),
  onboardingComplete: boolean('onboarding_complete').notNull().default(false),
  disclosureLevel: text('disclosure_level').notNull().default('PROACTIVE'),
  maxFollowUpDays: integer('max_follow_up_days').notNull().default(45),
  autoEscalationAfterDays: integer('auto_escalation_after_days').notNull().default(7),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  name: text('name').default(''),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const voiceProfiles = pgTable('voice_profiles', {
  businessId: uuid('business_id').primaryKey().references(() => businesses.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull().default({}),
  processed: jsonb('processed'),
  dimensions: jsonb('dimensions'),
  calibrationRounds: jsonb('calibration_rounds').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const constitutions = pgTable('constitutions', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  content: jsonb('content').notNull(),
  confidenceScore: numeric('confidence_score'),
  confidenceFlag: text('confidence_flag'),
  lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable('clients', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  notes: text('notes'),
  segment: text('segment').notNull().default('D'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: bigint('client_id', { mode: 'bigint' }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  dueDate: date('due_date').notNull(),
  status: text('status').notNull().default('pending'),
  description: text('description'),
  segmentOverride: text('segment_override'),
  ownerOverride: text('owner_override'),
  humanEscalationRequired: boolean('human_escalation_required').notNull().default(false),
  nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
  preDueReminderSent: boolean('pre_due_reminder_sent').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const followUps = pgTable('follow_ups', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  invoiceId: bigint('invoice_id', { mode: 'bigint' }).notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  messageText: text('message_text').notNull(),
  messageType: text('message_type').notNull().default('generated'),
  messagePosition: integer('message_position').notNull().default(0),
  status: text('status').notNull().default('draft'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

import { customType } from 'drizzle-orm/pg-core';

export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const voiceVault = pgTable('voice_vault', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  contextTags: jsonb('context_tags').default([]),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

