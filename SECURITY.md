# Segurança do Evully

Este documento descreve o modelo de segurança do Evully e as regras que
todo código deve seguir. Ele complementa a especificação no
[README](README.md).

## 1. Modelo de ameaças (Fase 1 — desktop local)

O Evully é um aplicativo offline que guarda dados pessoais e de saúde no
computador do usuário. As proteções têm três objetivos:

| Objetivo | Ameaças consideradas |
|---|---|
| **Proteger o computador contra o app** | Conteúdo malicioso obtendo acesso a Node, arquivos ou processos por meio do renderer. |
| **Proteger os dados** | Perda, corrupção, vazamento em logs/backups, mistura entre perfis, arquivos maliciosos na restauração. |
| **Proteger o código e a distribuição** | Instalador ou arquivos do app adulterados; dependências comprometidas; segredos no repositório. |

Fora de escopo na Fase 1:

- **Perfis não são uma barreira de segurança.** Eles separam os dados,
  mas não possuem senha. Quem tem acesso à conta do Windows tem acesso a
  todos os perfis. Um PIN opcional poderá ser avaliado no futuro.
- Ataques de quem já tem controle administrativo da máquina.

## 2. Camadas de proteção

### 2.1 Electron

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Content Security Policy restrita: apenas recursos locais do app; sem
  `unsafe-eval`; nenhuma origem remota.
- Navegação bloqueada (`will-navigate`) e abertura de janelas negada
  (`setWindowOpenHandler`). Links externos, quando existirem, abrem no
  navegador padrão somente após validação da URL.
- DevTools desabilitado no build de produção.
- **Electron Fuses** no build empacotado (os testes usam o binário de
  desenvolvimento, onde `RunAsNode` continua disponível):
  - `RunAsNode` desligado;
  - `EnableNodeOptionsEnvironmentVariable` desligado;
  - `EnableNodeCliInspectArguments` desligado;
  - `EnableEmbeddedAsarIntegrityValidation` ligado;
  - `OnlyLoadAppFromAsar` ligado.
- Electron mantido em versão suportada, com atualização a cada versão do
  Evully.

### 2.2 IPC

- Apenas os canais declarados no mapa tipado (`apps/desktop/src/shared/`).
- Toda entrada é validada com zod no processo main, mesmo que o renderer
  já tenha validado.
- A origem da chamada (`event.senderFrame`) é conferida.
- Não existe canal genérico para executar SQL, ler/gravar arquivos
  arbitrários ou executar comandos.
- Respostas de erro contêm apenas código e mensagem; stack traces ficam
  no log.

### 2.3 Banco de dados e arquivos

- Somente queries parametrizadas via Kysely. É proibido montar SQL
  concatenando valores.
- Toda consulta de dados pessoais filtra por `profile_id` no repositório,
  com testes de isolamento entre perfis.
- Acesso a arquivos restrito ao diretório de dados do app ou a caminhos
  escolhidos pelo usuário em diálogo do sistema.
- Restauração de backup (V0.7): validar `manifest.json`, `sha256`,
  `PRAGMA integrity_check` e rejeitar entradas do zip com caminhos
  absolutos ou `..` (zip slip).
- Backups nunca sobrescrevem arquivos sem confirmação.
- A única exclusão física é "Apagar perfil definitivamente", que exige
  confirmação digitada e cria backup antes (README, §8.3.1).
- Desenvolvimento usa diretório de dados separado (`Evully-dev`); seed e
  testes nunca tocam nos dados reais.

### 2.4 Dados em repouso

- V0.1: dados em `%APPDATA%\Evully`, protegidos pelas permissões da conta
  do Windows, sem criptografia própria.
- Antes do Evully Health (V1.4) ou de fotos de progresso, decidir sobre
  criptografia do banco (ex.: SQLCipher) e dos arquivos de fotos.

### 2.5 Segredos

