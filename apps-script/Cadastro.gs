/*
 * Cadastro pelo site — rede.mulheresnaecologia.com/cadastro
 *
 * Este script fica DENTRO do Google Forms (⋮ → Editor de scripts) e é a ponte
 * entre o site e o formulário. Ele faz duas coisas, sempre a pedido do
 * servidor do site:
 *
 *   - "estrutura": descreve o formulário (perguntas, opções, seções e desvios)
 *     pra que o site monte a página igual ao Forms. Editou o formulário, a
 *     página acompanha em alguns minutos, sem mexer no código.
 *   - "enviar": grava uma resposta no próprio formulário. Ela entra na aba de
 *     respostas e na planilha exatamente como uma resposta enviada pelo Forms.
 *
 * O Forms não tem como ler as regras de validação de uma pergunta pelo script
 * (só criar), e resposta criada por script não passa pela obrigatoriedade. Por
 * isso quem valida é o site, antes de chamar o "enviar".
 *
 * Como instalar: ver a story "Documentação/Auditoria do Formulário" no
 * Storybook, seção "Cadastro pelo site".
 */

const PROPRIEDADE_TOKEN = "TOKEN_CADASTRO";

/**
 * Rode uma vez pelo editor (selecione esta função e clique em Executar).
 * Gera o token que o site usa pra conversar com o script e mostra no registro
 * de execução. Rodar de novo não troca o token: só mostra o mesmo.
 */
function configurarCadastro() {
  const propriedades = PropertiesService.getScriptProperties();
  let token = propriedades.getProperty(PROPRIEDADE_TOKEN);
  if (!token) {
    token =
      Utilities.getUuid().replace(/-/g, "") +
      Utilities.getUuid().replace(/-/g, "");
    propriedades.setProperty(PROPRIEDADE_TOKEN, token);
  }
  const estrutura = estrutura_();
  console.log("Formulário: " + estrutura.titulo);
  console.log("Itens lidos: " + estrutura.itens.length);
  console.log(
    "Planilha que recebe as respostas: " +
      (estrutura.planilha
        ? "https://docs.google.com/spreadsheets/d/" +
          estrutura.planilha +
          " (precisa ser a mesma que o sync lê)"
        : "NENHUMA. Ligue o formulário à planilha em Respostas → Vincular ao Planilhas."),
  );
  estrutura.problemas.forEach(function (p) {
    console.warn("ATENÇÃO: " + p);
  });
  console.log(
    "Token (vai na variável FORMULARIO_SCRIPT_TOKEN da Vercel): " + token,
  );
}

/** Abrir a URL do app da web no navegador mostra se o script está no ar. */
function doGet() {
  return json_({ ok: true, servico: "cadastro" });
}

function doPost(e) {
  try {
    const corpo = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const token =
      PropertiesService.getScriptProperties().getProperty(PROPRIEDADE_TOKEN);
    if (!token || corpo.token !== token) {
      return json_({
        ok: false,
        codigo: "nao-autorizado",
        erro: "Token inválido ou não configurado.",
      });
    }
    if (corpo.acao === "estrutura")
      return json_({ ok: true, estrutura: estrutura_() });
    if (corpo.acao === "enviar")
      return json_(Object.assign({ ok: true }, enviar_(corpo.respostas || {})));
    return json_({
      ok: false,
      codigo: "acao-desconhecida",
      erro: "Ação desconhecida: " + corpo.acao,
    });
  } catch (err) {
    console.error(err);
    return json_({
      ok: false,
      codigo: err.codigo || "erro",
      erro: String((err && err.message) || err),
    });
  }
}

// ── Estrutura ───────────────────────────────────────────────────────────────

function formulario_() {
  const form = FormApp.getActiveForm();
  if (!form) {
    throw erro_(
      "sem-formulario",
      "O script precisa estar dentro do Google Forms (⋮ → Editor de scripts).",
    );
  }
  return form;
}

function estrutura_() {
  const form = formulario_();
  return {
    titulo: form.getTitle(),
    descricao: form.getDescription(),
    confirmacao: form.getConfirmationMessage(),
    aceitandoRespostas: form.isAcceptingResponses(),
    mensagemFechado: form.getCustomClosedFormMessage(),
    // Configurações que impedem o envio pelo site: a página já abre avisando,
    // em vez de deixar a pessoa preencher tudo e falhar no "Enviar".
    problemas: problemasDeConfiguracao_(form),
    planilha: planilhaDeDestino_(form),
    itens: form.getItems().map(descrever_),
  };
}

// Com qualquer uma destas ligada, o Forms recusa a resposta criada por script
// só com "Dados inválidos ao atualizar o formulário": o script não tem como
// informar o e-mail de quem responde, nem passar pelo login de "1 resposta".
function problemasDeConfiguracao_(form) {
  const problemas = [];
  if (form.collectsEmail()) {
    problemas.push(
      'Em Configurações → Respostas, "Coletar endereços de e-mail" precisa estar em "Não coletar". O e-mail continua vindo da pergunta "E-mail para contato".',
    );
  }
  if (form.hasLimitOneResponsePerUser()) {
    problemas.push(
      'Em Configurações → Respostas, "Limitar a 1 resposta" precisa estar desligado.',
    );
  }
  return problemas;
}

function planilhaDeDestino_(form) {
  try {
    return String(form.getDestinationType()) === "SPREADSHEET"
      ? form.getDestinationId()
      : null;
  } catch (err) {
    return null; // formulário sem planilha ligada (uma cópia, por exemplo)
  }
}

