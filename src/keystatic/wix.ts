import { fields, singleton } from "@keystatic/core";

/*
 * Páginas do Wix.
 *
 * O site oficial (mulheresnaecologia.com) é feito no Wix, mas duas partes dele
 * são páginas deste projeto que o Wix mostra por dentro, pelo elemento
 * "Incorporar um site": o topo da página inicial e a página do podcast
 * Ecologia por Elas. Cada uma é uma seção aqui, grava um JSON em
 * src/content/wix/ e é desenhada por src/pages/wix/<nome>.astro.
 *
 * Como o Wix carrega a página pelo endereço, cada "Save" entra no ar sozinho
 * depois do build da Vercel (alguns minutos). Não há código para colar no Wix.
 *
 * As imagens ficam em public/imagens/wix/<página>/. O nome do arquivo é dado
 * pelo próprio Keystatic a partir do campo (ex.:
 * episodios/lista/0/convidadas/1/foto.webp, onde os números são a posição na
 * lista), por isso as pastas acompanham a estrutura do formulário.
 */

/**
 * Texto com o editor do Keystatic (negrito, itálico e link). Fica gravado
 * dentro do próprio JSON, em Markdoc; quem transforma em HTML é
 * `textoEmHtml` em src/config/wix.ts. Uma linha em branco começa outro
 * parágrafo.
 */
const texto = (label: string, description?: string) =>
  fields.markdoc.inline({
    label,
    description,
    options: {
      bold: true,
      italic: true,
      link: true,
      strikethrough: false,
      code: false,
      heading: [],
      blockquote: false,
      orderedList: false,
      unorderedList: false,
      table: false,
      image: false,
      divider: false,
      codeBlock: false,
    },
  });

/** Título que pode ter mais de uma linha: cada linha do campo vira uma linha. */
const tituloEmLinhas = (label: string) =>
  fields.text({
    label,
    description: "Cada linha deste campo vira uma linha do título na página.",
    multiline: true,
    validation: { isRequired: true },
  });

const tituloDaFaixa = (padrao: string) =>
  fields.text({
    label: "Título da faixa",
    defaultValue: padrao,
    validation: { isRequired: true },
  });

// ---------------------------------------------------------------------------
// Topo da página inicial
// ---------------------------------------------------------------------------

const imagemDoTopo = (label: string, description: string) =>
  fields.image({
    label,
    description,
    directory: "public/imagens/wix/topo",
    publicPath: "/imagens/wix/topo/",
    validation: { isRequired: true },
  });

export const topoDaPaginaInicial = singleton({
  label: "Topo da página inicial",
  path: "src/content/wix/topo",
  format: "json",
  previewUrl: "/wix/topo",
  schema: {
    titulo: tituloEmLinhas("Título"),
    texto: texto(
      "Texto",
      "Fica embaixo do título. Na tela do computador ele tem a mesma largura do título, então um texto bem mais longo deixa o bloco alto.",
    ),
    botao: fields.object(
      {
        rotulo: fields.text({
          label: "Texto do botão",
          validation: { isRequired: true },
        }),
        endereco: fields.url({
          label: "Endereço",
          description:
            "Página que o botão abre, na mesma aba (normalmente uma página do próprio Wix).",
          validation: { isRequired: true },
        }),
      },
      { label: "Botão" },
    ),
    logo: imagemDoTopo(
      "Logo",
      "Fica à esquerda do título no computador e em cima dele no celular. Use PNG ou WebP com fundo transparente.",
    ),
    imagemDeFundo: imagemDoTopo(
      "Imagem de fundo",
      "No computador a foto fica à direita e o resto é preenchido com o roxo #1a0e4e, então a foto deve terminar nesse roxo do lado esquerdo. No celular ela fica atrás do texto, escurecida.",
    ),
  },
});

// ---------------------------------------------------------------------------
// Página do podcast Ecologia por Elas
// ---------------------------------------------------------------------------

const imagemDoPodcast = (
  label: string,
  description: string,
  obrigatoria = true,
) =>
  fields.image({
    label,
    description,
    directory: "public/imagens/wix/podcast",
    publicPath: "/imagens/wix/podcast/",
    validation: { isRequired: obrigatoria },
  });

