import { z } from 'zod';
const id = z.number().int().positive().safe();
export const itemSchema = z.object({ id, name: z.string().min(2).max(80), description: z.string().max(240), priceCents: z.number().int().min(0).max(10000000), active: z.boolean() });
export const activitySchema = z.object({ id, itemId: id, itemName: z.string(), quantity: z.number().int().min(1).max(1000), totalCents: z.number().int().nonnegative().safe(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), cancelled: z.boolean() });
export const workspaceSchema = z.object({ demonstration: z.literal(true), catalog: z.array(itemSchema).max(100), activities: z.array(activitySchema).max(500) });
export const cutSchema = z.object({ from: z.string(), to: z.string(), count: z.number().int().nonnegative(), cancelledCount: z.number().int().nonnegative(), totalCents: z.number().int().nonnegative().safe(), activities: z.array(activitySchema).max(500) });
export type CatalogItem = z.infer<typeof itemSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Cut = z.infer<typeof cutSchema>;
export type NewItem = { name: string; description: string; priceCents: number };
export type NewActivity = { itemId: number; quantity: number; date: string };
export function amountToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimals = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return cents <= 10000000 ? cents : null;
}
export const money = (cents: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
export function today() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31') return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
