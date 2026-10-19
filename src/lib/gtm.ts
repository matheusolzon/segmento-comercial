/* Tracking utilitário (padrão OX Mídia, portado do projeto do Buffet Sonho Meu).
 * Sem IDs de GTM/Pixel na página tudo aqui é no-op seguro: liga depois sem mudar código. */

export const pushToDataLayer = (event: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  if (!w.dataLayer) w.dataLayer = [];
  w.dataLayer.push(event);
};

/** Dispara um evento padrão do Meta Pixel, se o pixel já estiver na página.
 *  `eventID` (opcional) deduplica o evento com o mesmo disparo via Conversions API. */
export const trackMeta = (
  event: string,
  params?: Record<string, unknown>,
  eventID?: string,
) => {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  if (eventID) fbq("track", event, params, { eventID });
  else fbq("track", event, params);
};

/** Gera um event_id único por conversão, pra deduplicar Pixel (browser) × CAPI (servidor). */
export const genEventId = (): string => {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    /* randomUUID indisponível — cai no fallback */
  }
  return `ox-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Lê os cookies do Pixel (_fbp/_fbc) para advanced matching server-side (CAPI). */
export const getFbCookies = (): { fbp?: string; fbc?: string } => {
  if (typeof document === "undefined") return {};
  const read = (name: string) => {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  const out: { fbp?: string; fbc?: string } = {};
  const fbp = read("_fbp");
  const fbc = read("_fbc");
  if (fbp) out.fbp = fbp;
  if (fbc) out.fbc = fbc;
  return out;
};

/** WhatsApp da Segmento (formato internacional, só dígitos).
 *  CONFIRMAR: (11) 3965-0409 é o fixo dos sites atuais (o link deles tem um "0" sobrando). Tem WhatsApp Business? */
export const WHATSAPP_NUMBER = "551139650409";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const UTM_STORAGE_KEY = "ox_utms";

/** Lê os utm_* (+ fbclid/gclid) da URL atual. */
const utmsFromUrl = (): Record<string, string> => {
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  UTM_KEYS.forEach((k) => {
    const v = p.get(k);
    if (v) out[k] = v;
  });
  const fbclid = p.get("fbclid");
  if (fbclid) out.fbclid = fbclid;
  const gclid = p.get("gclid");
  if (gclid) out.gclid = gclid;
  return out;
};

/** Captura os utm_* no primeiro load e guarda na sessão (sobrevivem à navegação). */
export const captureUtms = () => {
  if (typeof window === "undefined") return;
  const fromUrl = utmsFromUrl();
  if (Object.keys(fromUrl).length) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* sessionStorage indisponível — segue sem persistir */
    }
    pushToDataLayer({ event: "utm_capture", ...fromUrl });
  }
};

/** Recupera os utm_* (URL atual tem prioridade; cai pra sessão). */
export const getUtms = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const fromUrl = utmsFromUrl();
  if (Object.keys(fromUrl).length) return fromUrl;
  try {
    return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * Marcador de origem `[ox:canal|campanha|conjunto|criativo]` pra casar a origem no CRM.
 * Vazio quando não veio de anúncio (sem utm_campaign) — tráfego orgânico fica limpo.
 */
export const buildRefTag = (): string => {
  const u = getUtms();
  if (!u.utm_campaign) return "";
  const clean = (s: string | undefined) =>
    (s || "-").replace(/[\[\]|\r\n]/g, "").trim().slice(0, 60) || "-";
  return `[ox:${clean(u.utm_source)}|${clean(u.utm_campaign)}|${clean(u.utm_term)}|${clean(u.utm_content)}]`;
};

/** Anexa o marcador de origem a uma mensagem, se houver. */
export const appendRef = (message: string): string => {
  const tag = buildRefTag();
  return tag ? `${message}\n\n${tag}` : message;
};

export const buildWhatsappUrl = (message: string) =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(appendRef(message))}`;

/**
 * Injeta o marcador de origem nos links estáticos de WhatsApp (renderizados no build,
 * não enxergam a URL). Roda uma vez no load. Sem utm, não mexe em nada.
 */
export const initWhatsappTracking = () => {
  if (typeof window === "undefined") return;
  captureUtms();
  const tag = buildRefTag();
  if (!tag) return;
  const DEFAULT_TEXT = "Olá! Vim pelo site da Segmento Comercial.";
  document.querySelectorAll<HTMLAnchorElement>('a[href*="api.whatsapp.com/send"]').forEach((a) => {
    try {
      const url = new URL(a.href);
      const existing = url.searchParams.get("text") || "";
      if (existing.includes("[ox:")) return; // já etiquetado, não duplica
      url.searchParams.set("text", `${existing || DEFAULT_TEXT}\n\n${tag}`);
      a.href = url.toString();
    } catch {
      /* href não parseável — ignora */
    }
  });
};
