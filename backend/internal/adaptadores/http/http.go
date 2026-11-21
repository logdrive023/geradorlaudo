// Package http expõe os casos de uso como API REST (JSON). Só net/http da biblioteca padrão.
package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/contratos"
	"github.com/logdrive023/geradorlaudo/backend/internal/aplicacao"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

type Servidor struct {
	IA           aplicacao.ServicoIA
	Origens      []string
	LimitePorMin int
	Versao       string
	Banco        portas.Banco    // nil = sem banco (só IA)
	Arquivos     portas.Arquivos // nil = sem storage de imagens
	Negocio      portas.Negocio  // nil = sem organização/cliente/agenda (rotas novas respondem 503)

	AuditoriaLigada     bool   // AUDITORIA=ligada: registro de atividades gravando
	AsaasToken          string // ASAAS_WEBHOOK_TOKEN: liga o aviso de pagamento
	WhatsAppVerificacao string // WHATSAPP_VERIFY_TOKEN: liga o webhook do WhatsApp
	WhatsAppSegredo     string // WHATSAPP_APP_SECRET: confere a assinatura do Meta
}

// Rotas monta o roteador com CORS envolvendo TUDO (o preflight OPTIONS também passa por ele).
func (s *Servidor) Rotas() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.saude)
	limite := novoLimitador(s.LimitePorMin)
	// IA custa dinheiro: com banco ligado, só quem está logado usa (o acesso é por convite)
	mux.Handle("POST /api/ia/analisar", limite.envolver(s.iaLogado(s.analisar)))
	mux.Handle("POST /api/ia/conclusao", limite.envolver(s.iaLogado(s.conclusao)))
	mux.Handle("POST /api/ia/lia", limite.envolver(s.iaLogado(s.lia)))
	s.rotasDados(mux, novoLimitador(10)) // login: no máximo 10 tentativas por minuto por IP
	return s.cors(registrar(mux))
}

// iaLogado exige sessão válida quando o servidor tem banco. Sem banco (só desenvolvimento), segue aberto.
func (s *Servidor) iaLogado(fn http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.Banco == nil {
			fn(w, r)
			return
		}
		s.logado(fn).ServeHTTP(w, r)
	})
}

func (s *Servidor) saude(w http.ResponseWriter, r *http.Request) {
	banco, storage := "não configurado", "não configurado"
	if s.Banco != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		banco = "ok"
		if s.Banco.Ping(ctx) != nil {
			banco = "fora"
		}
	}
	if s.Arquivos != nil {
		storage = s.Arquivos.Nome()
	}
	json200(w, map[string]any{"ok": true, "versao": s.Versao, "ia": s.IA.IA.Nome(), "modelo": s.IA.IA.Modelo(), "motores": s.IA.Catalog, "banco": banco, "storage": storage})
}

// POST /api/ia/analisar  (multipart: imagem, tipoLaudo, contexto)
func (s *Servidor) analisar(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, aplicacao.TamanhoMaximoFoto+1<<20)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		erro(w, http.StatusBadRequest, "Envie multipart/form-data com o campo \"imagem\" (máx. 8 MB).")
		return
	}
	arq, _, err := r.FormFile("imagem")
	if err != nil {
		erro(w, http.StatusBadRequest, "Faltou o campo \"imagem\".")
		return
	}
	defer arq.Close()
	dados, err := io.ReadAll(arq)
	if err != nil {
		erro(w, http.StatusBadRequest, "Não deu para ler a imagem.")
		return
	}
	a, nome, err := s.IA.AnalisarFoto(r.Context(), r.FormValue("motor"), dados, r.FormValue("tipoLaudo"), r.FormValue("contexto"), r.FormValue("instrucao"))
	if err != nil {
		responderErro(w, err)
		return
	}
	// envelope padrão: versão do contrato + quem analisou + a análise no formato do contrato
	modelo := a.Modelo
	if modelo == "" {
		if m, e := s.IA.Motor(nome); e == nil {
			modelo = m.Modelo()
		}
	}
	s.registrarUso(r, nome, "analise_foto")
	json200(w, map[string]any{"versao": contratos.VersaoAnaliseFoto, "origem": nome, "modelo": modelo, "analise": a})
}

