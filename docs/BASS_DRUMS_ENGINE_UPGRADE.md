# Resolução e Upgrade: Motor de Baixo, Bateria "PÁ" e Isolamento de Modos

## 1. Problemas Identificados e Corrigidos

### 1.1 Baixo Não Funcionava
- **Frequências Inaudíveis**: Ajustado para oitavas 2 e 3 (65Hz–240Hz) com harmônicos superiores e saturação suave, tornando o baixo encorpado e audível tanto em alto-falantes de celular e notebook quanto em subwoofers.
- **Conflito no Tone.js (`AudioParam`)**: No `BassEngine`, a automação de corte (`cutoff`) concorria com o `filterEnvelope` interno do `MonoSynth`. Foi introduzido um `Tone.Filter` pós-síntese dedicado, garantindo varreduras e wobbles contínuos sem cliques ou interrupções de áudio.
- **Gatilhos de Mão Dupla**: O baixo agora responde tanto à mão direita (lead melódico, oitavas e filtro) quanto à mão esquerda (graus da escala e nota fundamental), e a ausência de uma mão não silencia mais a outra.
- **Strip Tátil de Notas na UI**: Adicionada no `BassControls` uma fita de 8 notas táteis (C2 a C3) para audição e teste instantâneo por clique/toque.

### 1.2 Caixa (Snare) Sem "PÁ" e Não Responsiva
- **Síntese da Caixa "PÁ"**:
  - Camada de transiente de baqueta (`snareTransient` com estalo seco de 5ms).
  - Corpo afinado percussivo (`snareBody` com pitch decay rápido em ~110Hz).
  - Esteira com ruído filtrado passa-banda (`snareNoise` + `snareFilter` entre 2.2kHz e 8.5kHz).
  - Novo controle de "SNAP / CRACK" na interface para regular a intensidade do "PÁ".
- **Máquina de Estados de Air-Drumming**:
  - Corrigido o travamento da máquina de estados (`STRUCK` -> `RECOILING` -> `ARMED`), que verificava apenas o eixo Z e ignorava batidas no eixo vertical Y.
  - Implementado recuo bidirecional rápido (Y e Z), permitindo rufos, batidas rápidas consecutivas e resposta instantânea em menos de 80ms.
- **Kit e Barramento Aprimorados**:
  - Bumbo com transiente de batedor e corpo sub.
  - Pratos e chimbal com filtro passa-alta eliminando ruído estático.
  - Palmas com textura de multi-burst flam de estúdio.
  - Compressor dedicado no barramento da bateria (`drumCompressor`) para cola e punch.

### 1.3 Isolamento Estrito de Modos
- Ao alternar entre a Bateria e instrumentos melódicos (ou vice-versa), todas as notas retidas são imediatamente silenciadas e os rastreadores de ar-drumming são rearmados.
- Cada modo opera isoladamente sobre a engine base unificada (`MasterAudioEngine`), garantindo que futuros ajustes em qualquer modo não interfiram nos demais.

## 2. Verificação Técnica
- `npx tsc --noEmit`: 0 erros.
- `npm run build`: Build de produção Vite concluído com sucesso.
- Limite de 500 linhas estritamente respeitado em todos os arquivos modificados.
