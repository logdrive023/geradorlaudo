// API do LaudoTech: sobe o HTTP com a IA escolhida pelo ambiente.
//
//	GEMINI_API_KEY  chave do Google AI Studio (sem ela, modo demonstração)
//	GEMINI_MODELO   padrão gemini-3.8-flash
//	GEMINI_MODELO_RESERVA padrão gemini-3.1-flash-lite (quando o principal lota)
//	GEMINI_PENSAMENTO padrão low (minimal|low|medium|high|padrao)
//	PORT            padrão 8080
//	CORS_ORIGINS    origens do app separadas por vírgula
//	DATABASE_URL    Postgres (Supabase, session pooler 5432) — login e laudos
//	SUPABASE_URL / SUPABASE_SERVICE_KEY  storage das imagens
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/arquivos"
	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/demo"
	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/gemini"
	web "github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/http"
	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/postgres"
	"github.com/logdrive023/geradorlaudo/backend/internal/aplicacao"
	"github.com/logdrive023/geradorlaudo/backend/internal/config"
	"github.com/logdrive023/geradorlaudo/backend/internal/portas"
)

var versao = "dev" // preenchida no build (-ldflags "-X main.versao=...")

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	cfg := config.Ler()
	ctx, parar := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer parar()

	var ia portas.IA = demo.Demo{}
	if cfg.GeminiKey != "" {
		g, err := gemini.Novo(ctx, cfg.GeminiKey, cfg.GeminiModelo, cfg.GeminiReserva, cfg.GeminiPensar)
		if err != nil {
			slog.Error("não deu para iniciar o Gemini; seguindo em modo demonstração", "erro", err)
		} else {
			ia = g
		}
	} else {
		slog.Warn("GEMINI_API_KEY vazia: IA em modo demonstração")
	}

	// banco (Supabase Postgres). Sem DATABASE_URL a API só faz IA.
	var banco portas.Banco
	if cfg.DatabaseURL != "" {
		b, err := postgres.Abrir(ctx, cfg.DatabaseURL)
		if err != nil {
			slog.Error("banco indisponível; seguindo sem banco", "erro", err)
		} else {
			defer b.Fechar()
			banco = b
		}
	} else {
		slog.Warn("DATABASE_URL vazia: login e laudos no servidor desligados")
	}

	// imagens: Supabase Storage; sem ele, disco (só serve para desenvolvimento)
	var arqs portas.Arquivos
	switch {
	case cfg.SupabaseURL != "" && cfg.SupabaseChave != "":
		s, err := arquivos.NovoSupabase(ctx, cfg.SupabaseURL, cfg.SupabaseChave, cfg.Balde)
		if err != nil {
			slog.Error("storage do Supabase indisponível", "erro", err)
		} else {
			arqs = s
		}
	case cfg.PastaArquivos != "":
		d, err := arquivos.NovoDisco(cfg.PastaArquivos)
		if err != nil {
			slog.Error("pasta de arquivos indisponível", "erro", err)
		} else {
			arqs = d
			slog.Warn("imagens no disco local (não use em produção)", "pasta", cfg.PastaArquivos)
		}
	}

	srv := &web.Servidor{
		IA:           aplicacao.ServicoIA{IA: ia, Timeout: cfg.TimeoutIA},
		Origens:      cfg.OrigensCORS,
		LimitePorMin: cfg.LimitePorMinut,
		Versao:       versao,
		Banco:        banco,
		Arquivos:     arqs,
	}
	h := &http.Server{
		Addr:              ":" + cfg.Porta,
		Handler:           srv.Rotas(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      cfg.TimeoutIA + 30*time.Second,
	}
	go func() {
		slog.Info("api no ar", "porta", cfg.Porta, "ia", ia.Nome(), "modelo", ia.Modelo(), "reserva", cfg.GeminiReserva, "pensamento", cfg.GeminiPensar)
		if err := h.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("servidor parou", "erro", err)
			os.Exit(1)
		}
	}()
	<-ctx.Done()
	fim, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_ = h.Shutdown(fim)
}
