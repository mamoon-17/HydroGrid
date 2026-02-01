import { z } from 'zod';

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
});

export type CreateTeamDto = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  logo_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateTeamDto = z.infer<typeof UpdateTeamSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;

export const AcceptInvitationSchema = z.object({
  inviteCode: z.string().min(1),
});

export type AcceptInvitationDto = z.infer<typeof AcceptInvitationSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export type UpdateMemberRoleDto = z.infer<typeof UpdateMemberRoleSchema>;
