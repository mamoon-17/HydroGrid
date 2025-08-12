// src/reports/dtos/report.dto.ts
import { z } from 'zod';
import { BackwashStatus } from '../reports.entity';

export const baseReportFields = {
  raw_water_tds: z.coerce.number().nonnegative(),
  permeate_water_tds: z.coerce.number().nonnegative(),
  raw_water_ph: z.coerce.number().nonnegative(),
  permeate_water_ph: z.coerce.number().nonnegative(),
  product_water_tds: z.coerce.number().nonnegative(),
  product_water_flow: z.coerce.number().nonnegative(),
  product_water_ph: z.coerce.number().nonnegative(),
  reject_water_flow: z.coerce.number().nonnegative(),
  membrane_inlet_pressure: z.coerce.number().nonnegative(),
  membrane_outlet_pressure: z.coerce.number().nonnegative(),
  raw_water_inlet_pressure: z.coerce.number().nonnegative(),
  volts_amperes: z.coerce.number().nonnegative(),
  multimedia_backwash: z.enum(BackwashStatus),
  carbon_backwash: z.enum(BackwashStatus),
  membrane_cleaning: z.enum(BackwashStatus),
  arsenic_media_backwash: z.enum(BackwashStatus),
  cip: z.coerce.boolean(),
  chemical_refill_litres: z.coerce.number().nonnegative(),
  cartridge_filter_replacement: z.coerce.number().nonnegative(),
  membrane_replacement: z.coerce.number().nonnegative(),
};

export const CreateReportSchema = z.object({
  plantId: z.uuid(),
  userId: z.uuid(),
  ...baseReportFields,
});

export const UpdateReportSchema = z.object(baseReportFields).partial();

export type CreateReportDto = z.infer<typeof CreateReportSchema>;
export type UpdateReportDto = z.infer<typeof UpdateReportSchema>;
