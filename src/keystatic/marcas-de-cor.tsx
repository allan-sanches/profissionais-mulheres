import { mark } from "@keystatic/core/content-components";

/*
 * Marcas de cor para os campos de rich text.
 *
 * São as duas famílias do brandbook, as mesmas que já separam as etiquetas do
 * diretório — roxo para identidade, verde para pesquisa. Ficam como MARCA
 * (aplicada sobre um trecho selecionado, feito negrito) e não como escolha
 * livre de cor: uma paleta aberta deixaria o site sair da marca no primeiro
 * texto editado.
 *
 * `className` aponta pras classes utilitárias que o Tailwind já gera em outros
 * lugares do site. Elas precisam existir no CSS final — como o Tailwind varre o
 * código-fonte, e não o conteúdo JSON, este arquivo é justamente o que garante
 * que ele as veja.
 */

const IconeRoxo = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill="#7d1cd4" />
  </svg>
);

const IconeVerde = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill="#0d9426" />
  </svg>
);

export const destaqueRoxo = mark({
  label: "Destaque roxo",
  icon: IconeRoxo,
  tag: "span",
  className: "text-meco-purple-primary font-bold",
  schema: {},
});

export const destaqueVerde = mark({
  label: "Destaque verde",
  icon: IconeVerde,
  tag: "span",
  className: "text-meco-green-primary font-bold",
  schema: {},
});

/** Passado ao `componentBlocks` de cada campo de rich text. */
export const marcasDeCor = {
  destaqueRoxo,
  destaqueVerde,
};
