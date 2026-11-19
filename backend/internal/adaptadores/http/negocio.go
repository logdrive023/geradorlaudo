package http

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base32"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

// Organização com papéis, cliente pelo link, autenticidade, biblioteca, agenda, uso e webhooks.
// Tudo aqui é novo: as rotas antigas não mudam. Desenho em docs/ORGANIZACAO.md.

const duracaoConvite = 7 * 24 * time.Hour

func (s *Servidor) rotasNegocio(mux *http.ServeMux, publico *limitador) {
	escrita := novoLimitador(20) // o que alguém de fora grava (convite, resposta do cliente): 20 por minuto por IP
	// organização e equipe
	mux.Handle("GET /api/org", s.comNegocio(s.lerOrg))
	mux.Handle("PUT /api/org", s.comNegocio(s.exige(conta.GerirOrganizacao, s.salvarOrg)))
	mux.Handle("GET /api/org/usuarios", s.comNegocio(s.listarUsuarios))
	mux.Handle("PATCH /api/org/usuarios/{id}", s.comNegocio(s.exige(conta.GerirEquipe, s.alterarUsuario)))
	mux.Handle("GET /api/org/convites", s.comNegocio(s.exige(conta.GerirEquipe, s.listarConvites)))
	mux.Handle("POST /api/org/convites", s.comNegocio(s.exige(conta.GerirEquipe, s.convidar)))
	mux.Handle("GET /api/org/auditoria", s.comNegocio(s.exige(conta.VerAuditoria, s.auditoria)))
	mux.Handle("GET /api/convite/{token}", publico.envolver(http.HandlerFunc(s.lerConvite)))
	mux.Handle("POST /api/convite/{token}", escrita.envolver(http.HandlerFunc(s.aceitarConvite)))

	// quem trabalha em cada laudo/obra
	mux.Handle("GET /api/membros/{tipo}/{id}", s.comNegocio(s.membros))
	mux.Handle("PUT /api/membros/{tipo}/{id}", s.comNegocio(s.exige(conta.Atribuir, s.definirMembros)))

	// cliente pelo link
	mux.Handle("POST /api/publico/{token}/respostas", escrita.envolver(http.HandlerFunc(s.responderLaudo)))
	mux.Handle("POST /api/publico/obra/{token}/respostas", escrita.envolver(http.HandlerFunc(s.responderObra)))
	mux.Handle("GET /api/laudos/{id}/respostas", s.comNegocio(s.respostas("laudo")))
	mux.Handle("GET /api/obras/{id}/respostas", s.comNegocio(s.respostas("obra")))

	// autenticidade (QR no PDF)
	mux.Handle("POST /api/laudos/{id}/emitir", s.comNegocio(s.exige(conta.EmitirLaudo, s.emitir)))
	mux.Handle("GET /api/verificar/{codigo}", publico.envolver(http.HandlerFunc(s.verificar)))

	// biblioteca de textos e agenda
	mux.Handle("GET /api/biblioteca", s.comNegocio(s.biblioteca))
	mux.Handle("POST /api/biblioteca", s.comNegocio(s.salvarTexto))
	mux.Handle("DELETE /api/biblioteca/{id}", s.comNegocio(s.apagarTexto))
	mux.Handle("GET /api/agenda", s.comNegocio(s.agenda))
	mux.Handle("POST /api/agenda", s.comNegocio(s.salvarAgendamento))
	mux.Handle("DELETE /api/agenda/{id}", s.comNegocio(s.apagarAgendamento))

	// cobrança e WhatsApp: só respondem quando o segredo está no servidor
	mux.HandleFunc("POST /api/pagamentos/asaas", s.webhookAsaas)
	mux.HandleFunc("GET /api/whatsapp/webhook", s.verificarWhatsApp)
	mux.HandleFunc("POST /api/whatsapp/webhook", s.webhookWhatsApp)
}

// ---------- auxiliares ----------