// POST /api/ia/conclusao  {"resumo": "..."}
func (s *Servidor) conclusao(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Resumo    string `json:"resumo"`
		Instrucao string `json:"instrucao"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	t, err := s.IA.EscreverConclusao(r.Context(), in.Resumo, in.Instrucao)
	if err != nil {
		responderErro(w, err)
		return
	}
	json200(w, map[string]any{"texto": t})
}

// POST /api/ia/lia  {"contexto": "...", "conversa": [{"de":"voce","texto":"..."}]}
func (s *Servidor) lia(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Contexto  string           `json:"contexto"`
		Instrucao string           `json:"instrucao"`
		Conversa  []laudo.Mensagem `json:"conversa"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	t, err := s.IA.Conversar(r.Context(), in.Contexto, in.Instrucao, in.Conversa)
	if err != nil {
		responderErro(w, err)
		return
	}
	json200(w, map[string]any{"texto": t})
}

// ---------- respostas ----------

func json200(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(v)
}

func erro(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"erro": msg})
}

func responderErro(w http.ResponseWriter, err error) {
	var ent *aplicacao.ErroEntrada
	if errors.As(err, &ent) {
		erro(w, http.StatusBadRequest, ent.Mensagem)
		return
	}
	if e, ok := aplicacao.ComoErroIA(err); ok {
		status := map[string]int{"limite": 429, "chave": 503, "indisponivel": 503, "recusado": 422, "formato": 502}[e.Tipo]
		if status == 0 {
			status = 502
		}
		erro(w, status, e.Mensagem)
		return
	}
	slog.Error("falha inesperada", "erro", err)
	erro(w, http.StatusInternalServerError, "Erro inesperado no servidor.")
}

func lerJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 256<<10)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		erro(w, http.StatusBadRequest, "JSON inválido.")
		return false
	}
	return true
}

// ---------- middlewares ----------

func (s *Servidor) cors(next http.Handler) http.Handler {
	permitida := map[string]bool{}
	for _, o := range s.Origens {
		permitida[o] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o := r.Header.Get("Origin"); o != "" && permitida[strings.TrimRight(o, "/")] {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", o)
			h.Set("Vary", "Origin")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			h.Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type gravador struct {
	http.ResponseWriter
	status int
}

func (g *gravador) WriteHeader(c int) { g.status = c; g.ResponseWriter.WriteHeader(c) }

func registrar(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ini := time.Now()
		g := &gravador{ResponseWriter: w, status: 200}
		next.ServeHTTP(g, r)
		slog.Info("http", "metodo", r.Method, "rota", r.URL.Path, "status", g.status, "ms", time.Since(ini).Milliseconds())
	})
}

// limitador simples por IP (janela de 1 minuto) para não esgotar a cota grátis da IA.
type limitador struct {
	mu     sync.Mutex
	max    int
	contas map[string]*janela
}

type janela struct {
	inicio time.Time
	n      int
}

func novoLimitador(max int) *limitador { return &limitador{max: max, contas: map[string]*janela{}} }

func (l *limitador) envolver(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := ipDe(r)
		l.mu.Lock()
		j := l.contas[ip]
		agora := time.Now()
		if j == nil || agora.Sub(j.inicio) > time.Minute {
			j = &janela{inicio: agora}
			l.contas[ip] = j
		}
		j.n++
		passou := j.n > l.max
		if len(l.contas) > 10000 { // não crescer sem limite
			l.contas = map[string]*janela{}
		}
		l.mu.Unlock()
		if passou {
			w.Header().Set("Retry-After", "60")
			erro(w, http.StatusTooManyRequests, "Muitos pedidos de IA em pouco tempo. Espere um minuto.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func ipDe(r *http.Request) string {
	if f := r.Header.Get("X-Forwarded-For"); f != "" { // atrás do proxy do Render
		return strings.TrimSpace(strings.Split(f, ",")[0])
	}
	h, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return h
}
