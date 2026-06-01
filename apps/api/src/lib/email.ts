import { env } from "cloudflare:workers";

import { VERIFICATION_CODE_LENGTH } from "@subaspedia/types/forms/auth";

declare global {
  namespace Cloudflare {
    interface Env {
      RESEND_API_KEY?: string;
      RESEND_FROM?: string;
    }
  }
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Subaspedia <onboarding@resend.dev>";

/** Genera un código numérico de VERIFICATION_CODE_LENGTH dígitos. */
export function generateVerificationCode(): string {
  const max = 10 ** VERIFICATION_CODE_LENGTH;
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % max;
  return n.toString().padStart(VERIFICATION_CODE_LENGTH, "0");
}

/**
 * Envía el código de verificación por email vía Resend. Lee la config del env
 * del Worker (cloudflare:workers), sin necesidad de pasarla por el context.
 *
 * Si no hay API key configurada (típico en desarrollo local) hace un fallback a
 * console.log para que el circuito siga siendo testeable sin Resend.
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.log(`[email:dev] Código de verificación para ${to}: ${code}`);
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Tu código de verificación de Subaspedia",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="font-size: 20px;">Verificá tu cuenta</h1>
          <p>Usá este código para completar tu registro en Subaspedia:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
          <p style="color: #666; font-size: 13px;">El código vence en 15 minutos. Si no fuiste vos, ignorá este mensaje.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend falló (${res.status}): ${detail}`);
  }
}