// comNegocio: exige login e o módulo de negócio (banco novo) disponível.
func (s *Servidor) comNegocio(fn http.HandlerFunc) http.Handler {
	return s.logado(func(w http.ResponseWriter, r *http.Request) {
		if s.Negocio == nil {
			erro(w, http.StatusServiceUnavailable, "Recurso ainda não disponível neste servidor.")
			return
		}
		fn(w, r)
	})
}

// exige confere o papel antes de seguir (a mesma regra vale para a tela).
func (s *Servidor) exige(a conta.Acao, fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !conta.Pode(usuarioDe(r).Papel, a) {
			erro(w, http.StatusForbidden, "Seu papel na organização não permite isso. Fale com o administrador.")
			return
		}
		fn(w, r)
	}
}

func permissoesDe(p conta.Papel) map[string]bool {
	out := map[string]bool{}
	for _, a := range []conta.Acao{conta.GerirEquipe, conta.GerirOrganizacao, conta.VerAuditoria, conta.Atribuir, conta.EmitirLaudo, conta.ApagarRegistro, conta.VerFinanceiro} {
		out[string(a)] = conta.Pode(p, a)
	}
	return out
}

func resumoIP(r *http.Request) string {
	h := sha256.Sum256([]byte("laudotech:" + ipDe(r)))
	return hex.EncodeToString(h[:])
}

func codigoNovo() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return strings.TrimRight(base32.StdEncoding.EncodeToString(b), "=")[:12]
}

func limpo(s string, n int) string {
	s = strings.TrimSpace(s)
	if r := []rune(s); len(r) > n {
		return string(r[:n])
	}
	return s
}

// ---------- organização e equipe ----------

func (s *Servidor) lerOrg(w http.ResponseWriter, r *http.Request) {
	u := usuarioDe(r)
	o, a, uso, err := s.Negocio.Organizacao(r.Context(), u)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"organizacao": o, "assinatura": a, "uso": uso, "papel": u.Papel, "permissoes": permissoesDe(u.Papel), "auditoria": s.AuditoriaLigada})
}

func (s *Servidor) salvarOrg(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Nome   string          `json:"nome"`
		CNPJ   string          `json:"cnpj"`
		Config json.RawMessage `json:"config"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	in.Nome = limpo(in.Nome, 120)
	if in.Nome == "" || len(in.Config) > 64<<10 {
		erro(w, http.StatusBadRequest, "Informe o nome da organização.")
		return
	}
	u := usuarioDe(r)
	if err := s.Negocio.SalvarOrganizacao(r.Context(), u, in.Nome, limpo(in.CNPJ, 20), in.Config); err != nil {
		responderDados(w, err)
		return
	}
	s.Negocio.Auditar(r.Context(), u, "organizacao.alterada", "organizacao", u.OrganizacaoID, nil)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Servidor) listarUsuarios(w http.ResponseWriter, r *http.Request) {
	us, err := s.Negocio.ListarUsuarios(r.Context(), usuarioDe(r))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"usuarios": us})
}

func (s *Servidor) alterarUsuario(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Papel *string `json:"papel"`
		Ativo *bool   `json:"ativo"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	if in.Papel != nil && !conta.PapelValido(*in.Papel) {
		erro(w, http.StatusBadRequest, "Papel inválido: use admin, engenheiro ou assistente.")
		return
	}
	u, id := usuarioDe(r), r.PathValue("id")
	if err := s.Negocio.AlterarUsuario(r.Context(), u, id, in.Papel, in.Ativo); err != nil {
		responderDados(w, err)
		return
	}
	s.Negocio.Auditar(r.Context(), u, "usuario.alterado", "usuario", id, in)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Servidor) listarConvites(w http.ResponseWriter, r *http.Request) {
	cs, err := s.Negocio.ListarConvites(r.Context(), usuarioDe(r))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"convites": cs})
}

