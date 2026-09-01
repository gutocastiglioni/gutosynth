# CONTRATO IMUTÁVEL DE ROBUSTEZ: RECONHECIMENTO GESTUAL & ÁUDIO
**STATUS:** TRANCADO / DEFINITIVO (NÃO MODIFICAR OU REESCREVER)
**PROJETO:** SYNTH GEST (Minority Report Spatial Music Engine)

---

## 🛑 MANDATO DE NÃO-REGRESSÃO (REVISE ANTES DE QUALQUER TOQUE)
Este arquivo estabelece os **6 Estados Canônicos Invioláveis** de rastreamento gestual e resposta sonora do sistema. É **estritamente proibido** refatorar a cinemática básica em `src/vision/GestureRecognizer.ts` ou criar dependências circulares que causem regressões.

---

## OS 6 ESTADOS GESTUAIS CANÔNICOS

### 1. MÃO FECHADA / PUNHO (0 Dedos Estendidos)
* **Condição:** Todos os 5 dedos recolhidos na palma (`!extensions.thumb && !extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky`).
* **Orientação:** Seja com a **palma** ou com as **costas da mão** viradas para a câmera.
* **Comportamento de Áudio:** **SILÊNCIO TOTAL (0ms Instant Mute)**.
* **Comportamento de Visão:** Zero lasers ativos, zero tentativas de buscar pinch.

### 2. DEDÃO SOZINHO (Thumb Alone / Sub-Bass)
* **Condição:** Apenas o polegar estendido para fora/cima (`extensions.thumb && !extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky`).
* **Comportamento de Áudio:** Dispara nota/acorde de **Grau I (Deep Sub-Bass Root)**.
* **Comportamento de Visão:** Laser com rótulo `SUB / ROOT` ativo no polegar.

### 3. DEDÃO + INDICADOR (Formato em "L" / L-Shape)
* **Condição:** Indicador e polegar estendidos simultaneamente sem se tocar (`extensions.thumb && extensions.index && !extensions.middle && !extensions.ring && !extensions.pinky` com `indexDist > PINCH_THRESHOLD`).
* **Comportamento de Áudio:** Dispara **Grau V (Dominante + Sub-Bass)**.
* **Comportamento de Visão:** Lasers ativos em ambos os dedos (`MELODY/LEAD` no indicador e `SUB` no dedão).

### 4. APENAS INDICADOR (Pointing / Lead Solo)
* **Condição:** Apenas o indicador estendido (`extensions.index && !extensions.thumb && !extensions.middle && !extensions.ring && !extensions.pinky`).
* **Comportamento de Áudio:** Dispara **Grau I (Tônica)** e modulação de pitch na mão direita.
* **Comportamento de Visão:** Laser ativo com rótulo `MELODY` ou `LEAD`.

### 5. PINCH (Gesto "OK" / Pinça Deliberada)
* **Condição:** Ponta do polegar tocando a ponta do indicador (`indexDist < PINCH_THRESHOLD`) formando um anel aberto no espaço (`indexPipToWrist > 0.70 * palmScale`).
* **Comportamento de Áudio:** Dispara o acorde ou envelope instantâneo de Pinch.
* **Comportamento de Visão:** Desenha o anel branco pulsante de `PINCH` no ponto de contato.
* **Nota Crítica:** Um punho fechado **NUNCA** pode ser confundido com um Pinch.

### 6. COMBINAÇÕES POLIFÔNICAS (Harmonia Harmônica)
* **Indicador + Médio (Peace):** Grau II.
* **Indicador + Médio + Anelar (3 Dedos):** Grau III.
* **Dedão + Indicador + Médio:** Grau IV.
* **Indicador + Mindinho (Horns / Rock):** Grau VI.
* **Palma Aberta (5 Dedos):** Grau VII (Maj7 Full).

---

## 🔒 REGRAS DE OURO DE DESENVOLVIMENTO
1. **Dedo Fechado Individual (`isClosed = NO ACTION`):** Qualquer dedo individual que estiver recolhido na palma é inativo.
2. **Anti-Flicker:** A extensão de dedos é calculada por razão anatômica relativa à própria junta base (`isLongFingerExtended`), imune a variações de perspectiva ou ângulo da mão.
3. **Imutabilidade:** Não reescrever funções que já estão funcionando. Qualquer nova funcionalidade deve ser aditiva e respeitar os 6 estados canônicos acima.
