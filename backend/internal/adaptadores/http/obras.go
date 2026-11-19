package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/arquivos"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/obra"
)

// Gestão de obras: o app manda o documento da obra inteiro (etapas, diário, financeiro, compras) e as fotos do diário.

func (s *Servidor) rotasObras(mux *http.ServeMux, publico *limitador) {
	mux.Handle("GET /api/obras", s.logado(s.listarObras))
	mux.Handle("PUT /api/obras/{id}", s.logado(s.salvarObra))
	mux.Handle("DELETE /api/obras/{id}", s.logado(s.apagarObra))
	mux.Handle("PUT /api/obras/{id}/fotos/{foto}", s.logado(s.salvarFotoObra))
	mux.Handle("DELETE /api/obras/{id}/fotos/{foto}", s.logado(s.apagarFotoObra))
	mux.Handle("GET /api/obras/{id}/fotos/{foto}", s.logado(s.arquivoFotoObra))
	mux.Handle("POST /api/obras/{id}/link", s.logado(s.criarLinkObra))
	mux.Handle("DELETE /api/obras/{id}/link", s.logado(s.apagarLinkObra))
	mux.Handle("GET /api/publico/obra/{token}", publico.envolver(http.HandlerFunc(s.obraPublica)))
	mux.Handle("GET /api/publico/obra/{token}/fotos/{foto}", publico.envolver(http.HandlerFunc(s.fotoObraPublica)))
}

// guardarImagens sobe imagem + miniatura para o storage (mesmo padrão para laudo e obra).
// Em erro já responde ao app e devolve ok=false.
func (s *Servidor) guardarImagens(w http.ResponseWriter, r *http.Request, base string, img []byte, tipoImg string, mini []byte, tipoMini string) (string, string, bool) {
	chaveImg, chaveMini := base+extensao(tipoImg), base+"_mini"+extensao(tipoMini)
	if err := s.Arquivos.Enviar(r.Context(), chaveImg, img, tipoImg); err != nil {
		slog.Error("storage", "erro", err)
		erro(w, http.StatusBadGateway, "Não deu para guardar a imagem agora. Tente de novo.")
		return "", "", false
	}
	if err := s.Arquivos.Enviar(r.Context(), chaveMini, mini, tipoMini); err != nil {
		slog.Error("storage", "erro", err)
		erro(w, http.StatusBadGateway, "Não deu para guardar a miniatura agora. Tente de novo.")
		return "", "", false
	}
	return chaveImg, chaveMini, true
}

// servirImagem baixa do storage e entrega a imagem (mesmo padrão para laudo, obra e links públicos).
func (s *Servidor) servirImagem(w http.ResponseWriter, r *http.Request, chave, cache string) {
	b, tipo, err := s.Arquivos.Baixar(r.Context(), chave)
	if err != nil {
		if !errors.Is(err, arquivos.ErrNaoExiste) {
			slog.Error("storage", "erro", err)
		}
		erro(w, http.StatusNotFound, "Imagem não encontrada.")
		return
	}
	if !strings.HasPrefix(tipo, "image/") {
		tipo = http.DetectContentType(b)
	}
	w.Header().Set("Content-Type", tipo)
	w.Header().Set("Cache-Control", cache)
	_, _ = w.Write(b)
}

func (s *Servidor) listarObras(w http.ResponseWriter, r *http.Request) {
	os, err := s.Banco.ListarObras(r.Context(), usuarioDe(r))
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"obras": os, "maxFotos": obra.MaxFotosObra})
}

func (s *Servidor) salvarObra(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, obra.MaxDocumento+64<<10)
	var o obra.Registro
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		erro(w, http.StatusBadRequest, "JSON inválido ou obra grande demais.")
		return
	}
	o.ID = r.PathValue("id")
	if err := o.Validar(); err != nil {
		erro(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.Banco.SalvarObra(r.Context(), usuarioDe(r), o); err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"ok": true})
}

func (s *Servidor) apagarObra(w http.ResponseWriter, r *http.Request) {
	if !conta.Pode(usuarioDe(r).Papel, conta.ApagarRegistro) {
		erro(w, http.StatusForbidden, "Só o administrador ou o engenheiro apagam obras.")
		return
	}
	chaves, err := s.Banco.ApagarObra(r.Context(), usuarioDe(r), r.PathValue("id"))
	if err != nil {
		responderDados(w, err)
		return
	}
	s.limparArquivos(chaves)
	w.WriteHeader(http.StatusNoContent)
}