const email = fields.text({
  label: "E-mail",
  description: "Opcional. Aparece na etiqueta verde, embaixo do nome.",
});

/** Logo de instituição, nas colunas "Realização" e "Apoio". */
const logos = (label: string) =>
  fields.array(
    fields.object({
      imagem: imagemDoPodcast(
        "Logo",
        "PNG ou WebP com fundo transparente, que aparece sobre o lilás.",
      ),
      nome: fields.text({
        label: "Nome da instituição",
        description:
          "Não aparece na tela: é lido por leitores de tela e mostrado se a imagem não carregar.",
        validation: { isRequired: true },
      }),
      largura: fields.integer({
        label: "Largura (em pixels)",
        description:
          "Ajuste a olho para os logos parecerem do mesmo tamanho. Os atuais vão de 190 a 250.",
        defaultValue: 200,
        validation: { isRequired: true, min: 60, max: 385 },
      }),
      legenda: fields.text({
        label: "Legenda",
        description: "Opcional. Texto em branco embaixo do logo.",
      }),
    }),
    {
      label,
      description:
        "Clique no nome de um logo para trocar a imagem, a largura ou a legenda. Arraste pelos pontinhos para mudar a ordem.",
      itemLabel: (props) => props.fields.nome.value || "Novo logo",
    },
  );

