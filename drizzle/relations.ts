import { relations } from 'drizzle-orm';
import {
  businesses, users, voiceProfiles, constitutions,
  clients, invoices, followUps,
} from './schema';

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  voiceProfile: many(voiceProfiles),
  constitutions: many(constitutions),
  clients: many(clients),
  invoices: many(invoices),
  followUps: many(followUps),
}));

export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

export const voiceProfilesRelations = relations(voiceProfiles, ({ one }) => ({
  business: one(businesses, {
    fields: [voiceProfiles.businessId],
    references: [businesses.id],
  }),
}));

export const constitutionsRelations = relations(constitutions, ({ one }) => ({
  business: one(businesses, {
    fields: [constitutions.businessId],
    references: [businesses.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  followUps: many(followUps),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  business: one(businesses, {
    fields: [followUps.businessId],
    references: [businesses.id],
  }),
  invoice: one(invoices, {
    fields: [followUps.invoiceId],
    references: [invoices.id],
  }),
}));
