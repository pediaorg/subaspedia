import { z } from "zod";

// Longitud del código de verificación enviado por email.
export const VERIFICATION_CODE_LENGTH = 6;

const email = z.email("Email inválido").toLowerCase();
const password = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres");

// --- Login ---
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresá tu contraseña"),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// --- Registro etapa 1: datos del postor ---
// El postor carga sus datos; la empresa los investiga de forma asíncrona y le
// asigna una categoría más adelante. Acá solo se dispara el envío del código.
export const registerStep1Schema = z.object({
  name: z.string().trim().min(1, "Ingresá tu nombre"),
  lastName: z.string().trim().min(1, "Ingresá tu apellido"),
  legalAddress: z.string().trim().min(1, "Ingresá tu domicilio legal"),
  country: z.string().trim().min(1, "Seleccioná tu país"),
  email,
  // Número de documento. Validación laxa por ser multi-país: solo dígitos.
  document: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Documento inválido"),
  // Fotos del documento (frente y dorso). En el cliente se cargan como URIs;
  // acá solo validamos su presencia.
  dniFront: z.string().min(1, "Subí el frente del documento"),
  dniBack: z.string().min(1, "Subí el dorso del documento"),
});

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

// --- Registro etapa 2a: verificación del código ---
export const verifyCodeSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .length(VERIFICATION_CODE_LENGTH, "Código inválido")
    .regex(/^\d+$/, "Código inválido"),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

// --- Set-password: el postor aprobado fija su clave vía token del mail ---
export const setPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requerido"),
    password,
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

// Schema solo del formulario de contraseña (sin email/code, que viajan por la
// navegación) para usar con react-hook-form en la pantalla.
export const newPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
