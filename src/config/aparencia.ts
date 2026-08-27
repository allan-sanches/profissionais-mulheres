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
 */

import identidadeJson from "@/content/site/identidade.json";
import navegacaoJson from "@/content/site/navegacao.json";
import pesquisadorasJson from "@/content/site/pesquisadoras.json";
import rodapeJson from "@/content/site/rodape.json";

export interface Link {
  rotulo: string;
  endereco: string;
}

export interface NoDeTexto {
  text: string;
  [marca: string]: unknown;
}
export interface NoDeBloco {
  type?: string;
  children: (NoDeTexto | NoDeBloco)[];
  [prop: string]: unknown;
}

export const identidade = identidadeJson as {
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
  subtitulo: NoDeBloco[];
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
 * Versão em texto puro do rich text — para `<title>`, meta description e
 * qualquer lugar que não aceite marcação.
 */
export function textoPuro(conteudo: NoDeBloco[]): string {
  const percorrer = (nos: (NoDeTexto | NoDeBloco)[]): string =>
    nos
      .map((no) =>
        typeof (no as NoDeTexto).text === "string"
          ? (no as NoDeTexto).text
          : percorrer((no as NoDeBloco).children ?? []),
      )
      .join("");
  return conteudo.map((bloco) => percorrer(bloco.children ?? [])).join(" ");
}
