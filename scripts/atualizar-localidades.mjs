/*
 * Baixa do IBGE a lista de países e de municípios usada pelos campos de
 * localização do cadastro (/cadastro) e grava em src/data/.
 *
 * POR QUE UMA CÓPIA NO REPOSITÓRIO
 * A API do IBGE aceita chamada direto do navegador, mas a resposta de
 * municípios vem com micro e mesorregião junto: só Minas Gerais passa de
 * 380 KB, contra uns 13 KB de nomes. E se o IBGE sair do ar, o cadastro não
 * pode parar junto. Município novo é raro (o último lote foi em 2013), então
 * rodar isto de vez em quando basta:
 *
 *   npm run atualizar:localidades
 */

import fs from "node:fs";
import path from "node:path";

const IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const DESTINO = path.resolve("src/data");

async function buscar(caminho) {
  const res = await fetch(IBGE + caminho);
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status} em ${caminho}`);
  return res.json();
}

const ordenar = (a, b) => a.localeCompare(b, "pt-BR");

const paises = (await buscar("/paises")).map((p) => p.nome).sort(ordenar);

const municipios = {};
for (const m of await buscar("/municipios?view=nivelado")) {
  (municipios[m["UF-sigla"]] ??= []).push(m["municipio-nome"]);
}
for (const uf of Object.keys(municipios)) municipios[uf].sort(ordenar);

const total = Object.values(municipios).reduce((n, l) => n + l.length, 0);
if (
  paises.length < 190 ||
  Object.keys(municipios).length !== 27 ||
  total < 5500
) {
  throw new Error(
    `Resposta incompleta do IBGE (${paises.length} países, ` +
      `${Object.keys(municipios).length} UFs, ${total} municípios). Nada foi gravado.`,
  );
}

fs.mkdirSync(DESTINO, { recursive: true });
fs.writeFileSync(
  path.join(DESTINO, "paises.json"),
  JSON.stringify(paises, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(DESTINO, "municipios.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(municipios).sort(([a], [b]) => ordenar(a, b)),
    ),
    null,
    2,
  ) + "\n",
);

console.log(
  `✓ ${paises.length} países e ${total} municípios em ${Object.keys(municipios).length} UFs gravados em src/data/`,
);