// POST /api/org/convites {email, nome, papel} → {token}. O link só aparece aqui, uma vez.
func (s *Servidor) convidar(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
		Nome  string `json:"nome"`
		Papel string `json:"papel"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	email := conta.NormalizarEmail(in.Email)
	if !strings.Contains(email, "@") || len(email) > 200 || !conta.PapelValido(in.Papel) {
		erro(w, http.StatusBadRequest, "Informe um e-mail válido e o papel (admin, engenheiro ou assistente).")
		return
	}
	token, resumo, err := conta.NovoToken()
	if err != nil {
		responderDados(w, err)
		return
	}
	u := usuarioDe(r)
	c := portas.Convite{Email: email, Nome: limpo(in.Nome, 120), Papel: in.Papel, ExpiraEm: time.Now().Add(duracaoConvite)}
	if err := s.Negocio.CriarConvite(r.Context(), u, c, resumo); err != nil {
		responderDados(w, err)
		return
	}
	s.Negocio.Auditar(r.Context(), u, "usuario.convidado", "convite", email, map[string]string{"papel": in.Papel})
	json200(w, map[string]any{"token": token, "expiraEm": c.ExpiraEm})
}

func (s *Servidor) lerConvite(w http.ResponseWriter, r *http.Request) {
	if s.Negocio == nil || !tokenValido(r.PathValue("token")) {
		erro(w, http.StatusNotFound, "Convite não encontrado ou vencido.")
		return
	}
	c, err := s.Negocio.LerConvite(r.Context(), conta.ResumoToken(r.PathValue("token")))
	if err != nil {
		erro(w, http.StatusNotFound, "Convite não encontrado ou vencido.")
		return
	}
	json200(w, map[string]any{"convite": c})
}

// POST /api/convite/{token} {nome, senha} → cria a conta e já entra.
func (s *Servidor) aceitarConvite(w http.ResponseWriter, r *http.Request) {
	if s.Negocio == nil || !tokenValido(r.PathValue("token")) {
		erro(w, http.StatusNotFound, "Convite não encontrado ou vencido.")
		return
	}
	var in struct {
		Nome  string `json:"nome"`
		Senha string `json:"senha"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	if len([]rune(in.Senha)) < 8 || len(in.Senha) > 200 {
		erro(w, http.StatusBadRequest, "A senha precisa ter pelo menos 8 caracteres.")
		return
	}
	hash, err := conta.ResumoSenha(in.Senha)
	if err != nil {
		responderDados(w, err)
		return
	}
	u, err := s.Negocio.AceitarConvite(r.Context(), conta.ResumoToken(r.PathValue("token")), limpo(in.Nome, 120), hash)
	if err != nil {
		if err == laudo.ErrNaoEncontrado {
			erro(w, http.StatusNotFound, "Convite não encontrado ou vencido.")
			return
		}
		responderDados(w, err)
		return
	}
	token, resumo, err := conta.NovoToken()
	if err != nil {
		responderDados(w, err)
		return
	}
	if err := s.Banco.CriarSessao(r.Context(), u.ID, resumo, time.Now().Add(duracaoSessao)); err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"token": token, "usuario": u})
}

func (s *Servidor) auditoria(w http.ResponseWriter, r *http.Request) {
	ev, err := s.Negocio.Auditoria(r.Context(), usuarioDe(r), 200)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"eventos": ev})
}

// ---------- membros ----------

func tipoAlvo(t string) bool { return t == "laudo" || t == "obra" }

func (s *Servidor) membros(w http.ResponseWriter, r *http.Request) {
	if !tipoAlvo(r.PathValue("tipo")) {
		erro(w, http.StatusNotFound, "Não encontrado.")
		return
	}
	ms, err := s.Negocio.Membros(r.Context(), usuarioDe(r), r.PathValue("tipo"), r.PathValue("id"))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"membros": ms})
}

