/*
 * Ponto único de leitura do que é editável pelo Keystatic.
 *
 * Os quatro JSON de src/content/site/ são escritos pelas seções de "Aparência"
 * do painel (ver src/keystatic/secoes.ts). Os componentes importam daqui, e não
 * dos arquivos soltos, por dois motivos: o caminho fica num lugar só se a
 * estrutura mudar, e é aqui que os valores ganham tipo.
 *
 * A leitura é por `import` estático, então tudo é resolvido no build. Editar
 * pelo painel muda o JSON; o site só reflete a mudança no build seguinte — que
 * é como um site estático funciona, e o mesmo caminho que o sync da planilha já
 * percorre.
 *
 * A exceção é o rich text: o Keystatic grava campo de conteúdo num .mdoc ao
 * lado do JSON, e não dentro dele. Esse vem pelo leitor do próprio Keystatic,
 * que acha o arquivo e devolve a árvore do Markdoc (ver `lerSubtitulo`).
 */

import type { Node } from "@markdoc/markdoc";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import identidadeJson from "@/content/site/identidade.json";
import navegacaoJson from "@/content/site/navegacao.json";
import pesquisadorasJson from "@/content/site/pesquisadoras.json";
import rodapeJson from "@/content/site/rodape.json";

export interface Link {
  rotulo: string;
  endereco: string;
}

export const identidade = identidadeJson as {
  nomeDoSite: string;
  logoMenu: string;
  alturaLogoMenu: number;
  logoRodape: string;
  logoPainelDeFiltros: string;
  favicon: string;
  imagemDeCompartilhamento: string;
};

export const navegacao = navegacaoJson as {
  enderecoDaLogo: string;
  links: Link[];
};

export const pesquisadoras = pesquisadorasJson as {
  titulo: string;
  imagemDeFundo: string;
  colunas: {
    pesquisadora: string;
    instituicao: string;
    formacao: string;
    localizacao: string;
    perfil: string;
  };
  botoes: {
    filtros: string;
    aplicarFiltros: string;
    limparFiltros: string;
    comoUtilizar: string;
    verPerfil: string;
    voltar: string;
  };
  buscaPlaceholder: string;
  semResultados: { titulo: string; descricao: string };
};

export const rodape = rodapeJson as {
  tituloDasRedes: string;
  redes: { nome: string; endereco: string; icone: string }[];
  links: Link[];
  creditos: {
    organizacao: string;
    cnpj: string;
    frase: string;
    desenvolvidoPor: string;
  };
};

/**
 * Texto de apresentação da página de pesquisadoras, já como árvore do Markdoc.
 *
 * Lê do disco pelo caminho do repositório, então só serve no build (a home é
 * pré-renderizada). Se o .mdoc ainda não existir, o leitor devolve o documento
 * vazio do campo, e a página sai sem subtítulo em vez de quebrar.
 */
export async function lerSubtitulo(): Promise<Node> {
  const leitor = createReader(process.cwd(), keystaticConfig);
  const pagina = await leitor.singletons.paginaDePesquisadoras.readOrThrow({
    resolveLinkedFiles: true,
  });
  return pagina.subtitulo.node;
}

/**
 * Versão em texto puro do rich text — para `<title>`, meta description e
 * qualquer lugar que não aceite marcação.
 */
export function textoPuro(conteudo: Node): string {
  return conteudo.children
    .map((bloco) => {
      let texto = "";
      for (const no of bloco.walk()) {
        if (no.type === "text") texto += no.attributes.content;
        else if (no.type === "softbreak" || no.type === "hardbreak") {
          texto += " ";
        }
      }
      return texto.trim();
    })
    .filter(Boolean)
    .join(" ");
}
