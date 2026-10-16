# 🎮 GDD — Neon Zenith: Tower of Light

**Nome Comercial**: Neon Zenith: Tower of Light (Inédito e Inovador)  
**Gênero / Estilo**: Parkour 3D / Obby  
**Plataforma Alvo**: CrazyGames (HTML5 / WebGL)  
**URL de Entrega / Produção**: [https://neonzenithtoweroflight.kinomuse.com.br](https://neonzenithtoweroflight.kinomuse.com.br)  
**Stack Tecnológica**: Godot Engine 4.7.2 (GDScript 2.0)  
**Data de Concepção**: 16/10/2026 00:30  
**Arquiteta Mestre de Criação**: Esmeralda (GLX Agent)  

---

## 🌟 1. Identidade de Marca & Introdução Obrigatória
1. **Intro FluidCleb Interactive (0.0s a 2.8s)**:
   - Splash Screen procedural obrigatória em Canvas idêntica aos títulos de referência (*Sobrevivente da Névoa* e *Hydrologic*).
   - Orbes de energia azul subindo (`#00f5ff`, `#38bdf8`, `#0284c7`), fusão central com áudio sintético procedural (`playFluidClebIntro()`), emblema da gota d'água metálica (`#94a3b8` / `#0284c7`), logo em neon `FLUIDCLEB` (38px) e subtítulo `INTERACTIVE` (13px), com barra de progresso suave.
2. **Apresentação em Animação Realista (Intro Narrativa / Lore Interativa)**:
   - Exibida imediatamente após a Splash Screen da FluidCleb.
   - Animação cinematográfica procedural em Canvas com partículas volumétricas, feixes de luz e transição dramática que narra os 3 atos da Lore em até 5 segundos com botões 'Continuar ➔' e 'Pular História'.

---

## 📖 2. Lore, Ambientação & Premissa
Em uma megalópole vertical onde o solo é esquecido, corredores de elite escalam torres de dados quânticos para restaurar o fluxo de energia da rede central antes do colapso digital.

---

## ⚡ 3. Core Gameplay Loop & Controles
1. Selecionar fase nos cards visuais -> 2. Iniciar escalada com controles responsivos de precisão -> 3. Superar obstáculos dinâmicos (lasers, plataformas móveis) mantendo o momentum -> 4. Atingir o topo para coletar estrelas e destravar bônus -> 5. Opcional: Assistir anúncio premiado para dobrar recompensas ou tentar novamente instantaneamente.

---

## 🧩 4. Módulos & Features Aprovados para o Jogo
- **Arquitetura Desacoplada EventBus.gd (UI independente)**
- **Menu de Seleção de Fases com Cards Visuais e 3 Estrelas (Regra 10)**
- **Game Feel: Screen Shake com Trauma² e Squash & Stretch**
- **Conformidade CrazyGames SDK v3 (gameplay_start, stop e happy_time)**
- **Save Game Atômico Anti-Corrupção (user://save_temp.json)**
- **Injeção de Módulo: JuiceCamera2D.gd**
- **Injeção de Módulo: HitStopManager.gd**
- **Injeção de Módulo: SquashStretch2D.gd**
- **Injeção de Módulo: EventBus.gd**

---

## 💰 5. Estratégia de Monetização e Requisitos Oficiais CrazyGames
Rewarded Ad 1: Continuar partida (+30 segundos ou reviver com escudo). Rewarded Ad 2: Dobrar moedas ou recursos coletados ao concluir fase.

### Requisitos Obrigatórios de Publicação CrazyGames (Docs Oficiais):
1. **Gameplay (Land in Gameplay & Física)**:
   - O jogador deve cair na ação em no máximo 1 clique (Play / Pular História direto na partida).
   - Física e movimentação com `deltaTime` (fixed timestep) consistente em 60Hz, 144Hz e 165Hz.
   - Proibido qualquer botão customizado de Fullscreen dentro do canvas (CrazyGames já fornece nativamente).
   - Localização em Inglês (EN) por padrão, com seletor/detecção PT-BR. PEGI 12.
2. **Técnico (Tamanho & Caminhos)**:
   - Bundle inicial ≤ 50MB (≤ 20MB para qualificar para mobile), total ≤ 250MB, máximo 1500 arquivos.
   - Caminhos estritamente relativos no build (`base: './'`), tempo de carga ≤ 20s.
3. **Anúncios & SDK v3 (CrazyGames Ads)**:
   - Chamadas de ciclo `gameplayStart()` e `gameplayStop()`.
   - Mute de áudio e pausa de jogo obrigatórios durante anúncios (`adStarted` -> mudo/pausa; `adFinished`/`adError` -> desmuta/retoma).
   - Rewarded Ads com ícone de vídeo, botão de recusar com mesma visibilidade; se der `adError` (AdBlock), NUNCA premiar.
   - Nunca disparar Midgame Ads durante gameplay ativa.

---

## 🛡️ 6. Protocolo de Validação de Qualidade por Subagentes Especializados (QA)
- **Subagente 1 (Mecânica & Fluidez)**: Validação de 60 FPS constantes, física sem travamentos, movimentação precisa, colisão e conformidade com monitores de alta taxa de quadros (144Hz/165Hz).
- **Subagente 2 (Jogabilidade & CrazyGames SDK)**: Validação de interface/HUD responsiva sem sobreposição, efeitos visuais nítidos, localização em inglês e conformidade total com os requisitos oficiais do CrazyGames SDK v3 (mute em ads, pause, land in gameplay).
- **Subagente 5 (Meta-Game & Economia de Recompensas)**: Validação obrigatória de camadas completas de progressão e retenção: Daily Login Reward (7 dias), Missões Diárias/Semanais com Rewarded Ad para dobrar moedas, 12 a 20 fases com 3 estrelas, Loja de Cosméticos/Upgrades e Roleta da Sorte a cada 12h.

---

## 💎 7. Metodologia Rian — Padrão Inviolável de Produção (Anti-Protótipo Cru)
Todo o desenvolvimento deve seguir rigorosamente os 6 pilares da Metodologia Rian:
1. **HUD Completo e Responsivo**: Barra de progresso de fase, pontuação, vidas/tentativas e indicador de nível sempre visíveis em qualquer proporção (desktop e mobile).
2. **Menu Sobreposto e Estados de Jogo**: Menu inicial com botão de iniciar, tela de pausa funcional, e telas dedicadas de vitória e derrota com opção de reiniciar instantaneamente sem recarregar a página (anti-reload).
3. **Sistemas de Recompensa e Progressão**: Feedback visual dinâmico (partículas, combos, squash & stretch) e sonoro (Web Audio) para conquistas, ganho de pontos e avanço de fases.
4. **Redimensionamento Robusto**: Canvas ou layout adaptativo gerenciado por ResizeObserver com devicePixelRatio que redimensiona fluidamente na janela sem cortar controles nem quebrar elementos.
5. **Rodapé e Link Oficial**: Inclusão mandatória de rodapé discreto ou botão persistente contendo link de redirecionamento para a plataforma oficial em https://kinomuse.com.br.
6. **Validação e Execução de Produção**: Código gerado 100% completo, limpo, modular e pronto para produção, sem stubs vazios, sem // TODO e sem dependências faltando.