func (s *Servidor) definirMembros(w http.ResponseWriter, r *http.Request) {
	tipo, id := r.PathValue("tipo"), r.PathValue("id")
	if !tipoAlvo(tipo) {
		erro(w, http.StatusNotFound, "Não encontrado.")
		return
	}
	var in struct {
		Usuarios []string `json:"usuarios"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	if len(in.Usuarios) > 50 {
		erro(w, http.StatusBadRequest, "Pessoas demais.")
		return
	}
	u := usuarioDe(r)
	if err := s.Negocio.DefinirMembros(r.Context(), u, tipo, id, in.Usuarios); err != nil {
		responderDados(w, err)
		return
	}
	s.Negocio.Auditar(r.Context(), u, tipo+".equipe", tipo, id, in.Usuarios)
	w.WriteHeader(http.StatusNoContent)
}

// ---------- cliente pelo link ----------

var tiposResposta = map[string]bool{"aceite": true, "comentario": true, "contestacao": true, "reparo": true, "aprovacao": true}

func (s *Servidor) responder(w http.ResponseWriter, r *http.Request, alvo string) {
	if s.Negocio == nil || !tokenValido(r.PathValue("token")) {
		erro(w, http.StatusNotFound, "Link não encontrado.")
		return
	}
	var in struct {
		Tipo         string          `json:"tipo"`
		AchadoID     string          `json:"achadoId"`
		Nome         string          `json:"nome"`
		Documento    string          `json:"documento"`
		Texto        string          `json:"texto"`
		Dados        json.RawMessage `json:"dados"`
		HashConteudo string          `json:"hashConteudo"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	nome := limpo(in.Nome, 120)
	if !tiposResposta[in.Tipo] || len([]rune(nome)) < 2 || len(in.Dados) > 16<<10 {
		erro(w, http.StatusBadRequest, "Informe seu nome e o que deseja registrar.")
		return
	}
	if in.Tipo != "aceite" && in.Tipo != "aprovacao" && strings.TrimSpace(in.Texto) == "" && len(in.Dados) == 0 {
		erro(w, http.StatusBadRequest, "Escreva sua mensagem.")
		return
	}
	if len(in.AchadoID) > 0 && len(in.AchadoID) != 36 {
		in.AchadoID = ""
	}
	resp, err := s.Negocio.ResponderPorLink(r.Context(), alvo, r.PathValue("token"), portas.RespostaCliente{
		Tipo: in.Tipo, AchadoID: in.AchadoID, Nome: nome, Documento: limpo(in.Documento, 20), Texto: limpo(in.Texto, 4000),
		Dados: in.Dados, HashConteudo: limpo(in.HashConteudo, 128), IPHash: resumoIP(r), Agente: limpo(r.UserAgent(), 300),
	})
	if err != nil {
		if err == laudo.ErrNaoEncontrado {
			erro(w, http.StatusNotFound, "Link não encontrado ou desligado.")
			return
		}
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"resposta": resp})
}

func (s *Servidor) responderLaudo(w http.ResponseWriter, r *http.Request) { s.responder(w, r, "laudo") }
func (s *Servidor) responderObra(w http.ResponseWriter, r *http.Request)  { s.responder(w, r, "obra") }

func (s *Servidor) respostas(tipo string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rs, err := s.Negocio.Respostas(r.Context(), usuarioDe(r), tipo, r.PathValue("id"))
		if err != nil {
			responderDados(w, err)
			return
		}
		json200(w, map[string]any{"respostas": rs})
	}
}

// ---------- autenticidade ----------

// POST /api/laudos/{id}/emitir: congela o resumo (SHA-256) do conteúdo e gera o código do QR.
func (s *Servidor) emitir(w http.ResponseWriter, r *http.Request) {
	u, id := usuarioDe(r), r.PathValue("id")
	l, fotos, err := s.Banco.LerLaudo(r.Context(), u, id)
	if err != nil {
		responderDados(w, err)
		return
	}
	conteudo, _ := json.Marshal(map[string]any{"laudo": l, "fotos": fotos})
	h := sha256.Sum256(conteudo)
	e, err := s.Negocio.Emitir(r.Context(), u, id, hex.EncodeToString(h[:]), codigoNovo())
	if err != nil {
		responderDados(w, err)
		return
	}
	s.Negocio.Auditar(r.Context(), u, "laudo.emitido", "laudo", id, map[string]string{"codigo": e.Codigo})
	json200(w, map[string]any{"emissao": e})
}

