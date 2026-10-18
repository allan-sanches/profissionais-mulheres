/*
 * País, Estado e Cidade no lugar da caixa de texto de localização.
 *
 * Brasil vem marcado (é a resposta de quase todo mundo). Escolhido o estado, a
 * cidade passa a buscar na lista do IBGE daquele estado, servida pelo próprio
 * site em /dados/municipios/UF.json. Fora do Brasil, o estado some e a cidade
 * é digitada. Se a lista não carregar, a cidade também vira texto livre: o
 * servidor confere o nome e corrige a grafia antes de gravar.
 */

import { BRASIL, PAISES, type Localizacao } from "@/utils/formulario";
import { criarCombobox } from "./combobox";

export interface CampoLocalizacao {
  ler(): Localizacao;
  aplicar(l: Localizacao): Promise<void>;
}

const OPCOES_DE_PAIS = [BRASIL, ...PAISES.filter((p) => p !== BRASIL)];

const listas = new Map<string, Promise<string[]>>();

function municipiosDe(uf: string): Promise<string[]> {
  let lista = listas.get(uf);
  if (!lista) {
    lista = fetch(`/dados/municipios/${uf}.json`).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<string[]>;
    });
    // Falhou, esquece: a próxima escolha do mesmo estado tenta de novo.
    lista.catch(() => listas.delete(uf));
    listas.set(uf, lista);
  }
  return lista;
}

export function montarLocalizacao(
  el: HTMLElement,
  aoMudar: () => void,
): CampoLocalizacao {
  const raiz = (atributo: string) =>
    el.querySelector(`[${atributo}]`)!.closest<HTMLElement>("[data-combobox]")!;
  const selectUf = el.querySelector<HTMLSelectElement>("[data-uf]")!;
  const blocoUf = el.querySelector<HTMLElement>("[data-bloco-uf]")!;
  const dica = el.querySelector<HTMLElement>("[data-dica-cidade]")!;

  let paisAtual = BRASIL;

  const pais = criarCombobox(raiz("data-pais"), {
    semResultado: "Nenhum país com esse nome.",
    aoMudar: () => {
      trocarPais();
      aoMudar();
    },
  });
  const cidade = criarCombobox(raiz("data-cidade"), {
    semResultado: "Nenhuma cidade com esse nome neste estado.",
    aoMudar,
  });

  pais.usarOpcoes(OPCOES_DE_PAIS);
  pais.definir(BRASIL);
  cidade.habilitar(false, "Escolha o estado primeiro");

  async function carregarCidades(uf: string) {
    dica.hidden = true;
    if (!uf) {
      cidade.usarOpcoes([]);
      cidade.habilitar(false, "Escolha o estado primeiro");
      return;
    }
    cidade.habilitar(false, "Carregando cidades…");
    try {
      const lista = await municipiosDe(uf);
      // A pessoa pode ter trocado de estado (ou de país) enquanto carregava.
      if (selectUf.value !== uf || paisAtual !== BRASIL) return;
      cidade.usarOpcoes(lista);
      cidade.habilitar(true, "Digite para buscar");
    } catch {
      if (selectUf.value !== uf || paisAtual !== BRASIL) return;
      cidade.usarOpcoes(null);
      cidade.habilitar(true, "Nome da cidade");
      dica.textContent =
        "Não conseguimos carregar a lista de cidades. Digite o nome da cidade.";
      dica.hidden = false;
    }
  }

  // Só reage a país confirmado: apagar "Brasil" pra digitar outro não pode
  // esconder o estado no meio da digitação.
  function trocarPais() {
    const escolhido = pais.valor();
    if (!escolhido || escolhido === paisAtual) return;
    paisAtual = escolhido;
    cidade.definir("");
    if (escolhido === BRASIL) {
      blocoUf.hidden = false;
      void carregarCidades(selectUf.value);
    } else {
      blocoUf.hidden = true;
      dica.hidden = true;
      cidade.usarOpcoes(null);
      cidade.habilitar(true, "Nome da cidade");
    }
  }

  selectUf.addEventListener("change", () => {
    cidade.definir("");
    void carregarCidades(selectUf.value);
    aoMudar();
  });

  return {
    ler: () => ({
      pais: pais.valor(),
      uf: paisAtual === BRASIL ? selectUf.value : "",
      cidade: cidade.valor(),
    }),
    async aplicar(l) {
      if (typeof l !== "object" || !l) return;
      pais.definir(String(l.pais ?? ""));
      trocarPais();
      if (paisAtual === BRASIL) {
        selectUf.value = String(l.uf ?? "");
        await carregarCidades(selectUf.value);
      }
      cidade.definir(String(l.cidade ?? ""));
    },
  };
}
