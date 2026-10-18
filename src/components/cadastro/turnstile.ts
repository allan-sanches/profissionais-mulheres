/*
 * Turnstile, o anti-spam da Cloudflare. Fica invisível e só aparece se a
 * Cloudflare desconfiar e pedir uma interação. O token vale uma vez e por 5
 * minutos, então cada tentativa de envio pede um novo.
 *
 * Sem TURNSTILE_SITE_KEY (no `astro dev`, por exemplo), tudo aqui vira no-op.
 */

import { TURNSTILE_SITE_KEY } from "astro:env/client";

interface Turnstile {
  render(el: HTMLElement, opcoes: Record<string, unknown>): string;
  execute(el: HTMLElement): void;
  reset(widget: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let carregando: Promise<Turnstile> | null = null;

function carregar(): Promise<Turnstile> {
  carregando ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("turnstile"));
    script.onerror = () => {
      carregando = null;
      reject(new Error("O script do Turnstile não carregou."));
    };
    document.head.appendChild(script);
  });
  return carregando;
}

/** Começa a baixar cedo, pra não atrasar o clique em Enviar. */
export function prepararTurnstile() {
  if (TURNSTILE_SITE_KEY) carregar().catch(() => {});
}

const widgets = new WeakMap<HTMLElement, string>();
let pendente: {
  resolve: (t: string) => void;
  reject: (e: Error) => void;
} | null = null;

export async function obterToken(
  caixa: HTMLElement,
): Promise<string | undefined> {
  if (!TURNSTILE_SITE_KEY) return undefined;
  const turnstile = await carregar();

  return new Promise<string>((resolve, reject) => {
    pendente = { resolve, reject };
    const falhou = () => {
      pendente?.reject(new Error("turnstile"));
      pendente = null;
    };
    let widget = widgets.get(caixa);
    if (widget === undefined) {
      widget = turnstile.render(caixa, {
        sitekey: TURNSTILE_SITE_KEY,
        execution: "execute",
        appearance: "interaction-only",
        language: "pt-br",
        callback: (token: string) => {
          pendente?.resolve(token);
          pendente = null;
        },
        "error-callback": falhou,
        "timeout-callback": falhou,
      });
      widgets.set(caixa, widget);
    } else {
      turnstile.reset(widget);
    }
    turnstile.execute(caixa);
  });
}
