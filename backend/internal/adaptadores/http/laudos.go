package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/arquivos"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

const duracaoSessao = 30 * 24 * time.Hour

// hash de mentira: quando o e-mail não existe, a conferência demora o mesmo (não entrega quem tem conta)
var hashFalso, _ = conta.ResumoSenha("senha-que-ninguem-usa")

func (s *Servidor) rotasDados(mux *http.ServeMux, limite *limitador) {
	mux.Handle("POST /api/auth/entrar", limite.envolver(http.HandlerFunc(s.entrar)))
	mux.Handle("GET /api/auth/eu", s.logado(s.eu))
	mux.Handle("POST /api/auth/sair", s.logado(s.sair))

	mux.Handle("GET /api/laudos", s.logado(s.listarLaudos))
	mux.Handle("GET /api/laudos/{id}", s.logado(s.lerLaudo))
	mux.Handle("PUT /api/laudos/{id}", s.logado(s.salvarLaudo))
	mux.Handle("DELETE /api/laudos/{id}", s.logado(s.apagarLaudo))
	mux.Handle("PUT /api/laudos/{id}/fotos/{foto}", s.logado(s.salvarFoto))
	mux.Handle("DELETE /api/laudos/{id}/fotos/{foto}", s.logado(s.apagarFoto))
	mux.Handle("GET /api/laudos/{id}/fotos/{foto}/arquivo", s.logado(s.arquivoFoto))
}

// ---------- sessão ----------

type chaveUsuario struct{}

func usuarioDe(r *http.Request) conta.Usuario { return r.Context().Value(chaveUsuario{}).(conta.Usuario) }

func tokenDe(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if t, ok := strings.CutPrefix(h, "Bearer "); ok {
		return strings.TrimSpace(t)
	}
	return ""
}

// logado exige banco + token válido e põe o usuário no contexto.
func (s *Servidor) logado(fn http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if s.Banco == nil {
			erro(w, http.StatusServiceUnavailable, "O servidor está sem banco de dados configurado.")
			return
		}
		t := tokenDe(r)
		if t == "" {
			erro(w, http.StatusUnauthorized, "Entre de novo para continuar.")
			return
		}
		u, err := s.Banco.UsuarioDaSessao(r.Context(), conta.ResumoToken(t))
		if err != nil {
			if errors.Is(err, laudo.ErrNaoEncontrado) {
				erro(w, http.StatusUnauthorized, "Sua sessão terminou. Entre de novo.")
				return
			}
			responderDados(w, err)
			return
		}
		fn(w, r.WithContext(context.WithValue(r.Context(), chaveUsuario{}, u)))
	})
}

// POST /api/auth/entrar {email, senha} → {token, usuario}
func (s *Servidor) entrar(w http.ResponseWriter, r *http.Request) {
	if s.Banco == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem banco de dados configurado.")
		return
	}
	var in struct {
		Email string `json:"email"`
		Senha string `json:"senha"`
	}
	if !lerJSON(w, r, &in) {
		return
	}
	u, hash, err := s.Banco.UsuarioPorEmail(r.Context(), conta.NormalizarEmail(in.Email))
	if err != nil && !errors.Is(err, laudo.ErrNaoEncontrado) {
		responderDados(w, err)
		return
	}
	if err != nil {
		hash = hashFalso
	}
	if !conta.ConfereSenha(in.Senha, hash) || err != nil {
		erro(w, http.StatusUnauthorized, "E-mail ou senha não conferem.")
		return
	}
	if !u.Ativo {
		erro(w, http.StatusForbidden, "Esta conta está desativada. Fale com o administrador.")
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

func (s *Servidor) eu(w http.ResponseWriter, r *http.Request) {
	json200(w, map[string]any{"usuario": usuarioDe(r)})
}

func (s *Servidor) sair(w http.ResponseWriter, r *http.Request) {
	_ = s.Banco.ApagarSessao(r.Context(), conta.ResumoToken(tokenDe(r)))
	w.WriteHeader(http.StatusNoContent)
}

// ---------- laudos ----------

func (s *Servidor) listarLaudos(w http.ResponseWriter, r *http.Request) {
	ls, err := s.Banco.ListarLaudos(r.Context(), usuarioDe(r))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"laudos": ls, "maxFotos": laudo.MaxFotosPorLaudo})
}

