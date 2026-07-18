<p align="center">
  <a href="https://igris.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Logo do Igris">
    </picture>
  </a>
</p>
<p align="center">O agente de programação com IA de código aberto.</p>
<p align="center">
  <a href="https://igris.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/igris-ai"><img alt="npm" src="https://img.shields.io/npm/v/igris-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/igris/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/igris/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![Igris Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://igris.ai)

---

### Instalação

```bash
# YOLO
curl -fsSL https://igris.ai/install | bash

# Gerenciadores de pacotes
npm i -g igris-ai@latest        # ou bun/pnpm/yarn
scoop install igris             # Windows
choco install igris             # Windows
brew install anomalyco/tap/igris # macOS e Linux (recomendado, sempre atualizado)
brew install igris              # macOS e Linux (fórmula oficial do brew, atualiza menos)
sudo pacman -S igris            # Arch Linux (Stable)
paru -S igris-bin               # Arch Linux (Latest from AUR)
mise use -g igris               # qualquer sistema
nix run nixpkgs#igris           # ou github:anomalyco/igris para a branch dev mais recente
```

> [!TIP]
> Remova versões anteriores a 0.1.x antes de instalar.

### App desktop (BETA)

O Igris também está disponível como aplicativo desktop. Baixe diretamente pela [página de releases](https://github.com/anomalyco/igris/releases) ou em [igris.ai/download](https://igris.ai/download).

| Plataforma            | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `igris-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `igris-desktop-mac-x64.dmg`     |
| Windows               | `igris-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm` ou AppImage         |

```bash
# macOS (Homebrew)
brew install --cask igris-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/igris-desktop
```

#### Diretório de instalação

O script de instalação respeita a seguinte ordem de prioridade para o caminho de instalação:

1. `$IGRIS_INSTALL_DIR` - Diretório de instalação personalizado
2. `$XDG_BIN_DIR` - Caminho compatível com a especificação XDG Base Directory
3. `$HOME/bin` - Diretório binário padrão do usuário (se existir ou puder ser criado)
4. `$HOME/.igris/bin` - Fallback padrão

```bash
# Exemplos
IGRIS_INSTALL_DIR=/usr/local/bin curl -fsSL https://igris.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://igris.ai/install | bash
```

### Agents

O Igris inclui dois agents integrados, que você pode alternar com a tecla `Tab`.

- **build** - Padrão, agent com acesso total para trabalho de desenvolvimento
- **plan** - Agent somente leitura para análise e exploração de código
  - Nega edições de arquivos por padrão
  - Pede permissão antes de executar comandos bash
  - Ideal para explorar codebases desconhecidas ou planejar mudanças

Também há um subagent **general** para buscas complexas e tarefas em várias etapas.
Ele é usado internamente e pode ser invocado com `@general` nas mensagens.

Saiba mais sobre [agents](https://igris.ai/docs/agents).

### Documentação

Para mais informações sobre como configurar o Igris, [**veja nossa documentação**](https://igris.ai/docs).

### Contribuir

Se você tem interesse em contribuir com o Igris, leia os [contributing docs](./CONTRIBUTING.md) antes de enviar um pull request.

### Construindo com Igris

Se você estiver trabalhando em um projeto relacionado ao Igris e estiver usando "igris" como parte do nome (por exemplo, "igris-dashboard" ou "igris-mobile"), adicione uma nota no README para deixar claro que não foi construído pela equipe do Igris e não é afiliado a nós de nenhuma forma.

---

**Junte-se à nossa comunidade** [Discord](https://discord.gg/igris) | [X.com](https://x.com/igris)