func (s *Servidor) verificar(w http.ResponseWriter, r *http.Request) {
	c := strings.ToUpper(strings.TrimSpace(r.PathValue("codigo")))
	if s.Negocio == nil || len(c) < 6 || len(c) > 20 {
		erro(w, http.StatusNotFound, "Código não encontrado.")
		return
	}
	v, err := s.Negocio.Verificar(r.Context(), c)
	if err != nil {
		erro(w, http.StatusNotFound, "Código não encontrado: este laudo não foi emitido pelo LaudoTech.")
		return
	}
	json200(w, map[string]any{"verificacao": v})
}

// ---------- biblioteca ----------

func (s *Servidor) biblioteca(w http.ResponseWriter, r *http.Request) {
	ts, err := s.Negocio.Biblioteca(r.Context(), usuarioDe(r))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"textos": ts})
}

func (s *Servidor) salvarTexto(w http.ResponseWriter, r *http.Request) {
	var t portas.TextoBiblioteca
	if !lerJSON(w, r, &t) {
		return
	}
	t.Tipo, t.Sistema = limpo(t.Tipo, 80), limpo(t.Sistema, 80)
	t.Descricao, t.Causa, t.Recomendacao = limpo(t.Descricao, 2000), limpo(t.Causa, 2000), limpo(t.Recomendacao, 2000)
	if t.Gravidade != "critico" && t.Gravidade != "medio" && t.Gravidade != "minimo" {
		t.Gravidade = "minimo"
	}
	if t.Tipo == "" {
		erro(w, http.StatusBadRequest, "Informe o tipo da anomalia.")
		return
	}
	out, err := s.Negocio.SalvarTexto(r.Context(), usuarioDe(r), t)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"texto": out})
}

func (s *Servidor) apagarTexto(w http.ResponseWriter, r *http.Request) {
	if err := s.Negocio.ApagarTexto(r.Context(), usuarioDe(r), r.PathValue("id")); err != nil {
		responderDados(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- agenda ----------

func (s *Servidor) agenda(w http.ResponseWriter, r *http.Request) {
	de, err1 := time.Parse(time.RFC3339, r.URL.Query().Get("de"))
	ate, err2 := time.Parse(time.RFC3339, r.URL.Query().Get("ate"))
	if err1 != nil || err2 != nil {
		de = time.Now().AddDate(0, 0, -7)
		ate = time.Now().AddDate(0, 2, 0)
	}
	as, err := s.Negocio.Agenda(r.Context(), usuarioDe(r), de, ate)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"agenda": as})
}

func (s *Servidor) salvarAgendamento(w http.ResponseWriter, r *http.Request) {
	var a portas.Agendamento
	if !lerJSON(w, r, &a) {
		return
	}
	if a.Inicio.IsZero() {
		erro(w, http.StatusBadRequest, "Informe a data e a hora.")
		return
	}
	if a.DuracaoMin < 15 || a.DuracaoMin > 1440 {
		a.DuracaoMin = 60
	}
	if a.Status != "feito" && a.Status != "cancelado" {
		a.Status = "marcado"
	}
	a.ClienteNome, a.ClienteContato, a.Endereco = limpo(a.ClienteNome, 120), limpo(a.ClienteContato, 120), limpo(a.Endereco, 300)
	a.Tipo, a.Observacao = limpo(a.Tipo, 40), limpo(a.Observacao, 2000)
	out, err := s.Negocio.SalvarAgendamento(r.Context(), usuarioDe(r), a)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"agendamento": out})
}