// PUT /api/obras/{id}/fotos/{foto}  multipart: imagem e miniatura
func (s *Servidor) salvarFotoObra(w http.ResponseWriter, r *http.Request) {
	if s.Arquivos == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem storage de imagens configurado.")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 2*maxArquivo+1<<20)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		erro(w, http.StatusBadRequest, "Envie multipart/form-data com imagem e miniatura (máx. 6 MB).")
		return
	}
	img, tipoImg, err1 := lerArquivo(r, "imagem")
	mini, tipoMini, err2 := lerArquivo(r, "miniatura")
	if err1 != nil || err2 != nil || img == nil || mini == nil {
		erro(w, http.StatusBadRequest, "Envie a imagem e a miniatura da foto.")
		return
	}
	u, obraID, fotoID := usuarioDe(r), r.PathValue("id"), r.PathValue("foto")
	n, err := s.Banco.ContarFotosObra(r.Context(), u, obraID)
	if err != nil {
		responderDados(w, err)
		return
	}
	if atual, _, _ := s.Banco.ChavesFotoObra(r.Context(), u, obraID, fotoID); atual == "" && n >= obra.MaxFotosObra {
		responderDados(w, obra.ErrLimiteFotos)
		return
	}
	chaveImg, chaveMini, ok := s.guardarImagens(w, r, "org/"+u.OrganizacaoID+"/obras/"+obraID+"/"+fotoID, img, tipoImg, mini, tipoMini)
	if !ok {
		return
	}
	if err := s.Banco.SalvarFotoObra(r.Context(), u, obraID, fotoID, chaveImg, chaveMini, len(img)+len(mini)); err != nil {
		s.limparArquivos([]string{chaveImg, chaveMini})
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"ok": true})
}

func (s *Servidor) apagarFotoObra(w http.ResponseWriter, r *http.Request) {
	chaves, err := s.Banco.ApagarFotoObra(r.Context(), usuarioDe(r), r.PathValue("id"), r.PathValue("foto"))
	if err != nil {
		responderDados(w, err)
		return
	}
	s.limparArquivos(chaves)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Servidor) arquivoFotoObra(w http.ResponseWriter, r *http.Request) {
	if s.Arquivos == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem storage de imagens configurado.")
		return
	}
	img, mini, err := s.Banco.ChavesFotoObra(r.Context(), usuarioDe(r), r.PathValue("id"), r.PathValue("foto"))
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
	s.servirImagem(w, r, chave, "private, max-age=86400")
}

// POST /api/obras/{id}/link {financeiro: bool} → {token}
func (s *Servidor) criarLinkObra(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Financeiro bool `json:"financeiro"`
	}
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&in)
	novo, _, err := conta.NovoToken()
	if err != nil {
		responderDados(w, err)
		return
	}
	t, err := s.Banco.CriarLinkObra(r.Context(), usuarioDe(r), r.PathValue("id"), novo, in.Financeiro)
	if err != nil {
		responderDados(w, err)
		return
	}
	json200(w, map[string]any{"token": t})
}

func (s *Servidor) apagarLinkObra(w http.ResponseWriter, r *http.Request) {
	if err := s.Banco.ApagarLinkObra(r.Context(), usuarioDe(r), r.PathValue("id")); err != nil {
		responderDados(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/publico/obra/{token} → {obra (sem financeiro, se não liberado), fotos, autor}
func (s *Servidor) obraPublica(w http.ResponseWriter, r *http.Request) {
	if s.Banco == nil {
		erro(w, http.StatusServiceUnavailable, "O servidor está sem banco de dados configurado.")
		return
	}
	t := r.PathValue("token")
	if !tokenValido(t) {
		erro(w, http.StatusNotFound, "Link inválido ou desligado pelo responsável.")
		return
	}
	o, fin, fotos, autor, err := s.Banco.ObraPublica(r.Context(), t)
	if errors.Is(err, laudo.ErrNaoEncontrado) {
		erro(w, http.StatusNotFound, "Link inválido ou desligado pelo responsável.")
		return
	}
	if err != nil {
		responderDados(w, err)
		return
	}
	o.Dados, o.UsuarioID = obra.Publico(o.Dados, fin), ""
	w.Header().Set("Cache-Control", "no-store")
	json200(w, map[string]any{"obra": o, "financeiro": fin, "fotos": fotos, "autor": map[string]string{
		"nome": autor.Nome, "profissao": autor.Profissao, "registro": autor.Registro, "telefone": autor.Telefone, "cidade": autor.Cidade, "uf": autor.UF,
	}})
}

func (s *Servidor) fotoObraPublica(w http.ResponseWriter, r *http.Request) {
	if s.Banco == nil || s.Arquivos == nil {
		erro(w, http.StatusServiceUnavailable, "Servidor sem banco ou storage.")
		return
	}
	t := r.PathValue("token")
	if !tokenValido(t) {
		erro(w, http.StatusNotFound, "Foto não encontrada.")
		return
	}
	img, mini, err := s.Banco.ChavesFotoObraPublica(r.Context(), t, r.PathValue("foto"))
	if err != nil {
		erro(w, http.StatusNotFound, "Foto não encontrada.")
		return
	}
	chave := img
	if r.URL.Query().Get("tam") == "mini" {
		chave = mini
	}
	s.servirImagem(w, r, chave, "private, max-age=3600")
}
