import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema de validação Zod
const createUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.email('Email inválido'),
  age: z.number().int().positive().optional(),
});

// DTO gerado automaticamente a partir do schema Zod
export class CreateUserDto extends createZodDto(createUserSchema) {}
