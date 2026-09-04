# Upgrade: Layout Mobile Retrato (9:16) com Seletor Horizontal e Abas

## 1. Contexto e Motivação
No modo mobile vertical (portrait), o layout anterior apresentava restrições:
- O palco da câmera/HUD possuía altura fixa restrita (`h-[320px]`), limitando a área vertical para gestos de modulação de altura/pitch e acordes.
- Os 5 botões de instrumentos estavam confinados em um grid de 5 colunas em telas estreitas, causando corte/truncamento dos nomes dos botões.
- Os decks de controladores e o arranger de tracks ficavam empilhados linearmente, gerando scroll excessivo.

## 2. Implementações Realizadas

### 2.1 Palco da Câmera Vertical em Proporção Quase 9:16
- Ajustado o container da câmera/HUD para proporção retrato vertical (`aspect-[9/15]` / `aspect-[9/14]`) com altura máxima flexível (`max-h-[calc(100svh-175px)]`).
- Proporciona amplo espaço para o sensor óptico (MediaPipe) enquadrar mãos em diferentes alturas e distâncias.

### 2.2 Seletor de Instrumentos em Scroll Horizontal com Botões Padronizados
- Barra dedicada em scroll horizontal (`overflow-x-auto custom-scrollbar`).
- Todos os 5 botões de instrumentos (`SYNTH`, `GUITAR`, `BASS`, `DRUMS`, `VOICE`) possuem dimensões estritamente idênticas (`w-[120px] min-w-[120px] h-[46px]`).
- Ícones e rótulos 100% legíveis e preservados sem nenhum corte de texto (`whitespace-nowrap`).

### 2.3 Sistema de Abas Duplas Símétricas no Scroll Vertical
- Ao rolar a tela para baixo, o usuário tem acesso a um seletor de abas simétrico de 44px:
  - **Aba CONTROLADORES**: Seletor de Tom (Root Key), Escala Musical e o deck de controle do instrumento ativo (via `InstrumentRack` com `showSwitcher={false}`).
  - **Aba TRACKS**: Mixer multitrack móvel (`MobileTrackArranger`), permitindo gerenciamento de stems, faders de volume em dB, mute, solo, arm e looper.

## 3. Arquivos Modificados
- [MobileLayout.tsx](file:///d:/Projetos/synth_gest/src/components/layout/MobileLayout.tsx): Estruturação do viewport quase 9:16, scroll horizontal padronizado e abas de console.
- [InstrumentRack.tsx](file:///d:/Projetos/synth_gest/src/components/instruments/InstrumentRack.tsx): Adição do prop `showSwitcher?: boolean` para evitar duplicação de seletor no mobile mantendo o desktop intacto.

## 4. Verificação de Integridade
- `npx tsc --noEmit`: 0 erros.
- `npm run build`: Build de produção Vite concluído com sucesso (0 erros).
- Limite estrito de 500 linhas por arquivo respeitado.
