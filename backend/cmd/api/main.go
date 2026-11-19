// API do LaudoTech: sobe o HTTP com a IA escolhida pelo ambiente.
//
//	GEMINI_API_KEY  chave do Google AI Studio (sem ela, modo demonstração)
//	GEMINI_MODELO   padrão gemini-3.8-flash
//	GEMINI_PENSAMENTO padrão low (minimal|low|medium|high|padrao)
//	PORT            padrão 8080
//	CORS_ORIGINS    origens do app separadas por vírgula
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

	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/demo"
	"github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/gemini"
	web "github.com/logdrive023/geradorlaudo/backend/internal/adaptadores/http"
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
		g, err := gemini.Novo(ctx, cfg.GeminiKey, cfg.GeminiModelo, cfg.GeminiPensar)
		if err != nil {
			slog.Error("não deu para iniciar o Gemini; seguindo em modo demonstração", "erro", err)
		} else {
			ia = g
		}
	} else {
		slog.Warn("GEMINI_API_KEY vazia: IA em modo demonstração")
	}

	srv := &web.Servidor{
		IA:           aplicacao.ServicoIA{IA: ia, Timeout: cfg.TimeoutIA},
		Origens:      cfg.OrigensCORS,
		LimitePorMin: cfg.LimitePorMinut,
		Versao:       versao,
	}
	h := &http.Server{
		Addr:              ":" + cfg.Porta,
		Handler:           srv.Rotas(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      cfg.TimeoutIA + 30*time.Second,
	}
	go func() {
		slog.Info("api no ar", "porta", cfg.Porta, "ia", ia.Nome(), "modelo", ia.Modelo(), "pensamento", cfg.GeminiPensar)
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