- Nenhum segredo no repositório. Arquivos `.env*` são ignorados pelo git.
- Chaves de API (V1.5) são guardadas com `safeStorage` do Electron e
  nunca chegam ao renderer, ao SQLite em texto puro ou aos logs.

### 2.6 Logs

- Gravados com electron-log em `%APPDATA%\Evully\logs`, com rotação.
- Não registram dados pessoais: nomes, pesos, medidas, exames, notas,
  respostas de questionários e, no futuro, dados de ciclo menstrual.
  Registram apenas eventos, códigos de erro e IDs técnicos.

### 2.7 Dependências (cadeia de suprimentos)

- `package-lock.json` versionado; instalação no CI com `npm ci`.
- Versões fixadas; atualização deliberada e revisada.
- `npm audit` no CI; alertas do Dependabot ativados no GitHub.
- Antes de adicionar um pacote: verificar manutenção, popularidade,
  scripts de instalação e licença.
- Verificação automática de licenças no CI. Licenças copyleft fortes
  (GPL, AGPL, SSPL) são bloqueadas por serem incompatíveis com a licença
  proprietária do Evully.
- Avisos de licença de terceiros mantidos em `THIRD_PARTY_NOTICES`.

### 2.8 Distribuição

- Instalador publicado junto com o hash SHA-256.
- Atualização automática (desde a 0.5.0-alpha.3, README §33):
  - somente via HTTPS, do repositório público só de releases
    `lbcamargo94/evully-releases`; nenhum token no app;
  - o `electron-updater` confere o sha512 do `latest.yml`; além disso, cada
    instalador tem uma **assinatura Ed25519 própria** (`.sig`) sobre
    `evully-update:v1:<versão>:<sha512>`, conferida com a chave pública
    embutida no app. Sem assinatura válida, a atualização não é instalada;
  - a chave privada fica só no computador de quem publica
    (`%USERPROFILE%\.evully\update-signing-key.pem`), fora do repositório,
    com cópia de segurança; perdê-la exige uma instalação manual com chave nova;
  - instala só atualização já baixada e verificada: quando a pessoa pede ou
    ao fechar o app, sempre depois do backup de fechamento; sem downgrade;
  - procura versões só ao abrir e no botão "Verificar atualizações";
  - o renderer só pode pedir "verificar" e "instalar"; nenhuma URL ou
    caminho vem dele; os logs registram só versão e a primeira linha do erro.
- Assinatura de código (Authenticode) avaliada na V1.0. Sem ela, o
  Windows SmartScreen exibe aviso na instalação.

### 2.9 Repositório

- Repositório privado no GitHub.
- Branch `main` protegida quando o plano do GitHub permitir (em
  repositórios privados, regras de proteção exigem plano pago); até lá,
  mudanças relevantes via pull request por disciplina.
- Autenticação em dois fatores obrigatória na conta do titular.

## 3. Checklist por versão

Antes de concluir qualquer versão:

- [ ] Nenhum canal IPC novo sem schema zod e teste.
- [ ] Nenhuma query nova sem filtro de `profile_id` (quando pessoal) e
      sem teste de isolamento.
- [ ] Nenhum dado pessoal em logs.
- [ ] `npm audit` sem vulnerabilidades altas ou críticas sem justificativa.
- [ ] Verificação de licenças aprovada e `THIRD_PARTY_NOTICES` atualizado
      (`npm run notices`; o CI roda `notices:check`).
- [ ] Build de produção com DevTools desligado e fuses aplicados.

## 4. Fases futuras

Na Fase 2 (web) entram autenticação, autorização por recurso,
criptografia em trânsito (TLS), proteção contra OWASP Top 10, rate
limiting, gestão de segredos no servidor, auditoria e conformidade com a
LGPD (ver README, §27). Este documento será ampliado antes do início da
Fase 2.

## 5. Como reportar uma vulnerabilidade

Não abra issue pública. Envie os detalhes para **lb.camargo94@gmail.com**.
