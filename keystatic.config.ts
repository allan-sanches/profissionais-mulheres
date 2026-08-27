import { config, collection, singleton, fields } from "@keystatic/core";
import {
  identidadeVisual,
  navegacao,
  paginaDePesquisadoras,
  rodape,
} from "./src/keystatic/secoes";

export default config({
  storage: {
    kind: "local",
  },
  ui: {
    navigation: {
      Aparência: [
        "identidadeVisual",
        "navegacao",
        "paginaDePesquisadoras",
        "rodape",
      ],
      Conteúdo: ["researchers"],
      Ajuda: ["documentacao"],
    },
  },
  singletons: {
    // Aparência — cada seção grava seu proprio JSON em src/content/site/.
    identidadeVisual,
    navegacao,
    paginaDePesquisadoras,
    rodape,

    documentacao: singleton({
      label: "Documentação do Admin",
      path: "src/content/documentacao",
      format: "json",
      schema: {
        conteudo: fields.text({
          label: "Conteúdo",
          description:
            "Texto livre explicando o uso do Keystatic e dos botões do painel. Editado aos poucos.",
          multiline: true,
        }),
      },
    }),
  },
  collections: {
    researchers: collection({
      label: "Pesquisadoras",
      slugField: "nome",
      path: "src/content/researchers/*",
      format: "json",
      columns: ["nome", "formacao", "localizacao"],
      previewUrl: "/#{slug}",
      schema: {
        nome: fields.slug({
          name: {
            label: "Nome completo",
            validation: { isRequired: true },
          },
        }),
        email: fields.text({ label: "Email" }),
        telefone: fields.text({ label: "Telefone" }),
        formacao: fields.text({
          label: "Formação",
          description: "Ex: Doutora em Biotecnologia",
        }),
        nivel_formacao: fields.select({
          label: "Nível de Formação",
          description:
            "Usado para o filtro de Graduação/Mestrado/Doutorado/Pós-Doutorado",
          options: [
            { label: "Graduação", value: "graduacao" },
            { label: "Mestrado", value: "mestrado" },
            { label: "Doutorado", value: "doutorado" },
            { label: "Pós-Doutorado", value: "pos-doutorado" },
            { label: "Não informado", value: "outro" },
          ],
          defaultValue: "outro",
        }),
        bio: fields.text({
          label: "Bio",
          description: "Breve biografia da pesquisadora (2 a 4 frases)",
          multiline: true,
        }),
        instituicao: fields.text({
          label: "Instituição de Ensino",
          description: "Ex: Universidade de São Paulo (USP)",
        }),
        identidade_genero: fields.select({
          label: "Identidade de Gênero",
          options: [
            { label: "Mulher cis", value: "mulher-cis" },
            { label: "Mulher trans", value: "mulher-trans" },
            { label: "Homem cis", value: "homem-cis" },
            { label: "Homem trans", value: "homem-trans" },
            { label: "Não binário", value: "nao-binario" },
            { label: "Não informado", value: "nao-informado" },
          ],
          defaultValue: "nao-informado",
        }),
        raca_etnia: fields.select({
          label: "Raça/Etnia",
          description: "Autodeclaração, categorias do IBGE",
          options: [
            { label: "Branca", value: "branca" },
            { label: "Preta", value: "preta" },
            { label: "Parda", value: "parda" },
            { label: "Amarela", value: "amarela" },
            { label: "Indígena", value: "indigena" },
            { label: "Não informado", value: "nao-informado" },
          ],
          defaultValue: "nao-informado",
        }),
        localizacao: fields.text({
          label: "Localização",
          description: "Ex: São Paulo, SP",
        }),
        imagem: fields.text({
          label: "Imagem (URL)",
          description: "URL da foto de perfil",
        }),
        curriculo: fields.text({ label: "Currículo Lattes (URL)" }),
        researchgate: fields.text({ label: "ResearchGate (URL)" }),
        instagram: fields.text({ label: "Instagram" }),
        site_pessoal: fields.text({ label: "Site Pessoal (URL)" }),
        linkedin: fields.text({ label: "LinkedIn (URL)" }),
        orcid: fields.text({
          label: "ORCID",
          description: "Ex: 0000-0002-1825-0097 ou URL completa",
        }),
        data_sincronizacao: fields.text({
          label: "Última sincronização (automático)",
          description: "Preenchido automaticamente pelo sync do Google Sheets",
        }),
        gerenciado_pela_planilha: fields.checkbox({
          label: "Sincronizado da planilha (automático)",
          description:
            "Marcado automaticamente pelo sync do Google Sheets. Desmarque se quiser 'adotar' esta pesquisadora manualmente, impedindo que a sincronização automática a atualize ou remova.",
          defaultValue: false,
        }),
        campos_ocultos: fields.multiselect({
          label: "Ocultar campos no site público",
          description:
            "Marque os campos que NÃO devem aparecer no card desta pesquisadora, mesmo estando preenchidos",
          options: [
            { label: "Telefone", value: "telefone" },
            { label: "Bio", value: "bio" },
            { label: "Formação", value: "formacao" },
            { label: "Instituição de Ensino", value: "instituicao" },
            { label: "Identidade de Gênero", value: "identidade_genero" },
            { label: "Raça/Etnia", value: "raca_etnia" },
            { label: "Localização", value: "localizacao" },
            { label: "Email", value: "email" },
            { label: "Currículo Lattes", value: "curriculo" },
            { label: "ResearchGate", value: "researchgate" },
            { label: "Instagram", value: "instagram" },
            { label: "Site Pessoal", value: "site_pessoal" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "ORCID", value: "orcid" },
          ],
          defaultValue: [],
        }),
      },
    }),
  },
});
