/*
 * Leitura das páginas do Wix editáveis pelo Keystatic (ver src/keystatic/wix.ts).
 *
 * Mesmo esquema de src/config/aparencia.ts: os JSON de src/content/wix/ entram
 * por `import` estático e ganham tipo aqui, e o site reflete a edição no build
 * seguinte. Os textos com editor (bio, sinopse...) vêm em Markdoc dentro do
 * próprio JSON e viram HTML por `textoEmHtml`.
 */

import Markdoc, { type Config, type Node } from "@markdoc/markdoc";
import topoJson from "@/content/wix/topo.json";
import podcastJson from "@/content/wix/podcast.json";
import linhasJson from "@/content/wix/linhas-editoriais.json";

// O pacote resolve para CommonJS no Node, que não expõe exports nomeados.
const { Tag } = Markdoc;

/*
 * Campo opcional deixado vazio no painel pode sumir do JSON ou vir como null,
 * por isso os opcionais aceitam os dois.
 */

export interface Pessoa {
  nome: string;
  email?: string;
  /** Caminho público da foto, ex.: /imagens/wix/podcast/.../foto.webp */
  foto?: string | null;
  /** Markdoc. */
  bio?: string;
}

export interface Logo {
  imagem: string;
  nome: string;
  largura: number;
  legenda?: string;
}

export const topo = topoJson as {
  /** Uma linha do título por linha do texto. */
  titulo: string;
  /** Markdoc. */
  texto?: string;
  botao: { rotulo: string; endereco: string };
  logo: string;
  imagemDeFundo: string;
};

export const podcast = podcastJson as {
  apresentacao: {
    titulo: string;
    texto?: string;
    textoAoLadoDoLogo?: string;
    logo: string;
    descricaoDoLogo?: string;
  };
  apresentadoras: {
    titulo: string;
    pessoas: Pessoa[];
    /** Logo do podcast deitado; a página o mostra girado, de pé. */
    logoDoPodcast: string;
  };
  episodios: {
    titulo: string;
    lista: {
      numero: number;
      titulo: string;
      link?: string | null;
      sinopse?: string;
      convidadas: Pessoa[];
    }[];
  };
  realizacao: { titulo: string; logos: Logo[] };
  apoio: { titulo: string; logos: Logo[] };
  apoie: {
    titulo: string;
    qrCode: string;
    chavePix: string;
    instagram: string;
    email: string;
    site: string;
    chamada?: string;
    cartaoDoInstagram?: {
      nome?: string;
      categoria?: string;
      primeiraLinha?: string;
      segundaLinha?: string;
      link?: string;
      posts?: string;
      seguidores?: string;
      seguindo?: string;
    };
  };
  /** Fundo das faixas Apresentadoras e Episódios. */
  imagemDeFundo: string;
};

export const linhasEditoriais = linhasJson as {
  itens: {
    titulo: string;
    link: string;
    /** Caminho público da ilustração; sem ela, o cartão fica só com texto. */
    ilustracao?: string | null;
  }[];
  textoDoBotao: string;
  /** 0 desliga a troca automática. */
  segundosPorTroca: number;
};

/**
 * Marca do editor → elemento com classe. Os nomes das tags são as chaves de
 * `componentesDoTexto` em src/keystatic/texto-do-wix.ts, e as classes são
 * desenhadas em src/styles/wix/texto.css.
 */
const marca = (elemento: string, classe?: string) => ({
  transform: (no: Node, config: Config) =>
    new Tag(
      elemento,
      classe ? { class: classe } : {},
      no.transformChildren(config),
    ),
});

const configDoTexto: Config = {
  nodes: {
    // Por padrão o documento vira <article>; aqui só os parágrafos interessam.
    document: {
      transform: (no, config) => no.transformChildren(config),
    },
    // Classe para o recuo e o respiro das listas, iguais em todas as páginas.
    list: {
      ...Markdoc.nodes.list,
      transform: (no, config) =>
        new Tag(
          no.attributes.ordered ? "ol" : "ul",
          no.attributes.start === undefined
            ? { class: "lista-texto" }
            : { class: "lista-texto", start: no.attributes.start },
          no.transformChildren(config),
        ),
    },
    // As páginas aparecem dentro do Wix (num iframe): link abre em outra aba.
    link: {
      attributes: { href: { type: String } },
      transform: (no, config) =>
        new Tag(
          "a",
          {
            href: no.attributes.href,
            class: "link-texto",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          no.transformChildren(config),
        ),
    },
  },
  tags: {
    alinharEsquerda: marca("span", "alinhar-esquerda"),
    centralizar: marca("span", "alinhar-centro"),
    alinharDireita: marca("span", "alinhar-direita"),
    justificar: marca("span", "alinhar-justificado"),
    sublinhado: marca("u"),
  },
};

/**
 * Markdoc gravado pelo editor do Keystatic → HTML (um <p> por parágrafo).
 * O renderer do Markdoc escapa o texto, então dá para usar em `set:html`.
 */
export function textoEmHtml(markdoc: string | undefined): string {
  if (!markdoc?.trim()) return "";
  return Markdoc.renderers.html(
    Markdoc.transform(Markdoc.parse(markdoc), configDoTexto),
  );
}

/** Quebra o título nas linhas do campo, sem linhas vazias. */
export function linhas(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);
}

/** "A", "A e B", "A, B e C". */
export function juntarNomes(nomes: string[]): string {
  if (nomes.length < 2) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