function descrever_(item) {
  const tipo = String(item.getType());
  const base = {
    id: String(item.getId()),
    tipo: tipo,
    titulo: item.getTitle(),
    ajuda: item.getHelpText(),
  };
  let i;
  switch (tipo) {
    case "TEXT":
      return Object.assign(base, {
        obrigatoria: item.asTextItem().isRequired(),
      });
    case "PARAGRAPH_TEXT":
      return Object.assign(base, {
        obrigatoria: item.asParagraphTextItem().isRequired(),
      });
    case "DATE":
      i = item.asDateItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        incluiAno: i.includesYear(),
      });
    case "MULTIPLE_CHOICE":
      i = item.asMultipleChoiceItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        outro: i.hasOtherOption(),
        opcoes: i.getChoices().map(opcao_),
      });
    case "LIST":
      i = item.asListItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        outro: false,
        opcoes: i.getChoices().map(opcao_),
      });
    case "CHECKBOX":
      i = item.asCheckboxItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        outro: i.hasOtherOption(),
        opcoes: i.getChoices().map(function (c) {
          return { valor: c.getValue() };
        }),
      });
    case "GRID":
      i = item.asGridItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        linhas: i.getRows(),
        colunas: i.getColumns(),
      });
    case "CHECKBOX_GRID":
      i = item.asCheckboxGridItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        linhas: i.getRows(),
        colunas: i.getColumns(),
      });
    case "SCALE":
      i = item.asScaleItem();
      return Object.assign(base, {
        obrigatoria: i.isRequired(),
        minimo: i.getLowerBound(),
        maximo: i.getUpperBound(),
        rotuloMinimo: i.getLeftLabel(),
        rotuloMaximo: i.getRightLabel(),
      });
    case "PAGE_BREAK":
      // O desvio guardado na quebra vale pra seção ANTERIOR a ela: é o
      // "Após a seção N" do editor do Forms.
      i = item.asPageBreakItem();
      return Object.assign(base, {
        aposSecaoAnterior: navegacao_(
          i.getPageNavigationType(),
          i.getGoToPage(),
        ),
      });
    default:
      // Títulos de seção, imagens, vídeos e tipos que o site ainda não sabe
      // mostrar. O site decide o que fazer com cada um.
      return base;
  }
}

function opcao_(choice) {
  // Atenção à grafia: em Choice é getGotoPage; em PageBreakItem, getGoToPage.
  const destino = navegacao_(
    choice.getPageNavigationType(),
    choice.getGotoPage(),
  );
  return destino
    ? { valor: choice.getValue(), destino: destino }
    : { valor: choice.getValue() };
}

// Resume o desvio do Forms num valor só: o ID da seção de destino, 'ENVIAR',
// 'REINICIAR' ou 'SEGUIR' (a próxima seção na ordem). null = sem desvio.
function navegacao_(tipo, pagina) {
  if (!tipo) return null;
  switch (String(tipo)) {
    case "GO_TO_PAGE":
      return pagina ? String(pagina.getId()) : "SEGUIR";
    case "SUBMIT":
      return "ENVIAR";
    case "RESTART":
      return "REINICIAR";
    default:
      return "SEGUIR";
  }
}

// ── Envio ───────────────────────────────────────────────────────────────────

function enviar_(respostas) {
  const form = formulario_();
  if (!form.isAcceptingResponses()) {
    throw erro_("fechado", "O formulário não está aceitando respostas.");
  }
  const problemas = problemasDeConfiguracao_(form);
  if (problemas.length) throw erro_("configuracao", problemas.join(" "));
  const resposta = form.createResponse();
  Object.keys(respostas).forEach(function (id) {
    const item = form.getItemById(Number(id));
    if (!item)
      throw erro_(
        "formulario-mudou",
        "A pergunta " + id + " não existe mais no formulário.",
      );
    try {
      resposta.withItemResponse(respostaDoItem_(item, respostas[id]));
    } catch (err) {
      if (err.codigo) throw err;
      // O Forms recusa opção que não existe mais (alguém editou o formulário
      // enquanto a pessoa preenchia).
      throw erro_(
        "formulario-mudou",
        "Pergunta " + id + " (" + item.getTitle() + "): " + err.message,
      );
    }
  });
  return { id: resposta.submit().getId() };
}

function respostaDoItem_(item, valor) {
  switch (String(item.getType())) {
    case "TEXT":
      return item.asTextItem().createResponse(String(valor));
    case "PARAGRAPH_TEXT":
      return item.asParagraphTextItem().createResponse(String(valor));
    case "MULTIPLE_CHOICE":
      return item.asMultipleChoiceItem().createResponse(String(valor));
    case "LIST":
      return item.asListItem().createResponse(String(valor));
    case "CHECKBOX":
      return item.asCheckboxItem().createResponse(valor.map(String));
    case "GRID":
      // Uma posição por linha; null = linha sem resposta.
      return item.asGridItem().createResponse(valor);
    case "CHECKBOX_GRID":
      return item.asCheckboxGridItem().createResponse(valor);
    case "SCALE":
      return item.asScaleItem().createResponse(Number(valor));
    case "DATE": {
      // Meio-dia evita que o fuso do script empurre a data pro dia anterior.
      const partes = String(valor).split("-").map(Number);
      return item
        .asDateItem()
        .createResponse(new Date(partes[0], partes[1] - 1, partes[2], 12));
    }
    default:
      throw erro_(
        "tipo-nao-suportado",
        "O site não envia respostas do tipo " + item.getType() + ".",
      );
  }
}

// ── Apoio ───────────────────────────────────────────────────────────────────

function erro_(codigo, mensagem) {
  const e = new Error(mensagem);
  e.codigo = codigo;
  return e;
}

function json_(dados) {
  return ContentService.createTextOutput(JSON.stringify(dados)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
