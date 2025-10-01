# Foi De Propósito (FDP) - Jogo Online

Um jogo de cartas online baseado no famoso "Foi De Propósito", desenvolvido em React. O jogo consiste em completar frases de forma engraçada e absurda para conquistar pontos e fazer todos rirem!

## 🎮 Como Jogar

### Objetivo
Ser o primeiro jogador a conquistar 5 pontos (configurável) completando frases de forma criativa e engraçada.

### Regras Básicas
1. **Distribua as cartas**: Cada jogador recebe 10 cartas de resposta (brancas)
2. **Escolha o FDP**: O primeiro "FDP" (Ficou De Propósito) é escolhido aleatoriamente
3. **Leia a pergunta**: O FDP lê uma carta de pergunta (preta) em voz alta
4. **Escolha respostas**: Todos os outros jogadores escolhem uma carta de resposta
5. **Vote na melhor**: O FDP escolhe a resposta mais engraçada/absurda
6. **Ganhe pontos**: O dono da resposta vencedora ganha 1 ponto
7. **Continue jogando**: O próximo FDP é o jogador à esquerda
8. **Vença o jogo**: Primeiro a fazer 5 pontos é o campeão!

### Modos de Jogo
- **Modo Normal**: 10 cartas por jogador, 5 pontos para vencer
- **Modo Fácil**: 12 cartas por jogador para mais opções
- **Modo Democrático**: Todos votam na melhor resposta (opcional)

## 🚀 Tecnologias Utilizadas

- **React 18** - Interface do usuário
- **Vite** - Build tool e desenvolvimento
- **Context API** - Gerenciamento de estado
- **CSS3** - Estilização e animações
- **JavaScript ES6+** - Lógica do jogo

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Lobby.jsx       # Tela inicial e criação de salas
│   ├── WaitingRoom.jsx # Sala de espera
│   ├── GameBoard.jsx   # Mesa principal do jogo
│   ├── PlayerHand.jsx  # Cartas do jogador
│   ├── SubmittedAnswers.jsx # Respostas submetidas
│   ├── Timer.jsx       # Cronômetro das rodadas
│   └── Scoreboard.jsx  # Placar e estatísticas
├── contexts/           # Context API
│   └── GameContext.jsx # Estado global do jogo
├── data/              # Dados do jogo
│   └── cards.js       # Cartas de pergunta e resposta
├── hooks/             # Hooks customizados
│   └── index.js       # Hooks utilitários
├── utils/             # Funções utilitárias
│   └── index.js       # Validações e helpers
└── styles/            # Arquivos CSS
```

## 🎯 Funcionalidades

### ✅ Implementadas
- **Lobby atrativo** com criação e entrada em salas
- **Sistema de salas** com códigos únicos
- **Mesa de jogo** similar a RPGs online
- **Gerenciamento de jogadores** (até 8 jogadores)
- **Sistema de cartas** com 90 perguntas e 352 respostas
- **Cronômetro por rodada** (configurável)
- **Placar em tempo real** com ranking
- **Validações completas** de jogadas
- **Interface responsiva** para mobile/desktop
- **Animações e feedbacks visuais**
- **Sistema de bots** para testes
- **Configurações personalizáveis**

### 🔄 Estados do Jogo
1. **LOBBY** - Tela inicial
2. **WAITING_FOR_PLAYERS** - Sala de espera
3. **PLAYING** - Jogadores escolhendo respostas
4. **ROUND_VOTING** - FDP escolhendo vencedor
5. **ROUND_RESULTS** - Mostrando resultado da rodada
6. **GAME_OVER** - Fim do jogo

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Passos
1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd fdp
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute em desenvolvimento**
```bash
npm run dev
```

4. **Acesse o jogo**
Abra http://localhost:5173 no navegador

### Build para Produção
```bash
npm run build
npm run preview
```

### Usando o Makefile (recomendado)

Para um fluxo de trabalho profissional, use os alvos do `Makefile`:

```bash
# ajuda auto-documentada
make help

# instalar dependências (detecta npm/yarn/pnpm)
make install

# desenvolvimento (porta padrão 5173; override com PORT=xxxx)
make dev PORT=5173 OPEN=true