export const paginaDoPodcast = singleton({
  label: "Página do podcast",
  path: "src/content/wix/podcast",
  format: "json",
  previewUrl: "/wix/podcast",
  schema: {
    apresentacao: fields.object(
      {
        titulo: tituloDaFaixa("APRESENTAÇÃO"),
        texto: texto("Texto", "O texto de cima, em largura maior."),
        textoAoLadoDoLogo: texto(
          "Texto ao lado do logo",
          "O texto de baixo, com o logo à direita.",
        ),
        logo: imagemDoPodcast(
          "Logo",
          "Fica à direita do texto de baixo, com 340 pixels de largura.",
        ),
        descricaoDoLogo: fields.text({
          label: "Nome do logo",
          description:
            "Não aparece na tela: é lido por leitores de tela e mostrado se a imagem não carregar.",
        }),
      },
      { label: "1. Apresentação" },
    ),

    apresentadoras: fields.object(
      {
        titulo: tituloDaFaixa("APRESENTADORAS"),
        pessoas: fields.array(
          fields.object({
            nome: fields.text({
              label: "Nome",
              validation: { isRequired: true },
            }),
            email,
            foto: imagemDoPodcast(
              "Foto",
              "Quadrada, aparece com 200 × 200 pixels (envie pelo menos 400 × 400).",
            ),
            bio: texto("Bio"),
          }),
          {
            label: "Apresentadoras",
            description:
              "Clique no nome para trocar a foto, o e-mail ou a bio. Elas se alternam: a 1ª com a foto à esquerda da bio, a 2ª à direita (com o logo do podcast de pé embaixo), e assim por diante.",
            itemLabel: (props) =>
              props.fields.nome.value || "Nova apresentadora",
          },
        ),
        logoDoPodcast: imagemDoPodcast(
          "Logo do podcast (de pé)",
          "O logo Ecologia por Elas que fica girado, de pé, embaixo da 2ª apresentadora. Envie o logo deitado (na horizontal): a página gira sozinha.",
        ),
      },
      { label: "2. Apresentadoras (fotos e bios)" },
    ),

    episodios: fields.object(
      {
        titulo: tituloDaFaixa("EPISÓDIOS"),
        lista: fields.array(
          fields.object({
            numero: fields.integer({
              label: "Número do episódio",
              description: 'Aparece no selo roxo: "Episódio 1".',
              validation: { isRequired: true, min: 1 },
            }),
            titulo: fields.text({
              label: "Título",
              validation: { isRequired: true },
            }),
            link: fields.url({
              label: "Link do episódio",
              description:
                'Vazio: aparece "Em breve". Link do YouTube: botão "Assistir". Qualquer outro link (Spotify etc.): botão "Ouvir".',
            }),
            sinopse: texto(
              "Sinopse",
              "Aparece abaixo dos nomes das convidadas. Vazia, não aparece.",
            ),
            convidadas: fields.array(
              fields.object({
                nome: fields.text({
                  label: "Nome",
                  validation: { isRequired: true },
                }),
                email,
                foto: imagemDoPodcast(
                  "Foto",
                  "Quadrada, com o rosto no centro: a página recorta em círculo. 300 × 300 pixels bastam. Sem foto, aparece um círculo lilás.",
                  false,
                ),
                bio: texto(
                  "Bio",
                  'Aparece ao clicar em "Conhecer as convidadas".',
                ),
              }),
              {
                label: "Convidadas",
                description:
                  'Clique no nome para trocar a foto, o e-mail ou a bio. Na ordem em que aparecem em "Com Fulana, Ciclana e Beltrana".',
                itemLabel: (props) =>
                  props.fields.nome.value || "Nova convidada",
              },
            ),
          }),
          {
            label: "Episódios",
            description:
              "Clique num episódio para editar título, link e sinopse. As convidadas (foto, e-mail e bio) ficam dentro de cada episódio. Na ordem em que aparecem na página.",
            itemLabel: (props) =>
              `Episódio ${props.fields.numero.value ?? "?"}: ${props.fields.titulo.value || "sem título"}`,
          },
        ),
      },
      { label: "3. Episódios e convidadas" },
    ),

    realizacao: fields.object(
      {
        titulo: tituloDaFaixa("Realização"),
        logos: logos("Logos"),
      },
      { label: "4. Realização (coluna da esquerda)" },
    ),

    apoio: fields.object(
      {
        titulo: tituloDaFaixa("Apoio"),
        logos: logos("Logos"),
      },
      { label: "5. Apoio (coluna da direita)" },
    ),

    apoie: fields.object(
      {
        titulo: tituloEmLinhas("Título"),
        qrCode: imagemDoPodcast(
          "QR code do PIX",
          "Aparece com 140 × 140 pixels. PNG é o melhor formato para QR code.",
        ),
        chavePix: fields.text({
          label: "Chave PIX",
          description:
            'Aparece ao lado do botão "Copiar chave PIX", que copia exatamente este texto.',
          validation: { isRequired: true },
        }),
        instagram: fields.text({
          label: "Instagram",
          description:
            "Só o nome de usuário, sem @ e sem link. Ex.: mulheres_na_ecologia",
          validation: { isRequired: true },
        }),
        email: fields.text({
          label: "E-mail para contato",
          validation: { isRequired: true },
        }),
        site: fields.url({
          label: "Site",
          description: 'Endereço do link "Acesse o site aqui".',
          validation: { isRequired: true },
        }),
        chamada: texto(
          "Chamada",
          "A frase embaixo dos contatos. Use negrito para destacar palavras.",
        ),
        cartaoDoInstagram: fields.object(
          {
            nome: fields.text({
              label: "Nome do perfil",
              description: "Aparece embaixo do nome de usuário.",
            }),
            categoria: fields.text({
              label: "Categoria",
              description: 'Em cinza, como no Instagram. Ex.: "Cientista".',
            }),
            primeiraLinha: fields.text({
              label: "1ª linha da descrição",
              description: "Com a bolinha roxa.",
            }),
            segundaLinha: fields.text({
              label: "2ª linha da descrição",
              description:
                'Com a bolinha verde. Termina com "mais", como o Instagram faz quando a bio é comprida.',
            }),
            link: fields.text({
              label: "Link da bio",
              description:
                "Aparece em azul, só como texto (o cartão inteiro já leva ao Instagram). Ex.: linktr.ee/mulheres_na_ecologia",
            }),
            posts: fields.text({ label: "Posts" }),
            seguidores: fields.text({
              label: "Seguidores",
              description: "Do jeito que o Instagram mostra. Ex.: 15,9 mil",
            }),
            seguindo: fields.text({ label: "Seguindo" }),
          },
          {
            label: "Cartão do Instagram",
            description:
              "O cartão à direita imita o perfil do Instagram. Atualize de vez em quando, copiando do perfil.",
          },
        ),
      },
      { label: "6. Apoie e siga a nossa iniciativa" },
    ),

    imagemDeFundo: imagemDoPodcast(
      "7. Imagem de fundo",
      "Fica atrás das faixas Apresentadoras e Episódios, preenchendo a largura toda. Use uma foto bem clarinha, para os textos continuarem legíveis.",
    ),
  },
});
