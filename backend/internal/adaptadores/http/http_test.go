package http

import (
	"bytes"
	"encoding/json"
	"image"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/demo"
	"github.com/logdrive023/geradorlaudo/backend/internal/aplicacao"
)

func servidor(limite int) http.Handler {
	s := &Servidor{IA: aplicacao.ServicoIA{IA: demo.Demo{}, Timeout: 5 * time.Second}, Origens: []string{"https://app.teste"}, LimitePorMin: limite, Versao: "teste"}
	return s.Rotas()
}

func fotoPNG(t *testing.T) []byte {
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 8, 8))); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func pedidoFoto(t *testing.T, dados []byte, tipo string) *http.Request {
	var corpo bytes.Buffer
	w := multipart.NewWriter(&corpo)
	_ = w.WriteField("tipoLaudo", tipo)
	_ = w.WriteField("contexto", "Rua X, 1")
	if dados != nil {
		f, _ := w.CreateFormFile("imagem", "f.png")
		_, _ = f.Write(dados)
	}
	_ = w.Close()
	r := httptest.NewRequest("POST", "/api/ia/analisar", &corpo)
	r.Header.Set("Content-Type", w.FormDataContentType())
	return r
}

func TestSaude(t *testing.T) {
	rec := httptest.NewRecorder()
	servidor(10).ServeHTTP(rec, httptest.NewRequest("GET", "/api/health", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"ia":"demo"`) {
		t.Fatalf("health: %d %s", rec.Code, rec.Body)
	}
}

func TestCORS(t *testing.T) {
	h := servidor(10)
	r := httptest.NewRequest("OPTIONS", "/api/ia/analisar", nil)
	r.Header.Set("Origin", "https://app.teste")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	if rec.Code != 204 || rec.Header().Get("Access-Control-Allow-Origin") != "https://app.teste" {
		t.Fatalf("preflight: %d %v", rec.Code, rec.Header())
	}
	r = httptest.NewRequest("OPTIONS", "/api/ia/analisar", nil)
	r.Header.Set("Origin", "https://intruso.com")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, r)
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("origem desconhecida não pode receber CORS")
	}
}

func TestAnalisar(t *testing.T) {
	h := servidor(10)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, pedidoFoto(t, fotoPNG(t), "cautelar"))
	if rec.Code != 200 {
		t.Fatalf("analisar: %d %s", rec.Code, rec.Body)
	}
	var out struct {
		Analise struct {
			Ambiente string `json:"ambiente"`
		} `json:"analise"`
		Origem string `json:"origem"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil || out.Analise.Ambiente == "" || out.Origem != "demo" {
		t.Fatalf("resposta ruim: %s", rec.Body)
	}
	for nome, r := range map[string]*http.Request{
		"tipo inválido": pedidoFoto(t, fotoPNG(t), "inventado"),
		"sem imagem":    pedidoFoto(t, nil, "cautelar"),
		"não é imagem":  pedidoFoto(t, []byte("isto é texto, não foto"), "cautelar"),
	} {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, r)
		if rec.Code != 400 {
			t.Fatalf("%s: esperava 400, veio %d %s", nome, rec.Code, rec.Body)
		}
	}
}

func TestLiaELimite(t *testing.T) {
	h := servidor(2)
	corpo := `{"conversa":[{"de":"voce","texto":"Oi"}]}`
	for i := 0; i < 2; i++ {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest("POST", "/api/ia/lia", strings.NewReader(corpo)))
		if rec.Code != 200 {
			t.Fatalf("lia %d: %d %s", i, rec.Code, rec.Body)
		}
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("POST", "/api/ia/lia", strings.NewReader(corpo)))
	if rec.Code != 429 {
		t.Fatalf("3º pedido deveria bater no limite: %d", rec.Code)
	}
	rec = httptest.NewRecorder()
	servidor(10).ServeHTTP(rec, httptest.NewRequest("POST", "/api/ia/lia", strings.NewReader(`{"conversa":[{"de":"lia","texto":"oi"}]}`)))
	if rec.Code != 400 {
		t.Fatalf("conversa sem pergunta deveria dar 400: %d", rec.Code)
	}
}
