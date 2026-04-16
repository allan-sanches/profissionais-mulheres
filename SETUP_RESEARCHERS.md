# 📊 Portfólio de Pesquisadoras - Guia de Configuração

Este projeto integra Google Sheets (alimentado por Google Forms) com Astro para criar um portfólio dinâmico de pesquisadoras.

## 🚀 Início Rápido

### 1️⃣ Setup Google Cloud Project

#### Passo 1: Criar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/projectcreate)
2. Crie um novo projeto (ex: "Pesquisadoras Portfólio")
3. Aguarde a criação ser concluída

#### Passo 2: Habilitar APIs
1. No Cloud Console, vá para **APIs & Services** → **Enabled APIs and Services**
2. Clique em **+ ENABLE APIS AND SERVICES**
3. Procure por **"Google Sheets API"** → **Enable**
4. Procure por **"Google Drive API"** → **Enable**

#### Passo 3: Criar Service Account
1. Vá para **APIs & Services** → **Credentials**
2. Clique em **+ Create Credentials** → **Service Account**
3. Preencha:
   - **Service account name**: `researchers-sync`
   - **Service account ID**: auto-preenchido
   - **Description**: `Sincronização de Pesquisadoras`
4. Clique em **CREATE AND CONTINUE**
5. Na próxima tela, clique em **CONTINUE** novamente
6. Clique em **DONE**

#### Passo 4: Gerar Chave JSON
1. Clique na service account que acabou de criar
2. Vá para a aba **KEYS**
3. Clique em **Add Key** → **Create new key**
4. Escolha **JSON** e clique em **CREATE**
5. Um arquivo será baixado automaticamente - **GUARDE ESTE ARQUIVO COM SEGURANÇA**
6. Abra o arquivo JSON e copie:
   - `client_email`
   - `private_key`
   - `project_id`

### 2️⃣ Setup Google Sheets

#### Criar Planilha
1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha: **"Pesquisadoras"**
3. Crie as colunas (linha 1) exatamente como abaixo:
   ```
   Timestamp | Nome | Email | Telefone | Formação | Imagem | Currículo | ResearchGate | Instagram | Site Pessoal | Gênero | Localização
   ```

