// src/reports/dtos/report.dto.ts
import { z } from 'zod';
import { BackwashStatus } from '../reports.entity';

export const baseReportFields = {
  raw_water_tds: z.number().int().nonnegative(),
  permeate_water_tds: z.number().int().nonnegative(),
  raw_water_ph: z.number().int().nonnegative(),
  permeate_water_ph: z.number().int().nonnegative(),
  product_water_tds: z.number().int().nonnegative(),
  product_water_flow: z.number().int().nonnegative(),
  product_water_ph: z.number().int().nonnegative(),
  reject_water_flow: z.number().int().nonnegative(),
  membrane_inlet_pressure: z.number().int().nonnegative(),
  membrane_outlet_pressure: z.number().int().nonnegative(),
  raw_water_inlet_pressure: z.number().int().nonnegative(),
  volts_amperes: z.number().int().nonnegative(),
  multimedia_backwash: z.enum(BackwashStatus),
  carbon_backwash: z.enum(BackwashStatus),
  membrane_cleaning: z.enum(BackwashStatus),
  arsenic_media_backwash: z.enum(BackwashStatus),
  cip: z.boolean(),
  chemical_refill_litres: z.number().int().nonnegative(),
  cartridge_filter_replacement: z.number().int().min(0).max(2),
  membrane_replacement: z.number().int().min(0).max(8),
};

export const CreateReportSchema = z.object({
  plantId: z.uuid(),
  userId: z.uuid(),
  ...baseReportFields,
});

export const UpdateReportSchema = z.object(baseReportFields).partial();

export type CreateReportDto = z.infer<typeof CreateReportSchema>;
export type UpdateReportDto = z.infer<typeof UpdateReportSchema>;
