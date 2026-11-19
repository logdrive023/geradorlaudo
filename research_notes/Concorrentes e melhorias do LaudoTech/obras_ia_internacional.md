# Gestão de obras e IA para canteiro: líderes internacionais (situação em nov/2026) e lacunas do LaudoTech

Notas de pesquisa (15 chamadas de busca/leitura). Preços em US$ e, salvo indicação, por mês. Muitos preços vêm de agregadores (Capterra, G2) ou de páginas comparativas de concorrentes, o que vai sinalizado em cada item.

## 1. Quais funções mais importam para pequenos construtores (e quais o LaudoTech não tem)?

### Takeaway
No segmento residencial e de pequenas construtoras (Buildertrend, JobTread, Houzz Pro, Contractor Foreman), o pacote básico é o mesmo: portal do cliente com **seleções, aprovações e pagamento online**, **aditivos (change orders) com assinatura eletrônica**, diário de obra e apontamento de horas. O LaudoTech já tem portal (só link), RDO, financeiro e cotações. Faltam a ele as camadas **transacionais** (o cliente aprova, assina e paga dentro do portal) e os **resumos automáticos para o cliente**.

### Cited Findings
- **JobTread**: um único plano, com tudo incluído e sem níveis. Tem portal do cliente com seleções, aditivos, assinatura eletrônica, pagamentos online, diário de obra, apontamento de horas e recursos de IA. Os usuários de cliente, fornecedor e subempreiteiro no portal são ilimitados e grátis, e há contas limitadas de equipe de campo sem custo. Jobs, documentos e arquivos são ilimitados — [JobTread Pricing](https://www.jobtread.com/pricing)
- **Houzz Pro**: o "Client Dashboard" reúne seleções, aprovações, acompanhamento de orçamento e pagamentos online, e os pagamentos já entram no plano de entrada. Os aditivos começam no plano Pro. O diário de obra aceita **vídeo-logs que a Houzz AI transcreve em registros estruturados** (plano Pro ou acima) — [Houzz Pro vs Contractor Foreman (página da Houzz, viés de concorrente)](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative)
- **Contractor Foreman**: tem portal do cliente (atualizações e documentos), seleções, opções e verbas (allowances) dentro do orçamento, aditivos, diário de obra, takeoff assistido por IA e chat. Na comparação da Houzz não aparecem pagamentos online nem assinatura eletrônica — [mesma fonte Houzz](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative)
- **Buildertrend**: seleções, submittals, "Bill Capture" (lê e classifica notas de fornecedor) e "Client Updates". Em fev/2026 lançou o **Bill Pay**, fluxo de contas a pagar com IA. Em 29/09/2026 anunciou mais IA, integrações com Sage Intacct e Bluebeam e um app de campo novo, voltado a obras maiores e comerciais — [Buildertrend AI page](https://buildertrend.com/?p=118176); [Software Advice](https://www.softwareadvice.com/landscaping/buildertrend-profile/); [Newsfile 29/09/2026](https://www.newsfilecorp.com/release/316422) (não consegui ler o conteúdo, só o título); [usecarly (terceiro)](https://www.usecarly.com/blog/buildertrend-ai/)
- **Dado do problema que o Buildertrend aponta**: no último ano, só 33% dos projetos com acesso do cliente receberam ao menos um diário de obra compartilhado. Ou seja, o portal fica vazio se o construtor precisar alimentá-lo à mão — [Buildertrend press release](https://buildertrend.com/press-releases/buildertrend-launches-ai-tool-for-97-faster-client-updates/)
- **Fieldwire (Hilti)**: foco em campo (plantas, tarefas, checklists e formulários). Os planos superiores acrescentam BIM, formulários personalizados, API e SSO. Há plano gratuito — [Capterra Fieldwire](https://www.capterra.com/p/142801/Fieldwire/pricing/); [Fieldwire Help](https://help.fieldwire.com/hc/en-us/articles/202634054)
- **Autodesk Build (renomeado "Forma Build" em 2026)**: o release de mar/2026 trouxe álbuns de fotos com permissões e ações em lote (apagar, mover e baixar várias de uma vez) — [Autodesk Forma March 2026 Releases](https://www.autodesk.com/blogs/construction/autodesk-forma-march-2026-construction-releases-built-for-whats-next/)
- **Voz no diário de obra**: o Procore Assist ganhou voz no celular (Groundbreak, out/2025). O CompanyCam transforma fotos e notas de voz em relatórios de vistoria, checklists e atualizações. O BuildLogAI (app independente) vende "voice-to-text daily logs" — [Procore press](https://www.procore.com/press/procore-advances-the-future-of-construction-with-new-ai-innovations); [busca Buildertrend/CompanyCam (usecarly)](https://www.usecarly.com/blog/best-ai-automation-tools-buildertrend/); [BuildLogAI Capterra](https://www.capterra.com/p/10043842/BuildLogAI/)
- **Raken** (especialista em diário de obra): o "AI Daily Report Summaries" gera automaticamente, quando o relatório é assinado, um resumo priorizado de apontamentos, segurança, atrasos, equipamentos e clima. Só existe no plano Performance — [Raken Help](https://help.rakenapp.com/en/articles/14502801-ai-daily-report-summaries-in-raken)

### Inferences
- Lacunas do LaudoTech com melhor relação valor/esforço para uma equipe pequena (a minha ordem de prioridade):
  1. **Aditivo de obra (change order) com aceite no portal**: o cliente vê item, valor e impacto no prazo e aprova com um clique, ficando registrados nome, data, IP e hash. É um "aceite eletrônico" simples, que não precisa de certificado ICP-Brasil. Esse fluxo aparece em todos os líderes do segmento pequeno.
  2. **Seleções/opções de acabamento com verba (allowance)** no portal, com a diferença de custo indo automaticamente para o financeiro da etapa.
  3. **Cobrança e pagamento no portal**: no Brasil, Pix e boleto por gateway (Asaas, Mercado Pago, Stripe BR, Pagar.me), com parcelas ligadas às medições do Gantt. Isso equivale ao "online payments" do Houzz e do JobTread e é o que abre a receita por percentual do volume (seção 3).
  4. **Resumo semanal automático para o cliente**, gerado dos RDOs, do Gantt e do financeiro e revisado pelo engenheiro antes de enviar. É o equivalente direto do Buildertrend Client Updates e do Raken AI Summaries, e o LaudoTech já tem a IA que reescreve notas. Resolve o problema de portal vazio (só 33% dos projetos recebem algum diário).
  5. **RDO por voz**: gravar um áudio e a IA preencher atividades, equipe, ocorrências e clima. O Houzz faz isso com vídeo e o Procore com voz. Combina com o uso do celular no canteiro.
  6. **Lista de pendências (punch list) marcada sobre a planta ou a foto**, com responsável, prazo e foto de antes e depois. Reaproveita a mecânica de "marcar na foto" que o Conferir já tem.
  7. **Linha do tempo de fotos por local/etapa**, com geotag e data, organizada em álbuns (como o Forma Build).
- Funções de obra comercial grande (RFIs, submittals, BIM, comparação com o modelo 3D) pesam pouco para o engenheiro autônomo brasileiro e podem ficar para depois.
- O clima no RDO deve vir preenchido automaticamente por uma API de previsão a partir da localização da obra. É barato de fazer. Não achei fonte que confirme qual concorrente faz isso (ver Gaps).

### Gaps
- Não confirmei com fonte quais ferramentas preenchem o clima automaticamente no diário de obra. Pelo que lembro, Raken e Procore fazem, mas não verifiquei.
- Não li o conteúdo do release de 29/09/2026 do Buildertrend (a página voltou vazia), então os detalhes das novas funções de IA ficaram de fora.
- Não pesquisei CoConstruct. Pelo que lembro, foi incorporado pelo Buildertrend em 2021 e deixou de ser vendido separadamente, mas não confirmei.
- Bluebeam (marcação em PDF) e Raken (preço) ficaram sem fonte nesta rodada.

## 2. Quais funções de IA já foram lançadas de fato (2024–2026)?

### Takeaway
A IA que já está em produção se concentra em quatro frentes: (1) **perguntas e respostas sobre documentos e fotos** (Procore Assist, Trunk Tools, Autodesk Assistant); (2) **diário e resumo automáticos** (Procore Daily Log Agent, Raken, Buildertrend Client Updates, Houzz); (3) **takeoff automático a partir da planta** (Togal.AI, Houzz AI, Buildxact BluAI, Contractor Foreman); (4) **progresso medido por captura 360°, drone ou LiDAR contra o cronograma**, para obras grandes (OpenSpace/Disperse, Buildots, Doxel, DroneDeploy). Os "agentes" ainda estão em beta ou prévia. O mercado consolida isso por aquisições: OpenSpace comprou a Disperse, e a Procore anunciou a compra da DroneDeploy por cerca de US$ 845 mi em jul/2026.

### Cited Findings
**Procore Helix (Groundbreak, out/2025)**
- O **Procore Assist** responde perguntas a partir de especificações, RFIs, submittals e normas. Recebeu **Photo intelligence** (resume o andamento e aponta riscos de segurança a partir das fotos da obra), suporte a espanhol e polonês e app móvel com voz — [Procore press](https://www.procore.com/press/procore-advances-the-future-of-construction-with-new-ai-innovations)
- O **Agent Builder** cria agentes por prompt em linguagem natural e está em **beta aberto** para todos os clientes. Os agentes prontos incluem o **RFI Creation Agent**, que redige a RFI e procura a resposta nos documentos, e o **Daily Log Agent**, que automatiza o relatório diário — [Procore press](https://www.procore.com/press/procore-advances-the-future-of-construction-with-new-ai-innovations); [Mann Report](https://www.mannpublications.com/mannreport/2025/10/15/procore-unveils-ai-innovations-in-helix/)
- O Procore Developer Studio permite agentes que operam entre aplicativos via MCP e APIs — [Procore blog](https://www.procore.com/blog/inside-procores-2025-innovation-summit-and-the-future-of-connected-construction)
- **Procore e DroneDeploy**: acordo assinado em 27/07/2026, cerca de US$ 845 mi em dinheiro. A DroneDeploy é usada em mais de 3 milhões de obras em mais de 180 países. A ideia é juntar as plantas e fotos da Procore aos dados visuais da DroneDeploy. O fechamento dependia de aprovações, e as fontes divergem sobre se já foi concluído — [Equipment World](https://www.equipmentworld.com/technology/article/15832798/procore-to-acquire-dronedeploy-for-845-million); [Construction Dive](https://constructiondive.com/news/procore-acquires-dronedeploy-data-ai-cash/826667); [Cooley](https://www.cooley.com/news/coverage/2026/2026-07-30-procore-technologies-to-acquire-dronedeploy-for-approximately-%24845-million); [TipRanks ("completes", ambíguo)](https://www.tipranks.com/news/procore-technologies-completes-dronedeploy-acquisition-to-enhance-platform)

**Autodesk (AU 2026)**
- Foi apresentada uma prévia do Autodesk Assistant de próxima geração, que conecta dados do projeto, ferramentas e agentes de terceiros, com versão standalone **prevista para 2027**. O Assistant Builder permitirá conectar agentes próprios e de parceiros. Na construção, os agentes buscarão em documentos, transformarão propostas em PDF em dados de concorrência estruturados e conferirão submittals contra as especificações, **com humanos revisando e decidindo**. Tudo isso ainda é prévia — [engineering.com](https://www.engineering.com/autodesk-previews-agentic-ai-for-connected-project-workflows/); [AEC Magazine](https://aecmag.com/ai/autodesks-most-ambitious-ai-play-yet/); [Autodesk AU 2026 Forma](https://www.autodesk.com/blogs/construction/autodesk-university-2026-forma-product-highlights-across-the-construction-lifecycle/)

**Buildertrend**
- O **Client Updates** foi lançado em 07/06/2025. Redige um resumo semanal ao cliente a partir de diários, cronograma, aditivos e faturas. O construtor edita e publica no portal com um clique, e o sistema confirma o recebimento. A empresa diz que o tempo caiu de 30–60 min para cerca de 6,5 min e anuncia "97% de economia" (pela minha conta, os números do próprio release dão 78–89%). No beta foram 180 atualizações e cerca de 115,5 h economizadas — [Buildertrend press](https://buildertrend.com/press-releases/buildertrend-launches-ai-tool-for-97-faster-client-updates/)

**Raken**
- O AI Daily Report Summaries é gerado automaticamente quando o relatório é assinado (plano Performance) — [Raken Help](https://help.rakenapp.com/en/articles/14502801-ai-daily-report-summaries-in-raken)

**Houzz Pro**
- A Houzz AI cobre orçamento, takeoff, cronograma gerado a partir do orçamento aprovado, transcrição do diário de obra, resumo de ligações e tradução de mensagens — [Houzz compare](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative)

**Takeoff**
- O **Togal.AI** detecta, mede e rotula ambientes e elementos direto na planta, com nota 4,8/5 em 60 avaliações no G2, segundo um guia da ConstructConnect — [ConstructConnect 2026](https://www.constructconnect.com/blog/ai-powered-takeoff-and-estimating-software-a-contractors-guide-to-the-top-players-in-2026)
- O **Buildxact BluAI** promete reduzir o tempo de takeoff em 50%. É afirmação do próprio fornecedor — [Buildxact](https://www.buildxact.com/ca/?p=16388)

**Progresso por captura visual**
- **OpenSpace**: o Progress Tracking nasceu da compra da Disperse (jun/2025). A IA usa as imagens 360° **com verificação humana**. Um anúncio fala em mais de 700 componentes visuais em mais de 200 tarefas do cronograma. Em 2026 vieram quantitativos, marcações, análise preditiva, a Track API (integração com ERP e BI) e previsão de prazo, além de mosaicos aéreos por drone (OpenSpace Air, usado pela Suffolk) — [ForConstructionPros (Disperse)](https://www.forconstructionpros.com/business/labor-workforce-development/article/22954899/openspace-openspace-acquires-disperse-to-expand-aipowered-construction-progress-tracking); [ForConstructionPros (expansão)](https://www.forconstructionpros.com/construction-technology/surveying-layout/article/22974588/openspace-openspace-expands-construction-platform-with-ai-and-progress-tracking); [OpenSpace blog](https://www.openspace.ai/blog/ai-in-construction/); [Suffolk](https://suffolk.com/news/openspace-air-how-drone-based-reality-capture-is-changing-construction-progress-tracking/)
- **Buildots** (Tel Aviv, fundada em 2018): automatiza o acompanhamento de progresso, prevê atrasos e faz analytics. A fonte é só um perfil de terceiro — [CB Insights](https://www.cbinsights.com/compare/buildots-vs-openspace)
- **Doxel**: usa LiDAR e robô autônomo, compara o escaneamento com o modelo BIM e diz entregar 11% mais rápido (dado do próprio fornecedor) — [resultado de busca, agregadores](https://www.singaporetechnologyweek.com/exhibitors/doxelai)

**Agentes de documentos e campo**
- **Trunk Tools**: Série B de US$ 40 mi em jul/2025 (Insight Partners), com US$ 70 mi captados no total. Faz perguntas e respostas sobre documentos da obra ("ChatGPT da construção") e oferece agentes para tarefas administrativas. A empresa diz que a receita cresceu mais de 5x em um ano — [ENR](https://www.enr.com/articles/61084-trunk-tools-nets-40m-in-funding-round-led-by-insight-partners); [Insight Partners](https://www.insightpartners.com/ideas/trunk-tools-closes-40m-series-b-to-lead-constructions-ai-transformation/); [TechCrunch 2024](https://techcrunch.com/2024/08/20/trunk-tools-raises-30m-to-help-construction-companies-get-answers-from-documents/)
- **Kojo**: gestão de materiais, compras e estoque. Recebeu extensão de Série C de US$ 10 mi da Wesco para combinar a IA da Kojo com a distribuição da Wesco (não achei a data) — [resultado de busca: Construction Dive / Cemex Ventures](https://www.constructiondive.com/news/construction-tech-funding-Q4-2025/808986/)

### Inferences
- **IA viável para o LaudoTech**, porque reaproveita o que ele já tem (visão por foto, reescrita de notas e várias IAs):
  - "Photo intelligence" no RDO: pelas fotos do dia, a IA sugere as atividades executadas e o percentual da etapa, e o engenheiro confirma. É o mesmo padrão "IA propõe, humano revisa" que o LaudoTech já usa nos laudos, e que OpenSpace e Autodesk também adotam.
  - Resumo automático do RDO e da semana para o cliente.
  - Perguntas e respostas sobre os documentos da obra (memoriais, contratos, normas ABNT que o usuário enviar), no estilo do Procore Assist e do Trunk Tools, com RAG simples por obra.
  - RDO por voz (transcrição e estruturação).
  - Leitura de nota fiscal ou cupom para lançar despesa na etapa (como o Bill Capture do Buildertrend). No Brasil, ler o XML ou o QR Code da NF-e é mais confiável do que OCR.
- **Fora do alcance agora**: progresso por 360°, LiDAR, BIM ou drone (OpenSpace, Buildots, Doxel, DroneDeploy). Exige hardware, BIM e obra grande, e o mercado está se concentrando em grandes compradores (Procore). Takeoff automático em planta é possível mais tarde, mas a precisão em plantas brasileiras (DWG e PDF variados) é um risco.
- Os "agentes" dos líderes ainda estão em beta ou prévia (Procore Agent Builder em beta aberto, Autodesk Assistant em 2027). Um pequeno player pode anunciar "assistente da obra" sem estar atrasado.

### Gaps
- Não consegui ler o release oficial da BusinessWire (403). Usei o release no site da Procore.
- Não encontrei dados de 2026 sobre produto ou preço de Buildots, Doxel e Disperse. Também não confirmei se a compra da DroneDeploy foi fechada.
- Não pesquisei a fundo as funções de IA e agentes da Fieldwire ou da Bluebeam em 2026.
- Não encontrei medição independente da precisão das IAs de takeoff e de progresso. Os números (50%, 11%, 97%) vêm dos fornecedores.

## 3. Modelos de preço (por projeto, por usuário, % do volume)

### Takeaway
Há quatro modelos: (a) **assinatura fixa por empresa, com usuários de cliente e subempreiteiro grátis** (JobTread, Houzz, Contractor Foreman, Buildxact), que é o padrão para pequenos; (b) **por usuário** (Fieldwire, Togal); (c) **cotação ou volume de obra** nas plataformas grandes (Procore cobra por volume anual de construção, Buildertrend parou de publicar preço); (d) **receita de pagamentos** embutida (Houzz, JobTread e Buildertrend Bill Pay). Na faixa pequena, os preços ficam entre US$ 49 e 400 por mês.

### Cited Findings
- **JobTread**: US$ 199 de base, com o primeiro usuário incluído. Usuários extras custam US$ 20 (2–10), US$ 15 (11–20), US$ 10 (21–30) e US$ 5 (31+) no mensal, e 20% menos no anual. Não há contrato, taxa de implantação nem trial, e o mensal tem 30 dias de garantia de reembolso. Portal ilimitado e grátis para clientes e fornecedores — [JobTread Pricing](https://www.jobtread.com/pricing)
- **Houzz Pro**: entrada US$ 99, Pro US$ 199, Teams a partir de US$ 399. Usuário extra custa US$ 50 nos planos de entrada e Pro. Exige compromisso de 12 meses e tem trial de 30 dias com cartão — [Houzz compare](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative). As fontes divergem: o Capterra cita US$ 399 — [Capterra Houzz Pro](https://www.capterra.com/p/199689/Houzz-Pro/pricing/)
- **Contractor Foreman**: Basic US$ 49 (1 usuário interno), Standard US$ 105, Plus US$ 166, Pro US$ 221, Unlimited US$ 332 (usuários ilimitados). Cobrança anual ou trimestral e trial de 30 dias sem cartão — [Houzz compare (fonte concorrente)](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative); [G2](https://www.g2.com/compare/contractor-foreman-vs-houzz-pro)
- **Buildertrend**: não publica mais preço, só por cotação. Os últimos planos publicados (fim de 2024) começavam em US$ 449/mês no anual. Estimativas de 2026 colocam o plano Complete em cerca de US$ 829–1.099/mês, e uma construtora de 20 pessoas pagaria US$ 9–14 mil/ano (estimativas de terceiros) — [Capterra](https://www.capterra.com/p/70092/Buildertrend/pricing/); [OneCrew](https://www.getonecrew.com/post/buildertrend-pricing); [Projul](https://www.projul.com/blog/buildertrend-pricing-analysis-2026/)
- **Fieldwire**: por usuário. Pro US$ 54, Business US$ 79, Business Plus US$ 104 no mensal, segundo o help center, e cobra apenas pelo tempo em que o usuário teve acesso. O G2 lista US$ 39/59/89 no anual (abr/2026). Há plano gratuito, e o Enterprise é por cotação — [Fieldwire Help](https://help.fieldwire.com/hc/en-us/articles/202634054); [G2](https://www.g2.com/products/fieldwire-by-hilti/pricing); [ERP Research](https://erpresearch.com/erp-add-ons/construction/fieldwire/pricing)
- **Buildxact**: a partir de US$ 149 a US$ 199/mês, conforme a fonte, com **usuários ilimitados** — [G2](https://g2.com/compare/buildxact-vs-houzz-pro); [Spotsaas](https://www.spotsaas.com/compare/buildxact-vs-houzz-pro)
- **Togal.AI**: add-on de cerca de US$ 1.800 por usuário/ano, segundo listagem de terceiro — [ConstructConnect](https://www.constructconnect.com/blog/ai-powered-takeoff-and-estimating-software-a-contractors-guide-to-the-top-players-in-2026)
- **Raken**: o resumo por IA só existe no plano superior (Performance). É um exemplo de **IA como alavanca para subir de plano** — [Raken Help](https://help.rakenapp.com/en/articles/14502801-ai-daily-report-summaries-in-raken)
- **Houzz**: os recursos de IA (takeoff e transcrição do diário) e os aditivos ficam no plano Pro ou acima, mais uma vez a IA como alavanca de upgrade — [Houzz compare](https://pro.houzz.com/for-pros/compare-contractor-foreman-alternative)

### Inferences
- Modelo que sugiro para o LaudoTech: **assinatura por conta com usuários "cliente" e "equipe de campo" grátis**, como fazem JobTread e Buildxact. Cobrar por usuário afasta o engenheiro autônomo que precisa convidar mestre de obras e cliente.
- **Recursos de IA em volume, como diferencial de plano**: X resumos, RDOs por voz ou fotos analisadas por mês no plano superior, seguindo Raken e Houzz. Isso protege o custo de tokens.
- **Receita por transação**: uma pequena taxa sobre Pix e boleto cobrados pelo portal, como o modelo de pagamentos do Houzz, JobTread e Buildertrend. É o caminho do "% do volume" sem cobrar pelo valor da obra.
- Cobrar pelo volume de obra (estilo Procore) não combina com o público autônomo.
- Para referência em reais: os concorrentes da faixa pequena cobram entre US$ 49 e 400/mês. O mercado brasileiro deve ficar bem abaixo disso, mas não pesquisei preços nacionais nesta rodada.

### Gaps
- O preço atual da Procore (modelo por volume anual de construção, pelo que lembro), do Autodesk Build/Forma Build, do Bluebeam, da OpenSpace, da Buildots e da DroneDeploy não foi verificado nesta rodada.
- Não confirmei as taxas de pagamento (percentual por transação) cobradas por Houzz, JobTread e Buildertrend.
- Os preços do Houzz Pro divergem bastante entre fontes (US$ 65 a 399).
