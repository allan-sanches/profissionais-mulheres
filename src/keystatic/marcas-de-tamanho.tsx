import { mark } from "@keystatic/core/content-components";

/*
 * Marcas de tamanho de fonte, aplicadas sobre um trecho selecionado.
 *
 * O tamanho é em `em`, ou seja, proporcional ao do texto em volta, e não um
 * valor fixo: assim acompanha a escala de onde o campo aparece. `className` é
 * o que vale na página (ver TextoRico.astro) e `style` é o que aparece no
 * editor, que não carrega o CSS do site.
 */

const icone = (tamanho: number) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <text
      x="8"
      y="13"
      textAnchor="middle"
      fontSize={tamanho}
      fontWeight="700"
      fill="currentColor"
    >
      A
    </text>
  </svg>
);

/** Passado ao `components` do campo, como as marcas de cor. */
export const marcasDeTamanho = {
  textoPequeno: mark({
    label: "Texto pequeno",
    icon: icone(9),
    tag: "span",
    className: "text-[0.75em]",
    style: { fontSize: "0.75em" },
    schema: {},
  }),
  textoGrande: mark({
    label: "Texto grande",
    icon: icone(13),
    tag: "span",
    className: "text-[1.25em]",
    style: { fontSize: "1.25em" },
    schema: {},
  }),
  textoMuitoGrande: mark({
    label: "Texto muito grande",
    icon: icone(17),
    tag: "span",
    className: "text-[1.5em]",
    style: { fontSize: "1.5em" },
    schema: {},
  }),
};
