# LaudoTech

**Fotos viram laudo.** Você manda as fotos da vistoria, a Lia (IA) analisa e escreve tudo — ambiente, legenda,
achados, grau de risco, causa e recomendação — e você só confere. O laudo sai no padrão, pronto para assinar.

Funciona offline no navegador (IndexedDB) e sincroniza com a API Go + Postgres, que fica no repositório
privado **logdrive023/geradorlaudo-backend** (branch `feat/react-vite-ia`). Desenho: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Rodar

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # checa os tipos e gera dist/
```

Entrar: **Ver funcionando agora** (laudo de exemplo) ou o usuário `admin` (acesso total).

## O que tem
- 10 tipos de laudo, cada um com seu padrão (campos, normas, objetivo, metodologia) — editável em Ajustes › Modelos.
- Wizard: Dados → Fotos (a IA analisa sozinha) → Conferir → Laudo.
- IA: modo demonstração (simulado, sem custo) ou Claude com a sua chave (Ajustes › IA).
- Conferência com texto pronto, filtro pela certeza da Lia, caixas na foto, ditado por voz.
- Laudo em modo Leitura (celular) e A4 editável direto no documento; PDF e Word.
- Lia: assistente com central de ajuda no app e dúvidas de produto na página inicial.
- Admin: usuários, papéis, senha; backup/importação.

## Pastas
```
src/dominio   modelo, tipos de laudo, regras ("pronto para assinar", conclusão)
src/ia        motor demo, Claude, Lia e central de ajuda
src/db        Dexie (banco do navegador) e laudo de exemplo
src/laudo     documento A4 e modo leitura
src/paginas   telas (site, entrar, painel, editor, ajustes, usuários)
docs/         arquitetura do backend e pesquisa de concorrentes
```

## Deploy
GitHub Pages pela branch `feat/react-vite-ia` (`.github/workflows/pages.yml`).
