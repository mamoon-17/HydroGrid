import { z } from 'zod';
import { PlantType } from '../plants.entity';

export const CreatePlantSchema = z.object({
  address: z.string().min(1),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  tehsil: z.string().min(1),
  type: z.enum(PlantType),
  capacity: z.coerce.number().int().positive(),
  userId: z.uuid().optional(),
});

export type CreatePlantDto = z.infer<typeof CreatePlantSchema>;

export const UpdatePlantSchema = CreatePlantSchema.partial();

export type UpdatePlantDto = z.infer<typeof UpdatePlantSchema>;
