/**
 * Markup do card de pesquisadora, construído no cliente.
 *
 * A visão de cards nasce vazia no HTML: renderizar as 259 estaticamente
 * dobrava o peso da página pra um bloco que começa escondido e que boa parte
 * das visitas nunca abre. O servidor manda só os dados (ver `CardData`) e este
 * módulo monta o HTML da página corrente sob demanda.
 *
 * Espelha `ResearcherCard.astro`. Ao mexer em um, mexa no outro — os dois
 * consomem o mesmo view-model (`buildResearcherView`), então os dados já
 * batem; o que pode divergir é a marcação.
 */

export interface CardBadge {
  /** Texto exibido, ja com o teto de comprimento aplicado. */
  label: string;
  /** Texto original; so vem preenchido quando difere de `label`. */
  full?: string;
  /** Classes de cor vindas de CATEGORY_BADGE[key].color. */
  color: string;
}

export interface CardLink {
  href: string;
  /** Nome do ícone no sprite do astro-icon, ex.: "mdi:linkedin". */
  icon: string;
  title: string;
}

export interface CardData {
  slug: string;
  nome: string;
  iniciais: string;
  nivel: string;
  instituicao: string;
  localizacao: string;
  /** Já truncada no servidor — o corte por CSS deixaria o texto inteiro no DOM. */
  bio: string;
  /** Texto completo, só pro title do elemento. */
  bioCompleta: string;
  badges: CardBadge[];
  /** Quantas etiquetas sobraram além das visíveis. */
  extras: number;
  links: CardLink[];
  /** Rotulo do link pro perfil — vem do painel, junto com os dados. */
  verPerfil: string;
}

/**
 * Os dados vêm de uma planilha editada por pessoas: qualquer campo pode conter
 * `<` ou `&`. Como o card é montado por string + innerHTML, todo valor
 * interpolado passa por aqui.
 */
function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * viewBox de cada ícone, lido do banco de símbolos que a página mantém.
 *
 * O astro-icon põe o `viewBox` no `<svg>` que envolve o símbolo, e NÃO no
 * `<symbol>`. Um `<use>` nosso sem viewBox próprio herda coisa nenhuma: o path
 * é desenhado em coordenadas cruas dentro da caixa do ícone, e o que aparece é
 * um fragmento — foi o que quebrou os ícones dos cards.
 *
 * Fixar "0 0 24 24" não serve: os academicons usam 448x512, 384x512 e 512x512.
 * Por isso o valor é lido do DOM, e não codificado aqui.
 */
const iconViewBoxes = new Map<string, string>();

/**
 * Relê os viewBox do banco de símbolos. Precisa rodar antes do primeiro card e
 * a cada navegação — o ClientRouter troca o documento, e o banco vai junto.
 */
export function readIconViewBoxes(root: ParentNode = document) {
  iconViewBoxes.clear();
  for (const svg of root.querySelectorAll("svg[data-icon][viewBox]")) {
    const name = svg.getAttribute("data-icon");
    const viewBox = svg.getAttribute("viewBox");
    if (name && viewBox && !iconViewBoxes.has(name)) {
      iconViewBoxes.set(name, viewBox);
    }
  }
}

/**
 * O astro-icon injeta cada `<symbol>` na primeira vez que o ícone é renderizado
 * no servidor. Como os cards não são mais renderizados lá, a página mantém um
 * banco de símbolos escondido (ver ResearchersCards.astro) e aqui só
 * referenciamos por `<use>`.
 */
function icon(name: string, cls: string): string {
  const viewBox = iconViewBoxes.get(name);
  const attr = viewBox ? ` viewBox="${esc(viewBox)}"` : "";
  return `<svg width="1em" height="1em"${attr} class="${cls}" aria-hidden="true"><use href="#ai:${name}"></use></svg>`;
}

// Copia do PILL_BASE de utils/labels.ts — este modulo roda no cliente e nao
// importa de la pra nao arrastar o resto do arquivo pro bundle. Ao mexer em um,
// mexa no outro.
const PILL_BASE =
  "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-center text-xs font-medium break-words";

export function renderCard(c: CardData): string {
  const perfil = `/pesquisadoras/${esc(c.slug)}`;

  const nivel = c.nivel
    ? `<p class="text-sm font-semibold text-meco-purple-primary">${esc(c.nivel)}</p>`
    : "";

  const instituicao = c.instituicao
    ? `<p class="line-clamp-1 text-sm text-gray-500">${esc(c.instituicao)}</p>`
    : "";

  const localizacao = c.localizacao
    ? `<p class="mt-1 flex items-center gap-1.5 text-sm text-gray-500">${icon(
        "mdi:map-marker-outline",
        "size-4 shrink-0 text-meco-purple-primary",
      )}<span class="truncate">${esc(c.localizacao)}</span></p>`
    : "";

  const bio = c.bio
    ? `<p class="my-3 rounded-lg border-l-2 border-meco-purple-primary bg-gray-50/70 px-3 py-4 text-sm leading-relaxed text-gray-600 italic" title="${esc(
        c.bioCompleta,
      )}">${esc(c.bio)}</p>`
    : "";

  const badges = c.badges
    .map((b) => {
      const title = b.full ? ` title="${esc(b.full)}"` : "";
      return `<span class="${PILL_BASE} ${b.color} text-sm"${title}>${esc(
        b.label,
      )}</span>`;
    })
    .join("");

  const extras =
    c.extras > 0
      ? `<span class="badge-numero inline-flex bg-[#bf9ee3] text-xs font-bold text-gray-950">+${c.extras}</span>`
      : "";

  const semBadges =
    c.badges.length === 0 && c.extras === 0
      ? `<span class="text-sm text-gray-500">—</span>`
      : "";

  const links = c.links
    .map((l) => {
      const externo = l.href.startsWith("http")
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${esc(l.href)}"${externo} title="${esc(
        l.title,
      )}" aria-label="${esc(
        l.title,
      )}" class="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-all hover:bg-meco-purple-primary hover:text-white">${icon(
        l.icon,
        "size-5",
      )}</a>`;
    })
    .join("");

  return `<div class="flex h-full flex-col justify-between rounded-lg border border-gray-100 bg-white p-5 transition-all hover:border-meco-purple-soft/60" data-slug="${esc(
    c.slug,
  )}">
  <div>
    <a href="${perfil}" class="group/link flex items-start gap-3">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-meco-purple-primary/15 to-meco-green-primary/15 font-epilogue text-base font-bold text-meco-purple-primary">${esc(
        c.iniciais,
      )}</div>
      <div class="min-w-0 flex-1">
        <h3 class="line-clamp-1 font-epilogue text-lg font-bold text-gray-900 transition-colors group-hover/link:text-meco-purple-primary">${esc(
          c.nome,
        )}</h3>
        ${nivel}${instituicao}${localizacao}
      </div>
    </a>
    ${bio}
    <div class="mt-3 flex flex-wrap items-center gap-1.5">${badges}${extras}${semBadges}</div>
  </div>
  <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
    <div class="flex items-center gap-2">${links}</div>
    <a href="${perfil}" class="group/btn inline-flex items-center gap-1.5 text-sm font-bold text-meco-purple-primary hover:text-meco-purple-deep">${esc(c.verPerfil)}${icon(
      "mdi:arrow-right",
      "size-4 transition-transform group-hover/btn:translate-x-0.5",
    )}</a>
  </div>
</div>`;
}
