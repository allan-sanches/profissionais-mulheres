import { fields, singleton } from "@keystatic/core";
import { marcasDeCor } from "./marcas-de-cor";

/*
 * Seções de aparência do site.
 *
 * Cada uma vira um item no menu do Keystatic e grava um JSON próprio em
 * src/content/site/. Os componentes Astro importam esses JSON direto, então o
 * que for editado aqui aparece no site no build seguinte.
 *
 * A separação segue o que a pessoa quer mudar, e não onde o código guarda:
 * quem vai trocar uma logo não deveria precisar saber que ela é usada no menu,
 * no rodapé e no favicon ao mesmo tempo.
 */

/** Rich text com as duas cores da marca. Usado onde o texto é corrido. */
const textoRico = (label: string, description: string) =>
  fields.document({
    label,
    description,
    formatting: {
      inlineMarks: ["bold", "italic"],
      softBreaks: true,
    },
    links: true,
    componentBlocks: marcasDeCor,
  });

/** Imagem gravada em public/ — o caminho salvo no JSON já é o do site. */
const imagem = (label: string, description: string) =>
  fields.image({
    label,
    description,
    directory: "public/imagens",
    publicPath: "/imagens/",
  });

const link = fields.object({
  rotulo: fields.text({
    label: "Texto do link",
    validation: { isRequired: true },
  }),
  endereco: fields.url({
    label: "Endereço",
    validation: { isRequired: true },
  }),
});

export const identidadeVisual = singleton({
  label: "1. Identidade visual",
  path: "src/content/site/identidade",
  format: "json",
  schema: {
    logoMenu: imagem(
      "Logo do menu do topo",
      "Aparece na barra de navegação de todas as páginas. Formato horizontal funciona melhor aqui.",
    ),
    alturaLogoMenu: fields.integer({
      label: "Altura da logo do menu (px)",
      description:
        "A largura acompanha sozinha, mantendo a proporção da imagem. Padrão: 48.",
      defaultValue: 48,
      validation: { min: 24, max: 96 },
    }),
    logoRodape: imagem(
      "Logo do rodapé",
      "O rodapé tem fundo roxo, então use uma versão clara da logo.",
    ),
    logoPainelDeFiltros: imagem(
      "Logo do painel de filtros",
      "Pequena, no topo do painel lateral. Fica sobre um fundo branco.",
    ),
    favicon: imagem(
      "Favicon",
      "Ícone que aparece na aba do navegador. Use uma imagem quadrada.",
    ),
    imagemDeCompartilhamento: imagem(
      "Imagem de compartilhamento",
      "Aparece quando alguém compartilha o link no WhatsApp ou nas redes. Proporção recomendada: 1200x630.",
    ),
  },
});

export const navegacao = singleton({
  label: "2. Menu do topo",
  path: "src/content/site/navegacao",
  format: "json",
  schema: {
    enderecoDaLogo: fields.url({
      label: "Para onde a logo leva",
      description: "Normalmente o site principal.",
    }),
    links: fields.array(link, {
      label: "Links do menu",
      itemLabel: (props) => props.fields.rotulo.value || "Link sem texto",
    }),
  },
});

export const paginaDePesquisadoras = singleton({
  label: "3. Página de pesquisadoras",
  path: "src/content/site/pesquisadoras",
  format: "json",
  schema: {
    titulo: fields.text({
      label: "Título",
      description: "O texto grande no alto da página.",
      validation: { isRequired: true },
    }),
    subtitulo: textoRico(
      "Texto de apresentação",
      "Aparece abaixo do título. Selecione um trecho e use os botões de destaque roxo ou verde para colorir com as cores da marca.",
    ),
    imagemDeFundo: imagem(
      "Imagem de fundo do título",
      "Fica atrás do título, sob um véu roxo que garante a leitura do texto.",
    ),

    colunas: fields.object(
      {
        pesquisadora: fields.text({ label: "1ª coluna" }),
        instituicao: fields.text({ label: "2ª coluna" }),
        formacao: fields.text({ label: "3ª coluna" }),
        localizacao: fields.text({ label: "4ª coluna" }),
        perfil: fields.text({ label: "5ª coluna" }),
      },
      {
        label: "Títulos das colunas da tabela",
        description:
          "A ordem e a quantidade de colunas são fixas — aqui muda só o texto de cada uma.",
      },
    ),

    botoes: fields.object(
      {
        filtros: fields.text({ label: "Abrir filtros" }),
        aplicarFiltros: fields.text({ label: "Aplicar filtros" }),
        limparFiltros: fields.text({ label: "Limpar filtros" }),
        comoUtilizar: fields.text({ label: "Como utilizar" }),
        verPerfil: fields.text({ label: "Ver perfil (nos cards)" }),
        voltar: fields.text({ label: "Voltar (na página de perfil)" }),
      },
      { label: "Textos dos botões" },
    ),

    buscaPlaceholder: fields.text({
      label: "Texto do campo de busca",
      description: "O texto cinza que aparece antes de a pessoa digitar.",
    }),

    semResultados: fields.object(
      {
        titulo: fields.text({ label: "Título" }),
        descricao: fields.text({ label: "Descrição" }),
      },
      {
        label: "Quando a busca não encontra ninguém",
      },
    ),
  },
});

export const rodape = singleton({
  label: "4. Rodapé",
  path: "src/content/site/rodape",
  format: "json",
  schema: {
    tituloDasRedes: fields.text({
      label: "Título acima das redes sociais",
    }),
    redes: fields.array(
      fields.object({
        nome: fields.text({
          label: "Nome da rede",
          validation: { isRequired: true },
        }),
        endereco: fields.url({
          label: "Endereço do perfil",
          validation: { isRequired: true },
        }),
        icone: fields.select({
          label: "Ícone",
          options: [
            { label: "Instagram", value: "mdi:instagram" },
            { label: "LinkedIn", value: "mdi:linkedin" },
            { label: "YouTube", value: "mdi:youtube" },
            { label: "Facebook", value: "mdi:facebook" },
            { label: "TikTok", value: "tiktok" },
            { label: "Site", value: "mdi:web" },
          ],
          defaultValue: "mdi:instagram",
        }),
      }),
      {
        label: "Redes sociais",
        itemLabel: (props) => props.fields.nome.value || "Rede sem nome",
      },
    ),
    links: fields.array(link, {
      label: "Links do rodapé",
      description:
        "Independentes do menu do topo — dá pra mostrar aqui uma lista diferente.",
      itemLabel: (props) => props.fields.rotulo.value || "Link sem texto",
    }),
    creditos: fields.object(
      {
        organizacao: fields.text({ label: "Nome da organização" }),
        cnpj: fields.text({ label: "CNPJ" }),
        frase: fields.text({ label: "Frase final" }),
        desenvolvidoPor: fields.text({ label: "Desenvolvido por" }),
      },
      { label: "Linha de créditos" },
    ),
  },
});