# build e preview
make build
make preview PORT=5173

# qualidade
make lint
make lint-fix
make format

# inspeção de bundle e dependências
make analyze
make deps-audit
make deps-outdated

# utilitários
make check        # lint + build
make clean        # remove dist
make clean-all    # remove dist + node_modules
make port-check   # verifica porta
make port-who     # mostra processo na porta
make port-kill    # mata processo na porta (cuidado)
```

## 🎨 Design e UX

### Características Visuais
- **Gradientes modernos** em tons de roxo e azul
- **Cards com elevação** e efeitos hover
- **Animações suaves** em transições
- **Feedback visual** para todas as ações
- **Tipografia clara** e legível
- **Cores contrastantes** para acessibilidade

### Responsividade
- **Mobile-first** design
- **Breakpoints** para tablet e desktop
- **Touch-friendly** em dispositivos móveis
- **Otimizado** para diferentes tamanhos de tela

## 🔧 Configurações do Jogo

### Personalizáveis
- **Cartas por jogador**: 7-12 cartas
- **Pontos para vencer**: 3-7 pontos
- **Tempo por rodada**: 1-3 minutos ou sem limite
- **Máximo de jogadores**: 4-10 jogadores
- **Timer de votação**: Configurável

### Padrões
- 10 cartas por jogador
- 5 pontos para vencer
- 2 minutos por rodada
- 8 jogadores máximo
- 3 jogadores mínimo

## 🎲 Conteúdo do Jogo

### Cartas de Pergunta (90 total)
Frases com lacunas para serem completadas, como:
- "Meus pais se juntaram e fizeram uma saita nova que agora ______"
- "A melhor coisa sobre ter 18 anos é ______"
- "Se eu fosse presidente por um dia, eu ______"

### Cartas de Resposta (352 total)
Respostas absurdas e engraçadas para completar as frases:
- "Um pênis gigante"
- "Fazer cocô de pé"
- "Cheirar o próprio sovaco"
- E muitas outras opções hilárias!

## 🚨 Aviso de Conteúdo

⚠️ **ATENÇÃO: Conteúdo Adulto**
- Este jogo contém humor adulto e politicamente incorreto
- Recomendado apenas para maiores de 18 anos
- Pode conter linguagem ofensiva e temas sensíveis
- Destinado exclusivamente ao entretenimento entre amigos

## 🔮 Futuras Implementações

### Planejadas
- [ ] **Multiplayer online real** com WebSockets
- [ ] **Sistema de conta** e perfis
- [ ] **Salas privadas** com senhas
- [ ] **Chat em tempo real**
- [ ] **Cartas personalizadas** pelos usuários
- [ ] **Diferentes packs** de cartas temáticas
- [ ] **Sistema de conquistas**
- [ ] **Replay das melhores jogadas**
- [ ] **Integração com redes sociais**
- [ ] **Modo torneio**

### Melhorias Técnicas
- [ ] **Testes automatizados**
- [ ] **PWA** (Progressive Web App)
- [ ] **Offline mode**
- [ ] **Performance optimizations**
- [ ] **Bundle splitting**
- [ ] **CDN para assets**

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes
- Mantenha o código limpo e documentado
- Siga as convenções de nomenclatura
- Teste suas mudanças antes de submeter
- Inclua comentários em códigos complexos

## 📄 Licença

Este projeto é baseado no jogo original "Foi De Propósito" e foi criado apenas para fins educacionais e de entretenimento.

## 🏆 Créditos

- **Jogo Original**: Foi De Propósito (FDP)
- **Desenvolvedor**: Criado como projeto educacional
- **Inspiração**: Cards Against Humanity e similares
- **Framework**: React + Vite
- **Design**: CSS3 com animações customizadas

## 📞 Suporte

Se encontrar algum bug ou tiver sugestões:
- Abra uma issue no GitHub
- Descreva o problema detalhadamente
- Inclua screenshots se necessário
- Especifique navegador e versão

---

**Divirta-se jogando! 🎉**

*Lembre-se: o objetivo é se divertir com os amigos de forma responsável!*+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
