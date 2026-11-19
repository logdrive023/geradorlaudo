# LaudoTech API (Go)

API do LaudoTech. Fase 1: **a IA roda no servidor** (Gemini), a chave nunca vai para o navegador.
O desenho completo (banco, filas, PDF) está em [../docs/ARQUITETURA.md](../docs/ARQUITETURA.md).

## Rodar local
```bash
cd backend
go run ./cmd/api                 # sem chave = modo demonstração
GEMINI_API_KEY=... go run ./cmd/api
go test ./...
```
No app: Ajustes › IA › **Servidor LaudoTech** › `http://localhost:8080`.

## Variáveis
| Variável | Padrão | Para quê |
|---|---|---|
| `GEMINI_API_KEY` | — | chave do Google AI Studio (sem ela: demonstração) |
| `GEMINI_MODELO` | `gemini-3.8-flash` | modelo do Gemini |
| `GEMINI_PENSAMENTO` | `low` | quanto o modelo "pensa" na análise (`minimal`, `low`, `medium`, `high`, `padrao`) — `low` é bem mais rápido |
| `PORT` | `8080` | porta |
| `CORS_ORIGINS` | app local + Pages + Render | origens permitidas |
| `LIMITE_IA_POR_MINUTO` | `20` | pedidos de IA por IP por minuto |
| `TIMEOUT_IA_SEGUNDOS` | `120` | tempo máximo de cada chamada de IA |
| `DATABASE_URL` | — | Postgres (Supabase, session pooler) — usado na fase 2 |

## Rotas
| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/api/health` | — | `{ok, ia, modelo, banco, versao}` |
| POST | `/api/ia/analisar` | multipart: `imagem`, `tipoLaudo`, `contexto`, `instrucao`? | `{versao, origem, modelo, analise}` |
| POST | `/api/ia/conclusao` | `{resumo, instrucao?}` | `{texto}` |
| POST | `/api/ia/lia` | `{conversa:[{de,texto}], contexto?, instrucao?}` | `{texto}` |

Erros sempre `{erro: "mensagem em português"}` (400 entrada, 422 recusado, 429 limite, 503 IA indisponível).

## Contrato da IA
A análise segue **`contratos/analise-foto.v1.schema.json`** — o mesmo arquivo que o app usa.
Mudou o formato? Crie a `v2`; nunca altere a v1 (é o que está salvo no banco).

## Pastas (por domínio)
```
cmd/api            sobe o HTTP
contratos/         JSON Schema da resposta da IA (embutido no binário)
internal/dominio   regras puras: tipos de laudo, achados, prompts padrão
internal/aplicacao casos de uso (validação + regras)
internal/portas    interfaces (IA, depois banco e storage)
internal/adaptadores gemini · demo · http
migrations/        SQL do Postgres (fase 2)
```

## Espaço no banco (500 MB do Supabase grátis)
O banco **não guarda imagem**: só a chave do arquivo no storage. As fotos já chegam comprimidas do app
(WebP 1280 px ≈ 100–180 KB; miniatura 320 px ≈ 10 KB).
