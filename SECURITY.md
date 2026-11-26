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
- **Lembretes (V1.4):** a notificação do Windows mostra só o nome do perfil e
  o assunto, nunca números dos registros (ela aparece sobre outras janelas e
  na tela de bloqueio). Clicar nela guarda a tela pedida no processo main,
  que a janela lê uma vez; nenhuma rota ou caminho vem do renderer. Uma só
  instância por pasta de dados. "Iniciar com o Windows" vem desligado, só o
  app instalado se registra, e o único argumento é `--hidden`.

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
  `PRAGMA integrity_check` e versão do schema; o zip só pode conter
  `evully.db` e `manifest.json`, o que rejeita caminhos absolutos ou `..`
  (zip slip). O banco é extraído para a pasta temporária privada do app e
  aberto só para leitura; a tela nunca envia caminhos (README, §14.2).
- Banco danificado (1.0.0-alpha.2): verificado com `PRAGMA quick_check`
  antes de abrir; se falhar, o app sobe só os canais de informação, logs e
  restauração (os outros respondem `app.recovery_mode`) e guarda uma cópia do
  arquivo danificado antes de qualquer troca, sem nunca apagá-lo
  (README, §14.2.1).
- "Abrir pasta de logs" abre só a pasta do log do app, calculada no processo
  principal; a tela não envia caminhos.
- Backups nunca sobrescrevem arquivos sem confirmação.
- Exportação (V0.7): só o perfil pedido (consultas por `profile_id` ou pelo
  registro pai, com teste de isolamento); o caminho vem do diálogo de salvar
  no processo principal; nos CSVs, texto iniciado por `=`, `+`, `-`, `@`
  ganha `'` na frente contra injeção de fórmulas (README, §14.3).
- Transferência de perfil (V0.7): o zip só pode conter `profile.json` e
  `manifest.json` (nada é extraído para o disco), limite de 200 MB, `sha256`
  conferido. Tabelas e colunas só entram se o próprio banco as reporta
  (`pragma_table_info`), os valores vão como parâmetros, toda linha precisa
  ser do perfil do manifesto e a gravação é uma transação, com backup antes
  de substituir (README, §14.4).
- A única exclusão física é "Apagar perfil definitivamente", que exige
  confirmação digitada e cria backup antes (README, §8.3.1).
- Desenvolvimento usa diretório de dados separado (`Evully-dev`); seed e
  testes nunca tocam nos dados reais. Os testes ponta a ponta indicam uma
  pasta vazia por `EVULLY_DATA_DIR`, que o app instalado ignora
  (`app.isPackaged`); os testes ficam fora do instalador.

### 2.4 Dados em repouso

- V0.1: dados em `%APPDATA%\Evully`, protegidos pelas permissões da conta
  do Windows, sem criptografia própria.
- Evully Health (V1.5, decidido em 26/11/2026): sem criptografia própria do
  banco nesta versão, como o resto dos dados; a área começa desligada em
  cada perfil, os exames ficam fora dos logs e da telemetria e só saem na
  exportação com a opção "Incluir exames de saúde" marcada (o backup e a
  transferência de perfil os levam). A criptografia (ex.: SQLCipher, com a
  chave protegida pelo Windows) volta a ser avaliada na Fase 2, quando o
  backup e a transferência puderem ter senha. Fotos de progresso: decidir
  antes de implementá-las ([README.md](README.md), §24).

### 2.5 Segredos

- Nenhum segredo no repositório. Arquivos `.env*` são ignorados pelo git.
- Chaves de API (V1.6) são guardadas com `safeStorage` do Electron e
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
- Sem assinatura de código (Authenticode) na Fase 1 (README §33): o
  Windows SmartScreen avisa na primeira instalação; as atualizações seguintes
  são instaladas pelo app só com a assinatura Ed25519 válida. Rever antes da
  Fase 3.

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
- [ ] `npm run lint` aprovado, incluindo as fronteiras de `application/` e
      `ports/` ([ARCHITECTURE.md](ARCHITECTURE.md), §8).
- [ ] `npm run e2e` aprovado; `EVULLY_DATA_DIR` continua ignorado no app
      instalado (§2.3).

## 4. Fases futuras

Na Fase 2 (web) entram autenticação, autorização por recurso,
criptografia em trânsito (TLS), proteção contra OWASP Top 10, rate
limiting, gestão de segredos no servidor, auditoria e conformidade com a
LGPD (ver README, §27). Este documento será ampliado antes do início da
Fase 2.

## 5. Como reportar uma vulnerabilidade

Não abra issue pública. Envie os detalhes para **lb.camargo94@gmail.com**.
