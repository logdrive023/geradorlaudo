# Organização, papéis e base do negócio

Objetivo: ser o app de confiança do engenheiro e da obra, com regras simples e garantidas no servidor
(a tela só esconde; quem decide é a API). Tudo é aditivo: quem já usa como admin não percebe diferença.

## Papéis (só três)

| Papel | O que vê | O que faz | O que não faz |
|---|---|---|---|
| **Admin** (gestor) | Tudo da organização | Convida, muda papel, desativa; plano, IAs, modelos, prompts, etapas; atribui pessoas; vê o registro de atividades | — |
| **Engenheiro** (responsável técnico) | Os laudos/obras que criou + os atribuídos a ele | Cria, confere, conclui, emite (QR) e assina; atribui pessoas aos seus; vê o financeiro | Gerir equipe, plano e auditoria |
| **Assistente** (campo) | Só os laudos/obras atribuídos a ele | Fotos, dados, conferência, diário de obra, agenda própria | Concluir/emitir laudo, apagar, ver ou mexer no financeiro |

Regra única de visibilidade (função `pode_ver` no Postgres, usada por todas as consultas):
admin vê tudo da organização; os demais veem o que criaram e o que foi atribuído (tabela `membros`).

Proteções:
- A organização nunca fica sem um admin ativo.
- Desativar alguém derruba as sessões dele na hora.
- O assistente recebe a obra **sem** financeiro; quando ele salva, o servidor mantém o financeiro que já estava lá.
- Convite: o admin gera um link (vale 7 dias, uso único); a própria pessoa escolhe a senha. Ninguém mais vê a senha.

Código: `conta.Pode(papel, acao)` em `internal/dominio/conta/conta.go` (repo geradorlaudo-backend) é a matriz de permissões.

## Estrutura no banco (migração 0006)

| Tabela / coluna | Para quê |
|---|---|
| `usuarios.papel` | admin, engenheiro, assistente |
| `organizacoes.cnpj`, `config`, `logo_chave` | dados e padrões da empresa |
| `membros` | quem trabalha em cada laudo/obra |
| `convites` | link de convite (só o SHA-256 do token) |
| `auditoria` | quem fez o quê (emitiu, convidou, mudou papel, cliente aceitou…) |
| `laudos.responsavel_id`, `codigo`, `emitido_em`, `hash_conteudo` | autenticidade: QR no PDF → página pública de verificação |
| `laudos.referencia_id` | vistoria de saída ligada à de entrada (comparação) |
| `respostas_cliente` | aceite (assinatura eletrônica simples, Lei 14.063), comentário, contestação, pedido de reparo, aprovação |
| `biblioteca_textos` | textos aprovados do escritório para reaproveitar |
| `agendamentos` | agenda de vistorias |
| `assinaturas`, `uso_ia`, `pagamentos_eventos` | plano, limites, uso de IA e avisos do gateway (cobrança preparada) |
| `entradas_externas` | mensagens do WhatsApp/e-mail guardadas para a Lia organizar |

## Rotas novas

| Rota | Quem |
|---|---|
| `GET /api/org` | todos (devolve papel e permissões para a tela) |
| `PUT /api/org` | admin |
| `GET /api/org/usuarios` | todos |
| `PATCH /api/org/usuarios/{id}` `{papel?, ativo?}` | admin |
| `GET/POST /api/org/convites` | admin |
| `GET/POST /api/convite/{token}` | público (aceitar convite) |
| `GET/PUT /api/membros/{laudo|obra}/{id}` | quem vê / admin e engenheiro dono |
| `GET /api/org/auditoria` | admin |
| `POST /api/publico/{token}/respostas`, `POST /api/publico/obra/{token}/respostas` | cliente pelo link (20/min por IP) |
| `GET /api/laudos/{id}/respostas`, `GET /api/obras/{id}/respostas` | quem vê |
| `POST /api/laudos/{id}/emitir` | admin e engenheiro |
| `GET /api/verificar/{codigo}` | público |
| `GET/POST /api/biblioteca`, `DELETE /api/biblioteca/{id}` | organização |
| `GET/POST /api/agenda`, `DELETE /api/agenda/{id}` | cada um a sua; admin todas |
| `POST /api/pagamentos/asaas` | Asaas (liga com `ASAAS_WEBHOOK_TOKEN`) |
| `GET/POST /api/whatsapp/webhook` | Meta (liga com `WHATSAPP_VERIFY_TOKEN`; assinatura com `WHATSAPP_APP_SECRET`) |

A análise de foto (`/api/ia/analisar`) passa a contar o uso da organização quando o pedido vem logado.

## O que ainda falta para ligar

- Telas: equipe e convites, atribuição, respostas do cliente, verificação, agenda, biblioteca.
- Cobrança: criar a conta no Asaas, cadastrar o webhook e pôr `ASAAS_WEBHOOK_TOKEN` no Render (a pessoa faz; ninguém digita segredo por ela).
- WhatsApp: app no Meta + número; `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_APP_SECRET` no Render; depois a Lia processa `entradas_externas`.
