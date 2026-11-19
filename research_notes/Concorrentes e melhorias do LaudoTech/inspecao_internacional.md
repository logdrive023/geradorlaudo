# Software internacional de inspeção predial/residencial (2026) — catálogo de features e lacunas do LaudoTech

Nota de método: pesquisa feita em 19/11/2026 com ~18 buscas/fetches. Fontes primárias (sites/ajuda dos fornecedores) priorizadas; preços de agregadores (Capterra, G2, TechJockey) divergem entre si e foram marcados como tal. Fóruns InterNACHI/ASHI e YouTube não foram cobertos (ver Gaps).

## 1. Catálogo de features das principais ferramentas

### Takeaway
O mercado norte-americano de inspeção residencial é dominado por plataformas "tudo-em-um" (Spectora, ISN, HomeGauge — esta agora parte da Spectora) que vão muito além do relatório: agenda online, contrato com e-assinatura, pagamento, relatório travado até pagar/assinar, CRM, automação de e-mail/SMS e ferramentas para o corretor (lista de reparos com valores). Em multifamiliar/enterprise (HappyCo, SafetyCulture, Inspectify), o foco é achado → ordem de serviço → orçamento de reparo → relatórios de portfólio.

### Cited Findings
**Spectora (líder residencial EUA)**
- Escrita de relatório no app e web com modo offline e sincronização; relatórios web interativos + PDF; portal do cliente para ver relatório, pagar e agendar; templates próprios + "Template Center" com templates compartilhados por outros inspetores/especialistas; formulários especiais (WDI, Wind Mitigation, NPMA-33, 4-point); fotos HD e vídeo ilimitados; câmera "Rapid Fire" em rajada; inspeções em equipe com sync multi-dispositivo — [Spectora Pricing](https://spectora.com/pricing)
- Agenda embutida com lembretes e bloqueio de conflito; agendador online embutível no site; campos customizados (código do cofre de chaves, modificadores de preço por área/metragem); automação de e-mail e SMS por inspeção; pagamentos integrados; QuickBooks; Google Drive; integração Repair Pricer; métricas básicas (contagem, receita); descontos para o comprador (seguro residencial, segurança, mudança) — [Spectora Pricing](https://spectora.com/pricing)
- Plano "Advanced": SMS bidirecional, notas internas, tags/CRM, perfis e desempenho de corretores parceiros, tarefas, exportações customizadas, dashboard central, controle de equipamentos, PaySplits/comissões, controle de horas — [Spectora Pricing](https://spectora.com/pricing)
- Relatório fica travado até contrato assinado e pagamento quitado (padrão); opção "cobrar depois de publicar"; "Pay at Close" (pagar no fechamento da compra) — [Spectora Help: unlock unpaid reports](https://support.spectora.com/en/articles/3854452-how-to-unlock-unpaid-reports); [Spectora Help: collect payment after publish](https://support.spectora.com/en/articles/11504040-collect-payment-after-publish); [Spectora Help: Pay at Close](https://support.spectora.com/en/articles/9011836-pay-at-close); [Spectora Features](https://www.spectora.com/features)
- Repair Request Builder: no relatório HTML, o corretor clica em "Agent Tools" → "Repair Request Builder", seleciona itens, informa valor de crédito ou comentário, vê o total de créditos solicitados no canto e gera documento para o corretor do vendedor — [Spectora: Repair Request Builder (abr/2025)](https://www.spectora.com/r/repair-request-builder/)

**HomeGauge (adquirida/juntou-se à Spectora em 1/abr/2025; plataformas seguem separadas)**
- "Create Request List" (CRL): grátis para corretores e compradores, acessado pelo relatório/dashboard; incluído na assinatura HomeGauge ONE — [HomeGauge CRL](https://homegauge.com/one/create-request-list/)
- Estilos de relatório (Narrativo, Grid etc.) e biblioteca de comentários customizável — [HomeGauge Web Writer](https://homegauge.com/one/web-writer)
- Afirma ser o único software com suporte a imagens 360° em relatórios de inspeção residencial (alegação do fornecedor) — [HomeGauge 360](https://www.homegauge.com/360/)
- Anúncio da união com Spectora — [HomeGauge joins forces with Spectora](https://www.homegauge.com/resources/homegauge-joins-forces-with-spectora/)

**ISN — Inspection Support Network**
- Plataforma de gestão (agenda, contratos, pagamento) com Report Writer incluído sem custo extra; fluxo "assinatura do contrato antes do pagamento" configurável — [ISN Pricing](https://www.inspectionsupport.com/pricing/); [ISN Help: require signature before payment](https://help.inspectionsupport.com/en/articles/2525140-require-agreement-signature-before-payment)
- "Defect Detector" (IA de foto) no Report Writer — detalhes na seção 4 — [ISN Help: Defect Detector](https://help.inspectionsupport.com/en/articles/12643196-defect-detector)

**SafetyCulture (iAuditor) — inspeções genéricas/EHS**
- Gerador de template por IA a partir de foto, PDF ou prompt (só em inglês); resumo de IA configurável por relatório (achados críticos, não conformidades, ações) — [SafetyCulture AI](https://safetyculture.com/ai); [Help SafetyCulture 003943](https://help.safetyculture.com/003943)
- "Criar issue a partir de mídia" (IA identifica e descreve o problema; equipe revisa antes de enviar) anunciado como "em breve"; AI Assistant em Early Access em 2026 — [SafetyCulture AI](https://safetyculture.com/ai); [SafetyCulture AI inspection](https://safetyculture.com/topics/ai-safety-inspection)
- Agendamento de inspeções — [SafetyCulture schedule inspections](https://safetyculture.com/schedule-inspections-iauditor/)

**HappyCo (multifamiliar)**
- Captura offline com sync; achados viram ordens de serviço automaticamente; "JoyAI" roteia OS por habilidade e proximidade do técnico; relatórios de portfólio; sync bidirecional com AppFolio, Buildium, Entrata, MRI, RealPage, ResMan, Yardi — [HappyCo para HOAs](https://happy.co/comparisons/property-inspection-software-for-hoas); [HappyCo vs zInspector](https://happy.co/comparisons/happyco-vs-zinspector)

**Inspectify (enterprise)**
- Plataforma nacional de inspeção/avaliação/underwriting para clientes enterprise; "dezenas de milhares de inspeções/mês", 350+ clientes; estimativa de reparo em todo relatório; "Rehab Tool" converte achados em escopo de obra, com tabela de preços própria ou do cliente — [Inspectify Rehab Tool](https://inspectify.com/products/rehab-tool); [Inspectify Solutions](https://inspectify.com/solutions)
- Origem (2020): marketplace de agendamento de inspeção + estimativa de reparo — [TechCrunch 2020](https://techcrunch.com/2020/08/03/founded-by-a-lifelong-house-flipper-inspectify-is-a-marketplace-for-home-inspections-and-repairs); estimativas baseadas em base de custos com 1.800 deficiências padrão — [Inman 2022](https://inman.com/2022/05/27/inspectify-wants-to-normalize-consistency-in-home-inspections-tech-review)

**Estimativa de reparo (terceiros)**
- Repair Pricer: converte relatório em orçamento em até 24h; alega 98% de precisão (alegação própria, 2018); integra com Spectora — [BusinessWire 2018](https://www.businesswire.com/news/home/20181003005223/en/); [Spectora Help: Repair Pricer](https://support.spectora.com/en/articles/3471451-how-to-integrate-with-repair-pricer)
- Thumbtack (ex-Majordomo/DomoReport) "Home Repair Estimate" em 24h a partir do PDF; BOSSCAT oferece estimativa "grátis com IA" para corretores RE/MAX; InspectReply-AI usa base 1build (68M+ pontos de custo) — [Thumbtack](https://repair.thumbtack.com/features/domoreport-repair-estimates); [RE/MAX shop BOSSCAT](https://shop.remax.com/products/bosscat-technologies); [App Store InspectReply-AI](https://apps.apple.com/us/app/inspectreply-ai/id6692633477)

**Startups AI-native (2024–2026)**
- Binsr Inspect (fundada 2023, pre-seed US$1,1M nov/2025, <400 inspetores segundo concorrente) — "AI Voice Quick Add" (ditado roteado para templates) — [Spectora vs Binsr (marketing da Spectora)](https://www.spectora.com/ai-home-inspection-report-writing-comparison-spectora-vs-binsr); [SourceForge Binsr](https://sourceforge.net/software/product/Binsr-Inspect/)
- InspectorData (2024): fotos → relatório em minutos — [SourceForge](https://sourceforge.net/software/product/InspectorData/); NspectAI (afiliada ASHI em 2026): narrativas de defeito a partir de fotos — [ASHI](https://www.homeinspector.org/organizations/nspectai)
- "Home Inspection AI" (iPad): caixas delimitadoras, confiança, severidade e ação recomendada, IA on-device por padrão com nuvem opcional — [App Store](https://apps.apple.com/us/app/-/id6754804042)
- House Inspector (consumidor): comprador fotografa defeito e recebe explicação + estimativa de custo — [Product Hunt](https://www.producthunt.com/products/house-inspector/launches)
- SnapInspect (multifamiliar/comercial, lançado 7/jul/2025): relatórios assistidos por IA e "predictive issue tagging" — [TechIntelPro](https://techintelpro.com/news/ai/enterprise-ai/snapinspect-redefines-property-inspections-with-ai-automation); Paraspot AI (inspeção por vídeo/IA) — [Inman nov/2025](https://www.inman.com/2025/11/17/paraspot-ai-sees-the-future-of-property-inspection-tech-review/)
- Property Inspect lançou "Inspect AI" (relatório assistido por IA) — [Property Inspect AU](https://propertyinspect.com/au/); MRI Inspect: clonagem de áreas, ditado por voz, offline, inspeções multi-pessoa — [MRI Inspect](https://www.mrisoftware.com/au/products/inspect/)

**360°/plantas/obras e drones**
- OpenSpace: captura 360° alinhada automaticamente a plantas/BIM; "Progress Tracking" (jun/2025) com IA + verificação humana; adquiriu Disperse (out/2025) — [Construction Dive](https://www.constructiondive.com/press-release/20251028-openspace-acquires-construction-progress-tracking-leader-disperse/); [OpenSpace ClearSight](https://www.openspace.ai/products/clearsight/)
- DroneDeploy: "Inspection AI" (out/2025) para manutenção preditiva de ativos (óleo e gás, ferrovias, renováveis, utilities); agentes de IA — [DroneLife out/2025](https://dronelife.com/2025/10/28/dronedeploy-ai-agents-automation-industries/); [DroneDeploy Horizons 2025](https://dronedeploy.com/blog/dronedeploy-unveils-agentic-ai-and-robotics-products-at-horizons-2025)
- Scopito (Dinamarca): anotação de imagens de drone + relatórios; revisor pede mais detecção automática — [G2 Scopito](https://www.g2.com/products/scopito)
- Matterport: plantas esquemáticas pagas (US$12,99), mas sem integração nativa confirmada com software de inspeção residencial — [Matterport blog](https://matterport.com/blog/best-virtual-tour-software-for-real-estate); um inspetor gera planta a partir de fotos 360° — [RISMedia 2020](https://www.rismedia.com/2020/03/25/gold-standard-home-inspection)

### Inferences
- O "produto" real dos líderes é o fluxo comercial completo (agendar → contrato → pagar → relatório → corretor/reparos), não só o laudo. O relatório é a vitrine; a retenção vem do back-office.
- HomeGauge + Spectora consolidam o mercado residencial EUA; inovação de IA está vindo dos incumbentes (Spectora 2026, ISN Defect Detector) e de startups pequenas.

### Gaps
- Não verifiquei Palm-Tech, Tap Inspect, Horizon, RTI, Zip Reports, EasyInspect, "Scope/ImageInspect" em fontes primárias — buscas retornaram só preço de agregador ou nada. "ImageInspect" não foi encontrado; "EasyInspection" (Greyloft) só aparece em listagens sem detalhes.
- "Kairos" como produto de detecção de fissuras não foi encontrado; Sitemark não foi pesquisado por limite de chamadas.

## 2. Quais features impulsionam adoção e são elogiadas em reviews

### Takeaway
Os elogios recorrentes são o relatório web interativo bonito e fácil para cliente/corretor e a lista de reparos para negociação (corretores "adoram"); queixas recorrentes são preço/custos extras e lacunas de contrato/interatividade em ferramentas mais antigas.

### Cited Findings
- Review Spectora: clientes e corretores "amam" o relatório e o repair builder — [GetApp Spectora](https://www.getapp.com/real-estate-property-software/a/spectora/pricing/) / [Capterra Spectora](https://www.capterra.com/p/157144/spectora/)
- Review Capterra: corretor gera pedido de reparo para negociação, com preços, em poucos cliques — [Capterra Spectora reviews p.5](https://www.capterra.com/p/157144/Spectora/reviews/?page=5)
- Review HomeGauge: corretores gostam da função Create Repair List; economiza tempo na redação do pedido ao vendedor — [Capterra HomeGauge reviews](https://www.capterra.com/p/29014/HomeGauge/reviews/)
- Guia de terceiros: listas de pedido que deixam comprador/corretor puxar itens direto do relatório são algo que "corretores adoram" — [inspectandtest.net](https://inspectandtest.net/guides/best-home-inspection-software/)
- Críticas: alguns usuários acham a Spectora cara, com taxas extras e planos inflexíveis para pequenos — [GetApp Spectora](https://www.getapp.com/real-estate-property-software/a/spectora/pricing/); EZ Home Inspection: pedido por plataforma mais interativa para compartilhar com corretores/empreiteiros e ausência de contrato pré-inspeção citada como fator eliminatório — [Capterra EZ](https://www.capterra.com/p/94788/EZ-Home-Inspection-Software/reviews/)
- SafetyCulture: reclamações sobre custo por usuário quando a equipe varia no mês — [GetApp iAuditor](https://www.getapp.com/operations-management-software/a/iauditor/reviews/7837d1d139); review destaca IA forte mas suporte fraco — [Connecteam review](https://connecteam.com/reviews/safetyculture/)
- Adoção de IA: ~1 em 3 inspetores usa IA; 58% planejam adotar; 83% dos que usam aplicam na redação do relatório (pesquisa da Spectora, 2025) — [Spectora: 5 ways AI](https://www.spectora.com/r/5-ways-ai-changing-home-inspection-industry)

### Inferences
- O corretor de imóveis é o canal de aquisição nos EUA; features que servem o corretor (lista de reparo, perfis de corretor) geram indicações. No Brasil, o análogo seria síndico/administradora/construtora/cliente final que precisa agir sobre o laudo.
- IA é usada majoritariamente para redigir, não para detectar — o diferencial do LaudoTech (detecção por foto com caixa e severidade) está à frente da média.

### Gaps
- Sem acesso a threads InterNACHI/ASHI ou vídeos de YouTube; reviews são de agregadores (afiliados), não independentes.

## 3. Modelos de preço (USD)

### Takeaway
Três modelos: (a) por inspetor/mês (Spectora US$109; HomeGauge ~US$49–89; Palm-Tech ~US$50; Horizon ~US$79; Tap Inspect ~US$90), (b) por inspeção (ISN ~US$3,75–7,25; Spectora Advanced US$4; Binsr Pro AI +US$4), (c) por usuário/unidade (SafetyCulture ~US$24–29/usuário; HappyCo ~US$1/unidade/mês). IA cada vez mais incluída ou cobrada por créditos.

### Cited Findings
- Spectora: US$109/mês ou US$1.090/ano; inspetor adicional US$99/mês ou US$999/ano; equipe (não inspetores) ilimitada; 2 inspeções grátis no trial; Advanced US$4/inspeção; site Base US$69/mês (+US$499 setup) e Pro US$159/mês (+US$799) — [Spectora Pricing](https://spectora.com/pricing)
- ISN: tiers por inspeção (1–50, 51–100, 101–150/mês), possível mínimo mensal; Report Writer sem custo extra — [ISN Pricing](https://www.inspectionsupport.com/pricing/); valores US$7,25 / US$5,50 / US$3,75 e mínimo US$20/mês segundo guia no domínio da ISN — [ISN guide](https://www.inspectionsupport.com/guide-download/9001/); Capterra mostra US$3,75 — [Capterra ISN](https://www.capterra.com/p/144012/Inspection-Support-Network/pricing/)
- HomeGauge: US$49 (Capterra pricing) vs US$89/mês (Capterra listing/TechJockey) — conflitante — [Capterra HomeGauge pricing](https://www.capterra.com/p/29014/HomeGauge/pricing/); TrustRadius cita pacotes anuais US$2.149 e US$3.950 (possivelmente antigos) — [TrustRadius](https://www.trustradius.com/products/homegauge/pricing)
- Palm-Tech ~US$50/mês — [Capterra Palm-Tech](https://www.capterra.com/p/65388/Palm-Tech-Home-Insp-Software/); Horizon ~US$79/mês e Tap Inspect ~US$90/mês (TechJockey; Tap Inspect não publica preço no G2) — [G2 Tap Inspect](https://www.g2.com/products/tap-inspect/pricing); [Capterra Horizon](https://www.capterra.com/p/29052/HORIZON/pricing/)
- Binsr: US$75/inspetor/mês + US$4/inspeção para "Pro AI" (segundo a Spectora) — [Spectora vs Binsr](https://www.spectora.com/ai-home-inspection-report-writing-comparison-spectora-vs-binsr)
- SafetyCulture Premium ~US$24/usuário/mês anual (US$29 mensal); créditos de IA em todos os planos (Free 300, Premium 500, Enterprise 800/assento/mês) a partir de jul/2026 segundo rastreador secundário — [G2 SafetyCulture](https://www.g2.com/products/safetyculture-iauditor/pricing); [xpay](https://www.xpay.sh/saas-pricing/safetyculture/); [PricingSaaS 2026W30](https://pricingsaas.com/companies/safetyculture/diffs/2026W30)
- HappyCo: sob consulta; agregadores citam US$1/unidade/mês (mín. 250 unidades) e US$7/unidade/vistoria em due diligence — [Capterra HappyCo ZA](https://www.capterra.co.za/software/145455/inspector); [Capterra HappyCo UK](https://www.capterra.co.uk/software/145455/inspector)
- Repair Pricer: US$25–47,99/relatório para inspetor; US$70–100 para consumidor (fonte de terceiro) — [Spectora Help Repair Pricer](https://support.spectora.com/en/articles/3693292-repair-pricer-information)
- ISN Defect Detector: limite de 100 imagens/inspetor/dia, créditos extras via suporte — [ISN Help](https://help.inspectionsupport.com/en/articles/12643196-defect-detector)

### Inferences
- Faixa de referência para inspetor solo: US$50–110/mês; "por laudo" (US$3–7) é atrativo para baixo volume — LaudoTech pode oferecer os dois.
- Limites/créditos de IA por dia/mês são padrão para controlar custo de LLM.

### Gaps
- Preços de agregadores divergem e não têm data; RTI, Zip Reports, EasyInspect sem preço encontrado.

## 4. Como usam IA e mantêm humano no circuito

### Takeaway
O padrão é IA como "rascunho que o inspetor aprova": casar observação (voz/foto) com comentários pré-aprovados do template, gerar comentário por foto com seleção explícita, resumo automático e limites de uso. Ninguém relevante publica sem revisão; a Spectora vende "nada entra no relatório sem sua assinatura".

### Cited Findings
- Spectora (jun/2026, early access): **AI Report Assist** — voz + fotos são casadas com comentários já aprovados no template do inspetor, e só redige comentário novo quando nenhum serve; etapa de confirmação após análise; **AI Scheduling Agent** atende ligações, responde dúvidas, consulta agenda e agenda inspeções; **AI Connector (MCP) + API pública** para Claude/ChatGPT consultarem o negócio — [Spectora AI tools](https://www.spectora.com/r/spectora-introduces-new-ai-tools-reimagining-how-a-home-inspection-gets-done)
- Spectora alega ~25% menos tempo por inspeção na coorte early access (Q2/2026); "AI Comment Assist" separado; IA incluída no plano — [BusinessWire jun/2026](https://www.businesswire.com/news/home/20260609736918/en/); [Spectora vs Binsr](https://www.spectora.com/ai-home-inspection-report-writing-comparison-spectora-vs-binsr)
- Crítica da Spectora à Binsr: quando não há template correspondente, a IA da Binsr redige automaticamente "sem prompt do inspetor" (marketing de concorrente) — [Spectora vs Binsr](https://www.spectora.com/ai-home-inspection-report-writing-comparison-spectora-vs-binsr)
- ISN Defect Detector: até 10 imagens por vez; opções de comentário curto/longo, com/sem recomendação, contexto do foco ("procure umidade"); progresso ao vivo; tela de seleção com preview; editar/regerar; inspetor escolhe quais entram e em qual categoria; JPG/PNG ≤20 MB; 100 imagens/dia — [ISN Help: Defect Detector](https://help.inspectionsupport.com/en/articles/12643196-defect-detector)
- SafetyCulture: issue a partir de mídia com revisão antes de enviar; resumo de IA por relatório configurável — [SafetyCulture AI](https://safetyculture.com/ai)
- OpenSpace: IA híbrida + verificação humana, posicionada contra "caixa-preta" — [OpenSpace press release](https://www.openspace.ai/?p=25416)
- Detecção de defeito vira triagem, não substituto do inspetor — [Sacra](https://sacra.com/chat/h/b8ea5ea1-b383-4ac8-9c1d-25a9e84f032f/); ferramenta aberta ABECIS: algoritmo + verificação humana dá melhor resultado; IoU varia 0,19–0,96 conforme fonte da imagem — [arXiv 2206.09742](https://arxiv.org/abs/2206.09742)
- Pesquisa: CracksGPT (Buildings, nov/2025) classifica padrões de fissura mas é sensível à qualidade da imagem; severidade costuma depender de largura medida da fissura — [MDPI Buildings](https://www.mdpi.com/2075-5309/15/23/4327)
- Mila + Carson Dunlop: pares foto–texto de manuais; privacidade limitou dados de treino — [Mila](https://mila.quebec/en/news/using-ai-to-modernize-property-inspection)
- Home Inspection AI (iPad): bounding box, confiança, severidade, ação; on-device por padrão — [App Store](https://apps.apple.com/us/app/-/id6754804042)

### Inferences
- LaudoTech já tem detecção com caixa/severidade/confiança/aceitar-descartar, comparável ou superior ao ISN. Lacunas: (1) casar achado com **biblioteca de comentários aprovados pelo próprio engenheiro** antes de gerar texto livre; (2) **campo de contexto/foco** antes de analisar; (3) alternância curto/longo e com/sem recomendação; (4) agente de agendamento por telefone/WhatsApp; (5) conector MCP/API pública.
- Medir largura de fissura (escala/referência na foto) seria diferencial técnico para severidade.

### Gaps
- Nenhuma fonte primária sobre taxa de acerto real dos detectores comerciais; métricas de precisão não publicadas.

## 5. Recursos distintivos de entrega ao cliente

### Takeaway
Os diferenciais de entrega são: relatório web interativo com ferramentas para corretor, construtor de lista de reparos com valores/créditos, estimativas de custo de terceiros, portal do cliente com contrato+pagamento+relatório, trava de relatório até pagar/assinar, e conversão de achados em ordens de serviço/escopo de obra.

### Cited Findings
- Repair Request Builder (Spectora) com total de créditos — [Spectora](https://www.spectora.com/r/repair-request-builder/); CRL grátis (HomeGauge) — [HomeGauge CRL](https://homegauge.com/one/create-request-list/)
- Portal do cliente: ver relatórios, assinar, pagar — [Spectora client portal](https://support.spectora.com/en/articles/6245789-introducing-the-client-portal)
- Relatório travado até pagar/assinar; Pay at Close — [Spectora Help](https://support.spectora.com/en/articles/3854452-how-to-unlock-unpaid-reports)
- Estimativas de reparo integradas (Repair Pricer na Spectora; Inspectify em todo relatório; Rehab Tool com tabela de preços própria) — [Spectora Help](https://support.spectora.com/en/articles/3471451-how-to-integrate-with-repair-pricer); [Inspectify](https://inspectify.com/products/rehab-tool)
- Achado → OS automática + atribuição por IA a técnico/fornecedor (HappyCo JoyAI) — [HappyCo](https://happy.co/comparisons/property-inspection-software-for-hoas)
- Ofertas ao comprador (seguro, segurança, mudança) como receita extra — [Spectora Pricing](https://spectora.com/pricing)
- Imagens 360° no relatório (HomeGauge) — [HomeGauge 360](https://www.homegauge.com/360/)

### Inferences
- O LaudoTech tem link somente-leitura e plano de ação; falta tornar o link **acionável**: cliente seleciona achados → gera pedido/orçamento/lista para empreiteiro, comenta, marca como resolvido, paga.

### Gaps
- Não foram verificados portais de proprietário (homeowner portal pós-compra, ex.: manutenção recorrente) em fontes primárias.

## 6. O que os concorrentes têm e o LaudoTech não tem (síntese de lacunas)

### Takeaway
As maiores lacunas do LaudoTech frente aos líderes estão no fluxo comercial (agenda online, contrato com e-assinatura, cobrança e trava do laudo), na entrega acionável (lista de reparos/orçamento com valores pelo cliente), em bibliotecas de comentários/marketplace de templates, em mídia rica (vídeo/360°/planta) e em integrações/API.

### Cited Findings
- Agenda online embutível, lembretes, campos customizados e modificadores de preço — [Spectora Pricing](https://spectora.com/pricing)
- Contrato digital + e-assinatura + pagamento integrado + relatório travado — [Spectora Features](https://www.spectora.com/features); [ISN Help](https://help.inspectionsupport.com/en/articles/2525140-require-agreement-signature-before-payment)
- Template Center compartilhado (marketplace) — [Spectora Pricing](https://spectora.com/pricing); biblioteca de comentários e estilos narrativo/grid — [HomeGauge Web Writer](https://homegauge.com/one/web-writer)
- Vídeo HD ilimitado e câmera em rajada — [Spectora Pricing](https://spectora.com/pricing); 360° — [HomeGauge 360](https://www.homegauge.com/360/); alinhamento de fotos à planta — [OpenSpace](https://www.openspace.ai/products/clearsight/)
- CRM, perfis de parceiros, automação e-mail/SMS, dashboard de negócio, comissões — [Spectora Pricing](https://spectora.com/pricing)
- Integrações contábeis (QuickBooks), Google Drive, sistemas de gestão de imóveis (Yardi, AppFolio…) — [Spectora Pricing](https://spectora.com/pricing); [HappyCo](https://happy.co/comparisons/happyco-vs-zinspector)
- Agente de IA para agendamento e conector MCP/API — [Spectora AI tools](https://www.spectora.com/r/spectora-introduces-new-ai-tools-reimagining-how-a-home-inspection-gets-done)
- Gerador de template por IA a partir de foto/PDF — [SafetyCulture AI](https://safetyculture.com/ai)
- Clonagem de áreas/inspeções e inspeções multi-pessoa — [MRI Inspect](https://www.mrisoftware.com/au/products/inspect/)

### Inferences
Priorização sugerida (inferência, não fonte):
1. **Lista de reparos/orçamento pelo cliente no link** (selecionar achados, somar custos do plano de ação, exportar PDF para construtora/síndico) — maior elogio em reviews.
2. **Biblioteca de textos aprovados** do engenheiro + IA que casa achado → texto aprovado antes de gerar livre (padrão Spectora Report Assist); campo "foco/contexto" na análise.
3. **Proposta/contrato com aceite eletrônico + cobrança (Pix) + trava do laudo** até pagar.
4. **Agenda online** com link público (e futuramente agente de IA no WhatsApp).
5. **Vídeo curto e foto 360°** nos achados; marcação em planta baixa enviada (PDF/imagem).
6. **Marketplace/galeria de modelos** de laudo compartilhados (por tipo: vistoria de entrega, NBR 16747, cautelar de vizinhança).
7. **Gerar modelo a partir de PDF/foto de laudo antigo** (como SafetyCulture).
8. API pública/conector MCP e integrações (Google Drive, contabilidade).
9. Revisão QA por segundo engenheiro em equipe e dashboard de negócio (receita, laudos, tempo médio).
10. Limites/créditos de IA por plano para controlar custo.

### Gaps
- Não confirmado se algum concorrente tem fluxo formal de revisão QA (segundo revisor aprova antes de publicar) — não encontrado nas fontes consultadas.
- Analytics avançados além de "métricas básicas" e dashboard Advanced da Spectora não detalhados.
- Ditado por voz já existe no LaudoTech; concorrentes (Spectora, Binsr, MRI) também têm — não é lacuna.
