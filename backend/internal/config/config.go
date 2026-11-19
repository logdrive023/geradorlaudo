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
	GeminiReserva  string   // GEMINI_MODELO_RESERVA: usado quando o principal está lotado ("nenhum" desliga)
	GeminiPensar   string   // GEMINI_PENSAMENTO: minimal | low | medium | high | padrao
	OrigensCORS    []string // CORS_ORIGINS separado por vírgula
	TimeoutIA      time.Duration
	LimitePorMinut int // pedidos de IA por IP por minuto
	DatabaseURL    string
	SupabaseURL    string // SUPABASE_URL: storage das imagens
	SupabaseChave  string // SUPABASE_SERVICE_KEY: chave secreta, só no servidor
	Balde          string // STORAGE_BALDE
	PastaArquivos  string // ARQUIVOS_PASTA: sem Supabase, guarda no disco (só desenvolvimento)
}

func Ler() Config {
	return Config{
		Porta:          env("PORT", "8080"),
		GeminiKey:      strings.TrimSpace(os.Getenv("GEMINI_API_KEY")),
		GeminiModelo:   env("GEMINI_MODELO", "gemini-3.8-flash"),
		GeminiReserva:  reserva(env("GEMINI_MODELO_RESERVA", "gemini-3.1-flash-lite")),
		GeminiPensar:   pensamento(env("GEMINI_PENSAMENTO", "low")),
		OrigensCORS:    lista(env("CORS_ORIGINS", "http://localhost:5180,https://laudotech.pages.dev,https://laudotech.onrender.com,https://logdrive023.github.io")),
		TimeoutIA:      time.Duration(numero("TIMEOUT_IA_SEGUNDOS", 120)) * time.Second,
		LimitePorMinut: numero("LIMITE_IA_POR_MINUTO", 20),
		DatabaseURL:    strings.TrimSpace(os.Getenv("DATABASE_URL")),
		SupabaseURL:    strings.TrimSpace(os.Getenv("SUPABASE_URL")),
		SupabaseChave:  strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_KEY")),
		Balde:          env("STORAGE_BALDE", "fotos"),
		PastaArquivos:  strings.TrimSpace(os.Getenv("ARQUIVOS_PASTA")),
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

// pensamento: "padrao" (ou "default") deixa o modelo decidir.
func pensamento(v string) string {
	if v = strings.ToLower(v); v == "padrao" || v == "default" {
		return ""
	}
	return v
}

func reserva(v string) string {
	if strings.EqualFold(v, "nenhum") {
		return ""
	}
	return v
}
