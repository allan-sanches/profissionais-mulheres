import type { Meta, StoryObj } from "@storybook/html-vite";
// O código mostrado na seção 4 é o próprio arquivo, então nunca fica defasado.
import SCRIPT_CADASTRO from "../../apps-script/Cadastro.gs?raw";

// Auditoria das perguntas do formulário "Mulheres na Ecologia", feita sobre as
// 261 respostas da planilha em 2026-09-24. Serve de referência pra equipe
// decidir o que fechar no Google Forms e o que normalizar no sync
// (src/utils/google-sheets.ts). Não é gerada automaticamente.

const meta: Meta = {
  title: "Documentação/Auditoria do Formulário",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

interface Linha {
  pergunta: string;
  problema: string;
  proposta: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fechadasLimpas = [
  "Preferência de divulgação",
  "Gênero",
  "LGBTQIAP+",
  "Raça/cor",
  "Status de Graduação / Mestrado / Doutorado",
  "Já finalizou o doutorado?",
];

const fechadasComOutro: Linha[] = [
  {
    pergunta: "PCD",
    problema: "“autismo” digitado como resposta.",
    proposta:
      "Remover o “Outro”. Se quiserem registrar o tipo, criar uma pergunta separada e opcional, que não vire tag.",
  },
  {
    pergunta: "Grupos tradicionais",
    problema:
      "“Não” (duplica “Não pertenço…”), “Tradicional”, grupos digitados à mão.",
    proposta:
      "Remover o “Outro” e incluir Caiçara, Ribeirinho e Caatingueira como opções.",
  },
  {
    pergunta: "Aceita palestras",
    problema: "“Sim, mas se for em outro local, preciso de ajuda de custo.”",
    proposta:
      "Só Sim / Talvez / Não, sem “Outro”. Condições vão para o campo de observações.",
  },
  {
    pergunta: "Trabalho atual",
    problema:
      "“Docente EBTT”, “Desempregada” / “Desempregado”, “Pesquisadora e curadora…”.",
    proposta:
      "Lista fechada com Docente EBTT, Pesquisadora em ONG/instituto, Sem vínculo no momento e Comunicação científica.",
  },
  {
    pergunta: "Áreas de pesquisa",
    problema:
      "70 itens distintos. As próprias opções têm erros de digitação: “Ecologia de ecossitemas”, “Gestão de áreas protegias”, “Etonoecologia”. Uma pessoa marcou 30 áreas.",
    proposta:
      "Corrigir as opções e promover a opção oficial o que vier no “Outro” (Ecologia microbiana, Paleoecologia). Sem limite de seleção por enquanto (decidido em 17/10/2026).",
  },
  {
    pergunta: "Grupos biológicos",
    problema:
      "“Grupo teórico” (14x), “Invertebrados parasitos” (papel ecológico, não táxon), “Meio abiótico”, “Todos”, “Seres humanos” duplicando “Humanos”. Uma pessoa marcou 26 grupos.",
    proposta:
      "Separar em duas perguntas: Táxon (máx. 4) e Abordagem (dentro de Áreas). “Grupo teórico” vira “Sem organismo específico (teórica/metodológica)”.",
  },
  {
    pergunta: "Formas de colaboração",
    problema:
      "“Traduação” (erro na opção), “Mentoria” duplicando “Mentoria ou orientação…”.",
    proposta:
      "Corrigir as opções. Aqui não vale limitar: a mediana é 7 e o campo não vira badge.",
  },
];

const abertas: Linha[] = [
  {
    pergunta: "Cidade, Estado e País onde nasceu",
    problema:
      "218 respostas distintas. Estado escrito de vários jeitos: “SP”, “São Paulo”, “Paulista”, “Brasil.” com ponto.",
    proposta:
      "Resolvido no cadastro pelo site (seção 4): País e Cidade com busca, Estado em lista. A resposta vai sempre no formato “Campinas, SP, Brasil”.",
  },
  {
    pergunta: "Cidade, Estado e País onde reside",
    problema: "200 respostas distintas, mesmos problemas da anterior.",
    proposta: "Mesma solução, no mesmo cadastro.",
  },
  {
    pergunta: "Curso de graduação",
    problema:
      "33 distintos, mas quase tudo é Ciências Biológicas (198x) ou Ecologia (17x).",
    proposta:
      "Lista com uns 10 cursos (Biológicas, Ecologia, Eng. Florestal, Oceanografia, Zootecnia, Veterinária, Geografia, Eng. Ambiental, Gestão Ambiental…) + “Outro”.",
  },
  {
    pergunta: "Universidade (graduação, mestrado, doutorado)",
    problema:
      "201 / 152 / 119 distintos. “UFRGS” solto, “Unesp Rio Claro”, “Universoidade”, com e sem sigla.",
    proposta:
      "Uma lista de instituições é inviável (são mais de 2 mil). Usar texto com validação por expressão regular exigindo o formato “Nome completo (SIGLA)”.",
  },
  {
    pergunta: "Programa de Pós (mestrado, doutorado)",
    problema:
      "217 / 159 distintos. “PPG Ecologia”, “Programa de Pós-Graduação em Ecologia (PPG-ECO)”, “Ecologia”.",
    proposta: "Mesma validação: “Programa de Pós-Graduação em X (SIGLA)”.",
  },
  {
    pergunta: "Instituição atual",
    problema: "90 distintos. “Temporária na UFRPE e efetiva na UFLA”, “não”.",
    proposta: "Mesma validação: “Nome completo (SIGLA)”.",
  },
  {
    pergunta: "Ano de finalização do doutorado",
    problema: "Limpo hoje (28 anos distintos, todos com 4 dígitos).",
    proposta: "Travar como número entre 1970 e o ano atual.",
  },
  {
    pergunta: "Trabalho que melhor descreve a pesquisa",
    problema:
      "Mais de 100 “Não se aplica” em variações, texto no lugar de link.",
    proposta: "Tornar opcional e validar como URL ou DOI.",
  },
  {
    pergunta: "Lattes, ResearchGate, Instagram, Site",
    problema: "Um Lattes com 1.038 caracteres, “não tenho” no lugar de link.",
    proposta: "Validar como URL (o Instagram pode aceitar @usuario).",
  },
  {
    pergunta: "Nome, e-mail, “Descreva sua pesquisa”, Observações",
    problema: "Sem problema: são texto livre por natureza.",
    proposta: "Continuam abertas.",
  },
];

const titulo = (texto: string, sub?: string) => `
  <div class="mb-4">
    <h2 class="font-epilogue text-2xl font-bold text-meco-purple-deep">${texto}</h2>
    ${sub ? `<p class="mt-1 text-sm text-gray-600">${sub}</p>` : ""}
  </div>`;

const tabela = (linhas: Linha[]) => `
  <div class="overflow-x-auto rounded-xl border border-meco-purple-soft/40">
    <table class="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead class="bg-meco-purple-bg text-meco-purple-deep">
        <tr>
          <th class="w-1/4 px-4 py-3 font-bold">Pergunta</th>
          <th class="w-3/8 px-4 py-3 font-bold">Problema nos dados</th>
          <th class="w-3/8 px-4 py-3 font-bold">Proposta</th>
        </tr>
      </thead>
      <tbody>
        ${linhas
          .map(
            (l) => `
          <tr class="border-t border-meco-purple-soft/30 align-top">
            <td class="px-4 py-3 font-semibold text-gray-900">${l.pergunta}</td>
            <td class="px-4 py-3 text-gray-700">${l.problema}</td>
            <td class="px-4 py-3 text-gray-900">${l.proposta}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`;

const aviso = (tituloAviso: string, itens: string[]) => `
  <div class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
    <p class="mb-2 font-bold">${tituloAviso}</p>
    <ul class="list-disc space-y-1 pl-5">
      ${itens.map((i) => `<li>${i}</li>`).join("")}
    </ul>
  </div>`;

const passos = (itens: string[]) => `
  <ol class="list-decimal space-y-2 pl-5 text-sm text-gray-800">
    ${itens.map((i) => `<li>${i}</li>`).join("")}
  </ol>`;

const codigo = (s: string) =>
  `<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-meco-purple-deep">${s}</code>`;

export const Padrao: Story = {
  render: () => `
<article class="mx-auto max-w-5xl space-y-12 px-4 py-10 text-gray-900">
  <header>
    <p class="text-xs font-bold tracking-wider text-meco-green-primary uppercase">Mulheres na Ecologia · formulário de cadastro</p>
    <h1 class="mt-2 font-epilogue text-3xl font-bold text-meco-purple-deep">Auditoria das perguntas do formulário</h1>
    <p class="mt-3 max-w-3xl text-gray-700">
      Levantamento das 36 colunas da planilha (261 respostas), separando o que já é
      fechado do que entra como texto livre e polui as tags e filtros do site.
      Contagens feitas em 24/09/2026.
    </p>
  </header>

  <section>
    ${titulo("1. Fechadas e limpas", "Não precisam mudar.")}
    <ul class="flex flex-wrap gap-2">
      ${fechadasLimpas
        .map(
          (p) =>
            `<li class="rounded-full bg-meco-green-bg px-3 py-1 text-sm font-semibold text-meco-green-dark">${p}</li>`,
        )
        .join("")}
    </ul>
    <p class="mt-4 text-sm text-gray-700">
      Gênero só tem 4 valores (“Feminino / Cisgênero” 255x, “Não-binário” 3x, “Prefiro não
      responder” 2x, “Feminino / Transgênero” 1x). Variações como “Mulher CIS” ou só
      “cis” não existem nos dados atuais. Se aparecem em algum lugar, vieram de outra fonte
      (versão antiga do formulário ou edição manual no Keystatic).
    </p>
  </section>

  <section>
    ${titulo("2. Fechadas, mas com “Outro” deixando entrar texto livre")}
    ${tabela(fechadasComOutro)}
    ${aviso("Cuidados técnicos", [
      `<strong>Vírgulas:</strong> o sync separa listas por vírgula. Resposta com vírgula no “Outro” vira duas tags, e as opções oficiais nunca podem ter vírgula.`,
      `<strong>Respostas antigas:</strong> corrigir o texto de uma opção no Google Forms não altera as respostas já enviadas. O sync precisa de uma tabela de apelidos (texto antigo → texto novo).`,
      `<strong>Limite de seleção:</strong> no Forms, em caixas de seleção, use Validação de resposta → “Selecionar no máximo N”.`,
    ])}
  </section>

  <section>
    ${titulo("3. Totalmente abertas (texto livre)")}
    ${tabela(abertas)}
    ${aviso("“Não se aplica” como ruído", [
      `Aparece mais de 90 vezes nos campos de doutorado, em variações (“não se aplica”, “Não seaplica”, “nao se qplica”, “Não faço”).`,
      `Causa: as perguntas de universidade e programa aparecem para quem não fez aquele nível. Os status hoje estão em grade, e grade não permite desvio.`,
      `Solução: transformar cada status em múltipla escolha no fim da sua seção, com “Ir para a seção com base na resposta”. Quem marca “não iniciado” pula as perguntas daquele nível.`,
    ])}
  </section>

  <section class="rounded-2xl border border-meco-green-soft/60 bg-meco-green-bg/40 p-6">
    ${titulo(
      "4. Cadastro pelo site",
      "Página em /cadastro que monta as perguntas a partir do Google Forms e grava as respostas nele.",
    )}

    <div class="space-y-4 text-sm text-gray-800">
      <p>
        O Google Forms não chama API enquanto a pessoa preenche: não tem busca nem lista que
        dependa de outra. A página ${codigo("/cadastro")} resolve isso sem trocar de ferramenta.
        Um script dentro do formulário descreve as perguntas para o site e grava cada resposta no
        próprio Forms. Ela entra na aba de respostas e na planilha como qualquer outra, então o
        sync não muda.
      </p>

      <h3 class="pt-2 font-epilogue text-lg font-bold text-meco-green-dark">O que a página faz</h3>
      <ul class="list-disc space-y-1 pl-5">
        <li><strong>Localização:</strong> nas duas perguntas “Cidade, Estado e País”, País e Cidade têm busca (funciona sem acento) e Estado é uma lista. A cidade vem da lista do IBGE do estado escolhido. A resposta vai sempre como “Campinas, SP, Brasil” ou “Lisboa, Portugal”, na mesma pergunta de hoje.</li>
        <li><strong>Seções e desvios:</strong> segue as seções e o “Ir para a seção com base na resposta” do Forms. O que foi preenchido numa seção que ficou fora do caminho não é enviado.</li>
        <li><strong>Validação:</strong> perguntas obrigatórias, e-mail e nada de vírgula no “Outro”. O formato de link só é exigido em pergunta de link <em>opcional</em>: hoje Lattes, ResearchGate, Instagram e Site são obrigatórios no Forms, e exigir um link válido travaria quem não tem algum deles. O servidor confere tudo de novo antes de gravar.</li>
        <li><strong>Rascunho:</strong> as respostas ficam guardadas enquanto a aba estiver aberta. Recarregar a página não apaga nada.</li>
        <li><strong>Anti-spam:</strong> Turnstile, da Cloudflare (quase sempre invisível), mais um campo-isca que só robô preenche.</li>
      </ul>

      <h3 class="pt-2 font-epilogue text-lg font-bold text-meco-green-dark">Quando a equipe edita o formulário</h3>
      <div class="overflow-x-auto rounded-xl border border-meco-purple-soft/40 bg-white">
        <table class="w-full min-w-140 border-collapse text-left text-sm">
          <thead class="bg-meco-purple-bg text-meco-purple-deep">
            <tr>
              <th class="w-1/2 px-4 py-3 font-bold">Aparece sozinho no site (em até 5 minutos)</th>
              <th class="w-1/2 px-4 py-3 font-bold">Precisa de ajuste no código</th>
            </tr>
          </thead>
          <tbody class="align-top">
            <tr class="border-t border-meco-purple-soft/30">
              <td class="px-4 py-3">Pergunta nova ou removida, ordem das perguntas</td>
              <td class="px-4 py-3">Regras de validação do Forms: o script não consegue lê-las. As do site ficam em ${codigo("src/utils/formulario.ts")}.</td>
            </tr>
            <tr class="border-t border-meco-purple-soft/30">
              <td class="px-4 py-3">Título, descrição, obrigatória ou não</td>
              <td class="px-4 py-3">Tipos que a página não mostra: upload de arquivo, hora, duração e avaliação. A pergunta fica de fora até ser implementada.</td>
            </tr>
            <tr class="border-t border-meco-purple-soft/30">
              <td class="px-4 py-3">Opções e “Outro”</td>
              <td class="px-4 py-3">Renomear as perguntas de localização: elas são reconhecidas pelo título (“Cidade, Estado e País…”). Para não depender dele, coloque o ID da pergunta em ${codigo("LOCALIZACAO.ids")}.</td>
            </tr>
            <tr class="border-t border-meco-purple-soft/30">
              <td class="px-4 py-3">Seções, desvios, mensagem de confirmação e formulário fechado</td>
              <td class="px-4 py-3">Mostrar uma pergunta nova nos perfis e filtros: é preciso mapear a coluna no ${codigo("HEADER_MAP")} de ${codigo("src/utils/google-sheets.ts")}. Renomear uma pergunta também exige ajustar ali, porque o sync acha a coluna pelo título exato.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="pt-2 font-epilogue text-lg font-bold text-meco-green-dark">Como instalar</h3>
      ${passos([
        `No Google Forms oficial, em <strong>Configurações → Respostas</strong>: “Coletar endereços de e-mail” em <strong>Não coletar</strong> e “Limitar a 1 resposta” <strong>desligado</strong>. Com qualquer um dos dois ligado, o Forms recusa resposta criada por script, e a página mostra “Cadastro indisponível”. O e-mail continua vindo da pergunta “E-mail para contato”.`,
        `Ainda no formulário: <strong>⋮ → Apps Script</strong> (em algumas versões, “Editor de scripts”). Apague o conteúdo padrão, cole o código do fim desta seção e salve.`,
        `Selecione a função ${codigo("configurarCadastro")} e clique em <strong>Executar</strong>. Autorize quando o Google pedir (o aviso “O Google não verificou este app” é normal em script próprio: Avançado → Acessar). O registro de execução mostra três coisas: confira que a <strong>planilha que recebe as respostas</strong> é a mesma que o sync lê, veja se apareceu algum <strong>ATENÇÃO</strong> e copie o <strong>token</strong>. Cuidado para não copiar o ID da implantação no lugar dele: o token tem 64 caracteres, só números e letras de a a f.`,
        `Clique em <strong>Implantar → Nova implantação</strong> e escolha o tipo <strong>App da Web</strong>. Em “Executar como”, escolha <strong>Eu</strong>; em “Quem pode acessar”, <strong>Qualquer pessoa</strong>. Implante e copie a URL, que termina em ${codigo("/exec")}. Aberta no navegador, ela deve mostrar ${codigo(escapeHtml('{"ok":true,"servico":"cadastro"}'))}.`,
        `No painel da Cloudflare, em <strong>Turnstile → Adicionar widget</strong>, cadastre o domínio ${codigo("rede.mulheresnaecologia.com")} e copie a chave do site e a chave secreta.`,
        `Na Vercel, em <strong>Settings → Environment Variables</strong>, crie ${codigo("FORMULARIO_SCRIPT_URL")} (a URL), ${codigo("FORMULARIO_SCRIPT_TOKEN")} (o token), ${codigo("TURNSTILE_SITE_KEY")} e ${codigo("TURNSTILE_SECRET_KEY")}. Faça um novo deploy: a chave do site entra no build.`,
        `Abra ${codigo("/cadastro")} e envie uma resposta de teste marcando <strong>“Não autorizo a exibição pública”</strong>: ela chega à planilha, mas o sync não a publica. Depois apague a resposta no Forms e a linha na planilha (apagar no Forms não apaga a linha).`,
        `Só então troque os links de “Cadastre-se” para ${codigo("/cadastro")}.`,
      ])}
      ${aviso("Cuidados", [
        `<strong>Editou o script?</strong> Vá em Implantar → Gerenciar implantações → lápis → Versão: <strong>Nova versão</strong>. Sem isso, a URL continua rodando o código antigo.`,
        `<strong>“Quem pode acessar” precisa ser “Qualquer pessoa”.</strong> Com outra opção, o Google responde com a tela de login e o cadastro fica indisponível.`,
        `<strong>O token é a senha entre o site e o script.</strong> Não cole em lugar público. Para trocar: em Configurações do projeto → Propriedades do script, apague ${codigo("TOKEN_CADASTRO")}, rode ${codigo("configurarCadastro")} de novo e atualize a Vercel.`,
        `<strong>A pergunta de consentimento manda no site.</strong> O sync só publica quem escolheu “Autorizo…” (ou o antigo “Estou de acordo…”) e tira do ar quem mudar a resposta para “Não autorizo”. Se essa pergunta for renomeada, o sync para com erro até alguém ajustar o ${codigo("HEADER_MAP")}: é de propósito, para nunca publicar quem recusou.`,
        `<strong>Para testar sem mexer no oficial,</strong> use uma cópia do formulário com o script instalado nela e aponte o ${codigo(".env.local")} para a cópia. A Vercel aponta para o oficial. A cópia não tem planilha ligada, então nada do que for enviado no teste chega ao site.`,
        `<strong>Sem as variáveis na Vercel,</strong> a página mostra “Cadastro indisponível”. No ${codigo("npm run dev")} ela usa um formulário de exemplo (${codigo("src/data/formulario-exemplo.json")}) e não grava nada.`,
      ])}

      <pre class="overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-relaxed text-gray-100"><code>${escapeHtml(SCRIPT_CADASTRO)}</code></pre>

      <h3 class="pt-2 font-epilogue text-lg font-bold text-meco-green-dark">O que muda na planilha e no site</h3>
      <ul class="list-disc space-y-1 pl-5">
        <li>Nada na estrutura: as respostas novas entram nas mesmas colunas de hoje.</li>
        <li>A localização chega padronizada, e o filtro por região passa a acertar também cidades com nome de estado, como Pará de Minas (MG), que antes caía em Pará.</li>
        <li>As 261 respostas antigas continuam como estão. Para elas, normalizar “SP” / “São Paulo” / “Paulista” segue sendo trabalho do sync.</li>
        <li>Países e municípios são uma cópia do IBGE guardada no repositório. Para atualizar: ${codigo("npm run atualizar:localidades")}.</li>
      </ul>
    </div>
  </section>
</article>`,
};