func (s *Servidor) apagarAgendamento(w http.ResponseWriter, r *http.Request) {
	if err := s.Negocio.ApagarAgendamento(r.Context(), usuarioDe(r), r.PathValue("id")); err != nil {
		responderDados(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- uso de IA (quem está logado) ----------

// registrarUso conta a análise para a organização, quando o pedido vem de alguém logado.
func (s *Servidor) registrarUso(r *http.Request, motor, evento string) {
	if s.Negocio == nil || s.Banco == nil {
		return
	}
	t := tokenDe(r)
	if t == "" {
		return
	}
	u, err := s.Banco.UsuarioDaSessao(r.Context(), conta.ResumoToken(t))
	if err != nil {
		return
	}
	s.Negocio.RegistrarUso(r.Context(), u, limpo(r.FormValue("laudoId"), 36), motor, evento)
}

// ---------- webhooks (preparados; desligados sem o segredo no servidor) ----------

// POST /api/pagamentos/asaas: o Asaas manda o token configurado no cabeçalho asaas-access-token.
func (s *Servidor) webhookAsaas(w http.ResponseWriter, r *http.Request) {
	if s.AsaasToken == "" || s.Negocio == nil {
		http.NotFound(w, r)
		return
	}
	if subtle.ConstantTimeCompare([]byte(r.Header.Get("asaas-access-token")), []byte(s.AsaasToken)) != 1 {
		erro(w, http.StatusUnauthorized, "Token inválido.")
		return
	}
	corpo, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 256<<10))
	if err != nil {
		erro(w, http.StatusBadRequest, "Corpo inválido.")
		return
	}
	var ev struct {
		ID    string `json:"id"`
		Event string `json:"event"`
	}
	if json.Unmarshal(corpo, &ev) != nil || ev.ID == "" {
		erro(w, http.StatusBadRequest, "Evento sem id.")
		return
	}
	if _, err := s.Negocio.GuardarEventoPagamento(r.Context(), ev.ID, "asaas", ev.Event, corpo); err != nil {
		responderDados(w, err)
		return
	}
	// o processamento (ativar plano, créditos) entra quando a cobrança for ligada
	w.WriteHeader(http.StatusOK)
}

// GET /api/whatsapp/webhook: verificação do Meta (WhatsApp Cloud API).
func (s *Servidor) verificarWhatsApp(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if s.WhatsAppVerificacao == "" || q.Get("hub.mode") != "subscribe" ||
		subtle.ConstantTimeCompare([]byte(q.Get("hub.verify_token")), []byte(s.WhatsAppVerificacao)) != 1 {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	_, _ = w.Write([]byte(q.Get("hub.challenge")))
}

// POST /api/whatsapp/webhook: guarda as mensagens recebidas para a Lia organizar (processamento: próxima etapa).
func (s *Servidor) webhookWhatsApp(w http.ResponseWriter, r *http.Request) {
	if s.WhatsAppVerificacao == "" || s.Negocio == nil {
		http.NotFound(w, r)
		return
	}
	corpo, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 512<<10))
	if err != nil {
		erro(w, http.StatusBadRequest, "Corpo inválido.")
		return
	}
	if s.WhatsAppSegredo != "" { // assinatura do Meta: X-Hub-Signature-256 = sha256=HMAC(corpo)
		m := hmac.New(sha256.New, []byte(s.WhatsAppSegredo))
		m.Write(corpo)
		esperado := "sha256=" + hex.EncodeToString(m.Sum(nil))
		if !hmac.Equal([]byte(esperado), []byte(r.Header.Get("X-Hub-Signature-256"))) {
			erro(w, http.StatusUnauthorized, "Assinatura inválida.")
			return
		}
	}
	var p struct {
		Entry []struct {
			Changes []struct {
				Value struct {
					Messages []struct {
						From string `json:"from"`
						Type string `json:"type"`
						Text struct {
							Body string `json:"body"`
						} `json:"text"`
						Image, Audio, Document struct {
							ID string `json:"id"`
						}
					} `json:"messages"`
				} `json:"value"`
			} `json:"changes"`
		} `json:"entry"`
	}
	_ = json.Unmarshal(corpo, &p)
	for _, e := range p.Entry {
		for _, c := range e.Changes {
			for _, m := range c.Value.Messages {
				midia := m.Image.ID + m.Audio.ID + m.Document.ID
				_ = s.Negocio.GuardarEntrada(r.Context(), "whatsapp", limpo(m.From, 30), limpo(m.Type, 20), limpo(m.Text.Body, 4000), limpo(midia, 200))
			}
		}
	}
	w.WriteHeader(http.StatusOK) // o Meta só precisa do 200
}