#### Configurar Google Form
1. Acesse [Google Forms](https://forms.google.com)
2. Crie um novo formulário: **"Cadastro de Pesquisadoras"**
3. Adicione campos correspondentes:
   - **Nome** (Texto curto)
   - **Email** (Email)
   - **Telefone** (Texto curto)
   - **Formação** (Texto longo)
   - **Imagem** (pode usar File upload ou texto com URL)
   - **Currículo Lattes** (URL)
   - **ResearchGate** (URL)
   - **Instagram** (Texto curto ou URL)
   - **Site Pessoal** (URL)
   - **Gênero** (Múltipla escolha: Masculino, Feminino, Outro)
   - **Localização** (Texto curto, ex: "São Paulo, SP, Brasil")

4. Na aba **RESPONSES**, conecte a planilha criada anteriormente

#### Compartilhar Planilha
1. Abra a planilha "Pesquisadoras"
2. Clique em **Share** (canto superior direito)
3. Cole o `client_email` da service account
4. Defina permissão como **Editor**
5. Clique em **Share**

#### Obter ID da Planilha
1. Na URL da planilha, copie o ID:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```
   O `SHEET_ID` é a parte entre `/d/` e `/edit`

### 3️⃣ Configurar Variáveis de Ambiente

#### Local (.env.local)
Crie um arquivo `.env.local` na raiz do projeto:

```env
GOOGLE_SHEET_ID=seu-sheet-id-aqui
GOOGLE_CLIENT_EMAIL=seu-email@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSuaChavePrivadaAqui\n-----END PRIVATE KEY-----\n"
ADMIN_TOKEN=gere-um-token-aleatorio-seguro-aqui
```

**Como gerar ADMIN_TOKEN:**
```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Vercel (produção)
1. No painel da Vercel do seu projeto
2. Vá para **Settings** → **Environment Variables**
3. Adicione as mesmas variáveis:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `ADMIN_TOKEN`

⚠️ **Importante:** Para `GOOGLE_PRIVATE_KEY`, copie exatamente como está no JSON, incluindo as quebras de linha (`\n`)

### 4️⃣ Instalar Dependências

```bash
# Instale as dependências
npm install

# Ou, se usar pnpm (recomendado)
pnpm install
```

### 5️⃣ Testar Sincronização Local

```bash
# Execute o script de sincronização
npm run sync:researchers

# Você verá output como:
# ✅ Authenticated with Google Sheets API
# 📊 Fetched X rows from Google Sheet
# ✅ Processed X valid researchers
# ✅ Saved X researchers to src/content/researchers.json
```

Se receber erro de autenticação, verifique:
- `GOOGLE_SHEET_ID` está correto
- `GOOGLE_CLIENT_EMAIL` foi compartilhado com a planilha
- `GOOGLE_PRIVATE_KEY` tem as quebras de linha corretas

### 6️⃣ Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse:
- **Portfólio:** http://localhost:3000/researchers
- **Admin:** http://localhost:3000/admin/researchers (use seu ADMIN_TOKEN)

### 7️⃣ Setup GitHub Actions (Sincronização Automática)

1. Commit e push seu código (com `.env.example`, não `.env.local`):
   ```bash
   git add .
   git commit -m "setup: configure researchers integration"
   git push
   ```

2. No repositório GitHub, vá para **Settings** → **Secrets and variables** → **Actions**

3. Adicione os **Secrets** (mesmas variáveis que em `.env.local`):
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - Não precisa adicionar `ADMIN_TOKEN` (não é usado no workflow)

4. O workflow automático vai fazer sync toda **segunda-feira às 00:00 UTC**

5. Para sincronizar manualmente:
   - Vá para **Actions** → **Sync Researchers Weekly** → **Run workflow**

---

## 📱 Usando a Plataforma

### Para Pesquisadoras (Preenchendo o Formulário)

1. Abra o link do Google Form compartilhado
2. Preencha todos os campos:
   - **Nome**: Nome completo
   - **Email**: Email válido
   - **Telefone**: Com DDD (ex: 11987654321)
   - **Formação**: Pós-Doutorado em Biologia, etc.
   - **Imagem**: Envie uma foto de perfil (recomenda-se 500x500px)
   - **Links**: Cole URLs dos seus perfis acadêmicos
   - **Gênero**: Selecione
   - **Localização**: Cidade, Estado, País

3. Envie o formulário

### Para Administradores

#### Sincronizar Manualmente
1. Acesse `seu-dominio.com/admin/researchers`
2. Digite seu **ADMIN_TOKEN**
3. Clique em **🚀 Sincronizar Agora**
4. Aguarde a conclusão
5. Atualize `/researchers` para ver as novas pesquisadoras

#### Sincronização Automática
- O sistema sincroniza automaticamente **toda segunda-feira**
- Commits são feitos automaticamente se houver mudanças
- Deploy no Vercel é acionado automaticamente após commit

---

## 🎨 Personalizações

### Adicionar Mais Campos

1. Edite [src/content.config.ts](src/content.config.ts):
   ```typescript
   const researchers = defineCollection({
     // ...
     schema: z.object({
       // ... campos existentes ...
       seu_novo_campo: z.string().optional(),
     })
   });
   ```

2. Edite [src/scripts/sync-researchers.ts](src/scripts/sync-researchers.ts):
   ```typescript
   const COLUMN_MAP: Record<number, string> = {
     // ... mapeamentos existentes ...
     12: "seu_novo_campo", // Adicione a coluna (0-indexed)
   };
   ```

3. Atualize o formulário Google e a planilha

### Customizar Layout

- **Grid de pesquisadoras:** [src/pages/researchers/index.astro](src/pages/researchers/index.astro)
- **Admin panel:** [src/pages/admin/researchers.astro](src/pages/admin/researchers.astro)

### Mudar Frequência de Sync Automático

Edite [.github/workflows/sync-researchers.yml](.github/workflows/sync-researchers.yml):

```yaml
on:
  schedule:
    # Mudar esta linha (cron format):
    - cron: "0 0 * * 1"  # Segunda aos 00:00 UTC
    # Exemplos:
    # - cron: "0 * * * *"     # A cada hora
    # - cron: "0 0 * * 0"     # Domingo aos 00:00
    # - cron: "0 0 1 * *"     # 1º dia do mês
```

---

## 🐛 Troubleshooting

### "Cannot find module 'astro:content'"
```bash
astro sync
```

### Erro de Autenticação Google
- ✅ Verifique se a string `GOOGLE_PRIVATE_KEY` tem quebras de linha corretamente
- ✅ Confirme que compartilhou a planilha com `GOOGLE_CLIENT_EMAIL`
- ✅ Verifique que ambas as APIs estão habilitadas

### Imagens não aparecem
- ✅ Confirme que compartilhou as imagens no Google Drive com acesso público
- ✅ Use o **file ID** do Drive (encontre na URL: `/d/{FILE_ID}/`)
- ✅ Verifique a pasta `/public/researchers/images/` localmente

### Admin token não funciona
```bash
# Regenere um novo token:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Atualize em .env.local e Vercel Secrets
```

### Sync não roda no GitHub Actions
1. Vá para **Actions** → verifique o histórico
2. Clique no workflow falhado para ver os logs
3. Confirme que os Secrets estão configurados corretamente
4. Verifique se `GOOGLE_PRIVATE_KEY` tem `\n` e não quebras de linha reais

---

## 📚 Referências

- [Google Sheets API](https://developers.google.com/sheets)
- [Google Drive API](https://developers.google.com/drive)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎉 Pronto!

Seu portfólio de pesquisadoras está configurado! 🚀

Dúvidas? Revise este guia ou entre em contato com a equipe.
