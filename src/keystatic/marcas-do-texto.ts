import { marcasDeCor } from "./marcas-de-cor";
import { marcasDeTamanho } from "./marcas-de-tamanho";
import { componentesDoTexto } from "./texto-do-wix";

/**
 * Todas as marcas de um texto com a barra completa: cor, tamanho, alinhamento
 * e sublinhado. É o `components` do campo e a lista que TextoRico.astro desenha.
 */
export const marcasDoTexto = {
  ...marcasDeCor,
  ...marcasDeTamanho,
  ...componentesDoTexto,
};
