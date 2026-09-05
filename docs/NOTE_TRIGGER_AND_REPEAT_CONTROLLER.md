# Sistema de Articulação: Modo Nota Única (Disparo por Gesto) & Controlador de Velocidade de Repetição

## 1. Visão Geral
Implementação do sistema de articulação gestual para o estúdio **GutoSynth**, introduzindo:
- **Modo Nota Única (`single` / One-Shot)**: Ao levantar os dedos da mão (ou alterar o acorde/nota), dispara uma nota pontual com ataque e release controlados, encerrando a nota sem sustentar som contínuo infinito (drone).
- **Modo Repetição (`repeat` / Note Retrigger)**: Repete notas de forma rítmica enquanto os dedos permanecem no ar, com velocidade controlada pelo usuário.
- **Controlador de Velocidade de Repetição**: Seletor de subdivisões rítmicas (`1/4`, `1/8`, `1/16`, `1/32`) sincronizadas com o BPM do Looper, além de slider contínuo de frequência em Hz (`1.0 Hz` a `20.0 Hz`) e controle de `Gate / Duração` da nota (`50ms` a `800ms`).

---

## 2. Modos de Operação

| Modo | Comportamento Gestual | Aplicação Típica |
| :--- | :--- | :--- |
| **CONTÍNUO** | Sustenta as notas continuamente com legato portamento enquanto os dedos estiverem levantados. | Solos com glide, pads e ambient drones. |
| **NOTA ÚNICA** | Ao levantar os dedos da mão ou mudar a nota na escala, toca **uma nota só** com duração definida e cessa o som. | Execução staccato, teclados percussivos e dedilhados. |
| **REPETIÇÃO** | Ao manter os dedos erguidos, re-dispara a nota ritmicamente na velocidade definida. | Arpejos rápidos, pulsos de synth e rolos de baixo. |

---

## 3. Mapeamento dos Controles

- **Console Central no InstrumentRack**: Localizado diretamente abaixo da seleção de Tom/Escala, visível tanto em Desktop quanto Mobile.
- **Subdivisões Sincronizadas**:
  - `1/4`: Semínima (1 pulso por tempo)
  - `1/8`: Colcheia (2 pulsos por tempo)
  - `1/16`: Semicolcheia (4 pulsos por tempo)
  - `1/32`: Fusa (8 pulsos por tempo)
- **Frequência Fina (Hz)**: Ajuste contínuo de 1 Hz a 20 Hz exibindo tempo de ciclo em milissegundos.
- **Gate / Duração**: Ajuste de 50ms (staccato curto) a 800ms (nota encorpada).

---

## 4. Arquivos Modificados & Criados
- `src/types/audio.ts`: Tipos `TriggerMode`, `RepeatSubdivision` e `TriggerSettings`.
- `src/audio/instruments/PolySynthEngine.ts`: Métodos `triggerSingleNote` e `triggerChordSingle`.
- `src/audio/GestureAudioDispatcher.ts`: Módulo de despacho de áudio modular para Lead e Harmonia.
- `src/hooks/useHandTracking.ts`: Lógica de detecção de elevação dos dedos e despacho de repetição.
- `src/components/instruments/InstrumentRack.tsx`: Painel de controle tátil com seletor de 3 estados e sliders.
- `src/components/layout/DesktopLayout.tsx`: Encaminhamento de propriedades reativas.
- `src/components/layout/MobileLayout.tsx`: Suporte responsivo total em modo retrato.
- `src/App.tsx`: Estado centralizado e sincronização de BPM.
