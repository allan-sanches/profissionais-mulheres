import { mark } from "@keystatic/core/content-components";
import { alignCenterIcon } from "@keystar/ui/icon/icons/alignCenterIcon";
import { alignJustifyIcon } from "@keystar/ui/icon/icons/alignJustifyIcon";
import { alignLeftIcon } from "@keystar/ui/icon/icons/alignLeftIcon";
import { alignRightIcon } from "@keystar/ui/icon/icons/alignRightIcon";
import { underlineIcon } from "@keystar/ui/icon/icons/underlineIcon";

/*
 * Botões extras do editor dos textos do Wix (ver `texto` em wix.ts).
 *
 * O alinhamento é marca, aplicada como o negrito, e não um bloco (`wrapper`)
 * em volta dos parágrafos: o Keystatic insere bloco no lugar da seleção, então
 * quem selecionasse um parágrafo e clicasse em "Centralizar" o apagaria. Como
 * marca, é só selecionar e clicar.
 *
 * O trecho marcado vira um bloco próprio (display: block) com o alinhamento,
 * no editor e na página — onde as classes são postas por `textoEmHtml` em
 * src/config/wix.ts e desenhadas em src/styles/wix/texto.css. Selecionando o
 * parágrafo inteiro, é ele que fica alinhado; um pedaço dele vai para uma
 * linha só sua, igual nos dois lugares.
 *
 * `className` é para os textos fora do Wix, desenhados por TextoRico.astro,
 * onde há Tailwind e não há texto.css. As páginas do Wix não a usam.
 *
 * Cor de destaque ficou de fora de propósito: estes textos ficam ora sobre
 * branco, ora sobre roxo (sinopse, bios das convidadas, topo), e o roxo da
 * marca some no fundo roxo.
 */

const alinhamento = (
  label: string,
  icon: typeof alignLeftIcon,
  textAlign: string,
  className: string,
) =>
  mark({
    label,
    icon,
    tag: "span",
    className,
    style: { display: "block", textAlign },
    schema: {},
  });

/**
 * Passado ao `components` do campo. Os nomes viram as tags gravadas no
 * Markdoc ({% centralizar %}...{% /centralizar %}), então não dá para
 * renomeá-los sem migrar os textos já salvos.
 */
export const componentesDoTexto = {
  alinharEsquerda: alinhamento(
    "Alinhar à esquerda",
    alignLeftIcon,
    "left",
    "block text-left",
  ),
  centralizar: alinhamento(
    "Centralizar",
    alignCenterIcon,
    "center",
    "block text-center",
  ),
  alinharDireita: alinhamento(
    "Alinhar à direita",
    alignRightIcon,
    "right",
    "block text-right",
  ),
  justificar: alinhamento(
    "Justificar",
    alignJustifyIcon,
    "justify",
    "block text-justify",
  ),
  sublinhado: mark({
    label: "Sublinhado",
    icon: underlineIcon,
    tag: "u",
    schema: {},
  }),
};