func (s *Servidor) lerLaudo(w http.ResponseWriter, r *http.Request) {
	l, fotos, err := s.Banco.LerLaudo(r.Context(), usuarioDe(r), r.PathValue("id"))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"laudo": l, "fotos": fotos})
}

func (s *Servidor) salvarLaudo(w http.ResponseWriter, r *http.Request) {
	var l laudo.Registro
	if !lerJSON(w, r, &l) {
		return
	}
	l.ID = r.PathValue("id")
	if err := l.Validar(); err != nil {
		erro(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Banco.SalvarLaudo(r.Context(), usuarioDe(r), l); err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"ok": true})
}

func (s *Servidor) apagarLaudo(w http.ResponseWriter, r *http.Request) {
	chaves, err := s.Banco.ApagarLaudo(r.Context(), usuarioDe(r), r.PathValue("id"))
	if err != nil && !errors.Is(err, laudo.ErrNaoEncontrado) {
		responderDados(w, err)
		return
	}
	s.limparArquivos(chaves)
	w.WriteHeader(http.StatusNoContent)
}

// ---------- fotos ----------

const maxArquivo = 6 << 20 // a foto chega comprimida do app (~150 KB); folga para JPEG

// PUT /api/laudos/{id}/fotos/{foto}  multipart: foto (JSON), imagem e miniatura (só na primeira vez)
func (s *Servidor) salvarFoto(w http.ResponseWriter, r *http.Request) {
	if s.Arquivos == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem storage de imagens configurado.")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 2*maxArquivo+1<<20)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		erro(w, http.StatusBadRequest, "Envie multipart/form-data com o campo \"foto\" (máx. 6 MB por imagem).")
		return
	}
	var f laudo.FotoRegistro
	if err := json.Unmarshal([]byte(r.FormValue("foto")), &f); err != nil {
		erro(w, http.StatusBadRequest, "Campo \"foto\" com JSON inválido.")
		return
	}
	u := usuarioDe(r)
	f.ID, f.LaudoID = r.PathValue("foto"), r.PathValue("id")
	if err := f.Validar(); err != nil {
		erro(w, http.StatusBadRequest, err.Error())
		return
	}

	img, tipoImg, err1 := lerArquivo(r, "imagem")
	mini, tipoMini, err2 := lerArquivo(r, "miniatura")
	if err1 != nil || err2 != nil {
		erro(w, http.StatusBadRequest, "Não deu para ler a imagem.")
		return
	}
	var chaveImg, chaveMini string
	if img != nil && mini != nil {
		// limite antes de subir o arquivo: não gasta storage à toa
		atual, _, err := s.Banco.ChavesDaFoto(r.Context(), u, f.LaudoID, f.ID)
		if err != nil {
			responderDados(w, err)
			return
		}
		if atual == "" {
			if _, fotos, err := s.Banco.LerLaudo(r.Context(), u, f.LaudoID); err != nil {
				responderDados(w, err)
				return
			} else if len(fotos) >= laudo.MaxFotosPorLaudo {
				responderDados(w, laudo.ErrLimiteFotos)
				return
			}
		}
		base := "org/" + u.OrganizacaoID + "/laudos/" + f.LaudoID + "/" + f.ID
		chaveImg, chaveMini = base+extensao(tipoImg), base+"_mini"+extensao(tipoMini)
		if err := s.Arquivos.Enviar(r.Context(), chaveImg, img, tipoImg); err != nil {
			slog.Error("storage", "erro", err)
			erro(w, http.StatusBadGateway, "Não deu para guardar a imagem agora. Tente de novo.")
			return
		}
		if err := s.Arquivos.Enviar(r.Context(), chaveMini, mini, tipoMini); err != nil {
			slog.Error("storage", "erro", err)
			erro(w, http.StatusBadGateway, "Não deu para guardar a miniatura agora. Tente de novo.")
			return
		}
	}
	if err := s.Banco.SalvarFoto(r.Context(), u, f, chaveImg, chaveMini, len(img)+len(mini)); err != nil {
		if chaveImg != "" && !errors.Is(err, laudo.ErrPrecisaImagem) {
			s.limparArquivos([]string{chaveImg, chaveMini})
		}
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"ok": true})
}

