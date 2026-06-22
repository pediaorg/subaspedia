import { env } from "cloudflare:workers";

import type { AuctionCategory } from "@subaspedia/types";
import { PRODUCT_CATEGORIES } from "@subaspedia/types";
import { VERIFICATION_CODE_LENGTH } from "@subaspedia/types/forms/auth";

declare global {
  namespace Cloudflare {
    interface Env {
      RESEND_API_KEY?: string;
      RESEND_FROM?: string;
      WEB_ORIGIN?: string;
    }
  }
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Subaspedia <onboarding@resend.dev>";
const DEFAULT_WEB_ORIGIN = "https://subaspedia.casareski.com";

/**
 * Botón que apunta al universal link `/logout` de la app: limpia la sesión y
 * manda al login para forzar un token nuevo (la categoría y la habilitación de
 * pujas viajan horneadas en el access token).
 */
function logoutButton(label: string): string {
  const origin = env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;
  return `
    <p style="margin: 24px 0;">
      <a href="${origin}/logout" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">${label}</a>
    </p>
  `;
}

/** Genera un código numérico de VERIFICATION_CODE_LENGTH dígitos. */
export function generateVerificationCode(): string {
  const max = 10 ** VERIFICATION_CODE_LENGTH;
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % max;
  return n.toString().padStart(VERIFICATION_CODE_LENGTH, "0");
}

/** Envuelve el contenido en el layout base de los mails de Subaspedia. */
function layout(inner: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      ${inner}
    </div>
  `;
}

/**
 * Envía un email vía Resend. Lee la config del env del Worker
 * (cloudflare:workers), sin necesidad de pasarla por el context.
 *
 * Si no hay API key configurada (típico en desarrollo local) hace un fallback a
 * console.log para que los circuitos sigan siendo testeables sin Resend.
 */
async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.log(`[email:dev] "${args.subject}" → ${args.to}`);
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
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend falló (${res.status}): ${detail}`);
  }
}

/** Envía el código de verificación por email. */
export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Tu código de verificación de Subaspedia",
    html: layout(`
      <h1 style="font-size: 20px;">Verificá tu cuenta</h1>
      <p>Usá este código para completar tu registro en Subaspedia:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p style="color: #666; font-size: 13px;">El código vence en 15 minutos. Si no fuiste vos, ignorá este mensaje.</p>
    `),
  });
}

function categoryLabel(category: AuctionCategory): string {
  return PRODUCT_CATEGORIES.find(c => c.value === category)?.label ?? category;
}

/**
 * Botón que apunta al universal link del detalle de una compra. Lleva al ganador
 * directo a la transacción, donde ve la factura y elige envío / retiro. Si la
 * sesión venció, la app cae al login (limitación conocida del guard/refresh).
 */
function transactionButton(recordId: number, label: string): string {
  const origin = env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;
  const url = `${origin}/profile/transactions/${recordId}`;
  return `
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">${label}</a>
    </p>
  `;
}

/** Botón que apunta al link de set-password (un solo uso) con el token. */
function setPasswordButton(token: string, label: string): string {
  const origin = env.WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;
  const url = `${origin}/register/set-password?token=${encodeURIComponent(token)}`;
  return `
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">${label}</a>
    </p>
  `;
}

/**
 * Avisa al postor que la empresa terminó la investigación y le asignó una
 * categoría. Incluye el link para que fije su contraseña y habilite el login.
 */
export async function sendCategoryAssignedEmail(
  to: string,
  category: AuctionCategory,
  setPasswordToken: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Tu cuenta de Subaspedia fue aprobada",
    html: layout(`
      <h1 style="font-size: 20px;">¡Bienvenido a Subaspedia!</h1>
      <p>Terminamos de revisar tus datos y te asignamos la categoría <strong>${categoryLabel(category)}</strong>.</p>
      <p>Para activar tu cuenta, creá tu clave personal desde el siguiente botón. El link vence en 72 horas.</p>
      ${setPasswordButton(setPasswordToken, "Crear mi contraseña")}
      <p style="color: #666; font-size: 13px;">Para poder pujar, recordá registrar al menos un medio de pago y esperar a que lo validemos.</p>
    `),
  });
}

/** Avisa al cliente que la empresa validó uno de sus medios de pago. */
export async function sendPaymentMethodVerifiedEmail(
  to: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Tu medio de pago fue validado",
    html: layout(`
      <h1 style="font-size: 20px;">Medio de pago validado</h1>
      <p>Verificamos uno de tus medios de pago en Subaspedia.</p>
      <p>Para habilitar las pujas, cerrá sesión y volvé a entrar así actualizamos tu cuenta.</p>
      ${logoutButton("Actualizar mi sesión")}
      <p style="color: #666; font-size: 13px;">Después de volver a iniciar sesión vas a poder pujar en las subastas de tu categoría. ¡Mucha suerte!</p>
    `),
  });
}

/**
 * Avisa al ganador de una subasta sobre el importe a pagar y lo lleva al detalle
 * de su compra. `commission` y `shippingCost` llegan ya como MONTOS (la comisión
 * resuelta sobre la puja y el envío por defecto), para que el total del mail
 * coincida con la factura de la transacción.
 */
export async function sendAuctionWinEmail(args: {
  to: string;
  winnerName: string;
  productName: string;
  bidAmount: number;
  commission: number;
  shippingCost: number;
  currency: "ARS" | "USD";
  recordId: number;
}): Promise<void> {
  const total = args.bidAmount + args.commission + args.shippingCost;
  const currencySymbol = args.currency === "ARS" ? "$" : "USD ";

  await sendEmail({
    to: args.to,
    subject: `¡Ganaste "${args.productName}" en Subaspedia!`,
    html: layout(`
      <h1 style="font-size: 20px;">¡Felicidades ${args.winnerName}!</h1>
      <p>Ganaste la subasta de <strong>${args.productName}</strong>.</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 16px;">Detalle del pago:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Monto pujado</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>${currencySymbol}${args.bidAmount.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Comisión</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>${currencySymbol}${args.commission.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">Envío a tu domicilio</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>${currencySymbol}${args.shippingCost.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600;">Total a pagar</td>
            <td style="text-align: right; padding: 12px 0; font-weight: 600; font-size: 16px;">${currencySymbol}${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #666; font-size: 13px;">Entrá a la app para ver el detalle de tu compra y elegir cómo recibirla: envío a domicilio o retiro personal.</p>
      ${transactionButton(args.recordId, "Ver mi compra")}
    `),
  });
}
