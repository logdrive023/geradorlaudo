// Package arquivos guarda as imagens fora do banco: Supabase Storage (produção) ou disco (desenvolvimento).
package arquivos

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ---------- Supabase Storage (API REST) ----------

type Supabase struct {
	url, chave, balde string
	http              *http.Client
}

// NovoSupabase usa a chave secreta (service_role / sb_secret_...) — ela fica só no servidor.
// Cria o balde privado se ainda não existir.
func NovoSupabase(ctx context.Context, url, chave, balde string) (*Supabase, error) {
	s := &Supabase{url: strings.TrimRight(url, "/"), chave: chave, balde: balde, http: &http.Client{Timeout: 60 * time.Second}}
	corpo, _ := json.Marshal(map[string]any{"id": balde, "name": balde, "public": false, "file_size_limit": 10 << 20})
	r, err := s.pedir(ctx, http.MethodPost, "/storage/v1/bucket", bytes.NewReader(corpo), "application/json")
	if err != nil {
		return nil, err
	}
	defer r.Body.Close()
	if r.StatusCode >= 300 {
		b, _ := io.ReadAll(r.Body)
		if !strings.Contains(strings.ToLower(string(b)), "exist") { // já existe = tudo certo
			return nil, fmt.Errorf("storage: criar balde respondeu %d: %s", r.StatusCode, b)
		}
	}
	return s, nil
}

func (s *Supabase) Nome() string { return "supabase" }

func (s *Supabase) pedir(ctx context.Context, metodo, caminho string, corpo io.Reader, tipo string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, metodo, s.url+caminho, corpo)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.chave)
	req.Header.Set("apikey", s.chave)
	if tipo != "" {
		req.Header.Set("Content-Type", tipo)
	}
	return s.http.Do(req)
}

func (s *Supabase) Enviar(ctx context.Context, chave string, dados []byte, tipo string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.url+"/storage/v1/object/"+s.balde+"/"+chave, bytes.NewReader(dados))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.chave)
	req.Header.Set("apikey", s.chave)
	req.Header.Set("Content-Type", tipo)
	req.Header.Set("x-upsert", "true")
	r, err := s.http.Do(req)
	if err != nil {
		return err
	}
	defer r.Body.Close()
	if r.StatusCode >= 300 {
		b, _ := io.ReadAll(r.Body)
		return fmt.Errorf("storage: enviar respondeu %d: %s", r.StatusCode, b)
	}
	return nil
}

func (s *Supabase) Baixar(ctx context.Context, chave string) ([]byte, string, error) {
	r, err := s.pedir(ctx, http.MethodGet, "/storage/v1/object/"+s.balde+"/"+chave, nil, "")
	if err != nil {
		return nil, "", err
	}
	defer r.Body.Close()
	if r.StatusCode == http.StatusNotFound || r.StatusCode == http.StatusBadRequest {
		return nil, "", ErrNaoExiste
	}
	if r.StatusCode >= 300 {
		return nil, "", fmt.Errorf("storage: baixar respondeu %d", r.StatusCode)
	}
	b, err := io.ReadAll(io.LimitReader(r.Body, 20<<20))
	return b, r.Header.Get("Content-Type"), err
}

func (s *Supabase) Apagar(ctx context.Context, chaves []string) error {
	if len(chaves) == 0 {
		return nil
	}
	corpo, _ := json.Marshal(map[string]any{"prefixes": chaves})
	r, err := s.pedir(ctx, http.MethodDelete, "/storage/v1/object/"+s.balde, bytes.NewReader(corpo), "application/json")
	if err != nil {
		return err
	}
	defer r.Body.Close()
	if r.StatusCode >= 300 {
		return fmt.Errorf("storage: apagar respondeu %d", r.StatusCode)
	}
	return nil
}

// ---------- disco (só desenvolvimento: no Render o disco some a cada deploy) ----------

type Disco struct{ pasta string }

func NovoDisco(pasta string) (*Disco, error) {
	if err := os.MkdirAll(pasta, 0o755); err != nil {
		return nil, err
	}
	return &Disco{pasta: pasta}, nil
}

func (d *Disco) Nome() string { return "disco" }

func (d *Disco) caminho(chave string) (string, error) {
	limpa := filepath.Clean("/" + chave)
	if strings.Contains(chave, "..") {
		return "", errors.New("chave inválida")
	}
	return filepath.Join(d.pasta, limpa), nil
}

func (d *Disco) Enviar(_ context.Context, chave string, dados []byte, tipo string) error {
	p, err := d.caminho(chave)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(p+".tipo", []byte(tipo), 0o644); err != nil {
		return err
	}
	return os.WriteFile(p, dados, 0o644)
}

func (d *Disco) Baixar(_ context.Context, chave string) ([]byte, string, error) {
	p, err := d.caminho(chave)
	if err != nil {
		return nil, "", err
	}
	b, err := os.ReadFile(p)
	if errors.Is(err, os.ErrNotExist) {
		return nil, "", ErrNaoExiste
	}
	tipo, _ := os.ReadFile(p + ".tipo")
	return b, string(tipo), err
}

func (d *Disco) Apagar(_ context.Context, chaves []string) error {
	for _, c := range chaves {
		if p, err := d.caminho(c); err == nil {
			_ = os.Remove(p)
			_ = os.Remove(p + ".tipo")
		}
	}
	return nil
}

var ErrNaoExiste = errors.New("arquivo não existe")
