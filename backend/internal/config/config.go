// Package config lê a configuração do ambiente (nada de segredo no código).
package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Porta          string
	GeminiKey      string   // GEMINI_API_KEY (vazio = modo demonstração)
	GeminiModelo   string   // GEMINI_MODELO
	OrigensCORS    []string // CORS_ORIGINS separado por vírgula
	TimeoutIA      time.Duration
	LimitePorMinut int // pedidos de IA por IP por minuto
	DatabaseURL    string
}

func Ler() Config {
	return Config{
		Porta:          env("PORT", "8080"),
		GeminiKey:      strings.TrimSpace(os.Getenv("GEMINI_API_KEY")),
		GeminiModelo:   env("GEMINI_MODELO", "gemini-2.5-flash"),
		OrigensCORS:    lista(env("CORS_ORIGINS", "http://localhost:5180,https://laudotech.pages.dev,https://laudotech.onrender.com,https://logdrive023.github.io")),
		TimeoutIA:      time.Duration(numero("TIMEOUT_IA_SEGUNDOS", 90)) * time.Second,
		LimitePorMinut: numero("LIMITE_IA_POR_MINUTO", 20),
		DatabaseURL:    strings.TrimSpace(os.Getenv("DATABASE_URL")),
	}
}

func env(k, padrao string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return padrao
}

func numero(k string, padrao int) int {
	if n, err := strconv.Atoi(os.Getenv(k)); err == nil && n > 0 {
		return n
	}
	return padrao
}

func lista(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimRight(strings.TrimSpace(p), "/"); p != "" {
			out = append(out, p)
		}
	}
	return out
}