func lerArquivo(r *http.Request, campo string) ([]byte, string, error) {
	arq, cab, err := r.FormFile(campo)
	if errors.Is(err, http.ErrMissingFile) {
		return nil, "", nil
	}
	if err != nil {
		return nil, "", err
	}
	defer arq.Close()
	b, err := io.ReadAll(io.LimitReader(arq, maxArquivo+1))
	if err != nil || len(b) > maxArquivo {
		return nil, "", errors.New("imagem grande demais")
	}
	tipo := http.DetectContentType(b) // não confia no que o navegador diz
	if !strings.HasPrefix(tipo, "image/") {
		return nil, "", errors.New("não é imagem")
	}
	_ = cab
	return b, tipo, nil
}

func extensao(tipo string) string {
	switch tipo {
	case "image/webp":
		return ".webp"
	case "image/png":
		return ".png"
	}
	return ".jpg"
}

func (s *Servidor) apagarFoto(w http.ResponseWriter, r *http.Request) {
	chaves, err := s.Banco.ApagarFoto(r.Context(), usuarioDe(r), r.PathValue("id"), r.PathValue("foto"))
	if err != nil {
		responderDados(w, err)
		return
	}
	s.limparArquivos(chaves)
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/laudos/{id}/fotos/{foto}/arquivo?tam=mini|imagem
func (s *Servidor) arquivoFoto(w http.ResponseWriter, r *http.Request) {
	if s.Arquivos == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem storage de imagens configurado.")
		return
	}
	img, mini, err := s.Banco.ChavesDaFoto(r.Context(), usuarioDe(r), r.PathValue("id"), r.PathValue("foto"))
	if err != nil {
		responderDados(w, err)
		return
	}
	chave := img
	if r.URL.Query().Get("tam") == "mini" {
		chave = mini
	}
	if chave == "" {
		erro(w, http.StatusNotFound, "Foto não encontrada.")
		return
	}
	b, tipo, err := s.Arquivos.Baixar(r.Context(), chave)
	if err != nil {
		if errors.Is(err, arquivos.ErrNaoExiste) {
			erro(w, http.StatusNotFound, "Imagem não encontrada no storage.")
			return
		}
		slog.Error("storage", "erro", err)
		erro(w, http.StatusBadGateway, "Não deu para buscar a imagem agora.")
		return
	}
	if tipo == "" || !strings.HasPrefix(tipo, "image/") {
		tipo = http.DetectContentType(b)
	}
	w.Header().Set("Content-Type", tipo)
	w.Header().Set("Cache-Control", "private, max-age=86400")
	_, _ = w.Write(b)
}

// limparArquivos apaga do storage em segundo plano (não segura a resposta).
func (s *Servidor) limparArquivos(chaves []string) {
	if len(chaves) == 0 || s.Arquivos == nil {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := s.Arquivos.Apagar(ctx, chaves); err != nil {
			slog.Warn("storage: não apagou", "erro", err, "chaves", len(chaves))
		}
	}()
}

func responderDados(w http.ResponseWriter, err error) {
	var dados *portas.ErroDados
	switch {
	case errors.Is(err, context.Canceled): // o app desistiu do pedido (recarregou a página): não é erro do servidor
		w.WriteHeader(499)
	case errors.Is(err, laudo.ErrNaoEncontrado):
		erro(w, http.StatusNotFound, "Não encontrado (ou é de outra conta).")
	case errors.Is(err, laudo.ErrLimiteFotos):
		erro(w, http.StatusConflict, "Na fase de teste cada laudo aceita no máximo 5 fotos.")
	case errors.Is(err, laudo.ErrPrecisaImagem):
		erro(w, http.StatusPreconditionRequired, "Envie a imagem e a miniatura desta foto.")
	case errors.As(err, &dados):
		erro(w, http.StatusBadRequest, dados.Mensagem)
	default:
		slog.Error("banco", "erro", err)
		erro(w, http.StatusInternalServerError, "Erro inesperado no servidor.")
	}
}
