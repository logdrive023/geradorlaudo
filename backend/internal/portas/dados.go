package portas

import (
	"context"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/laudo"
)

// Banco guarda contas, sessões e laudos. Tudo é filtrado pela organização do usuário.
type Banco interface {
	Ping(ctx context.Context) error

	UsuarioPorEmail(ctx context.Context, email string) (u conta.Usuario, senhaHash string, err error)
	CriarSessao(ctx context.Context, usuarioID string, resumoToken []byte, expira time.Time) error
	UsuarioDaSessao(ctx context.Context, resumoToken []byte) (conta.Usuario, error)
	ApagarSessao(ctx context.Context, resumoToken []byte) error

	ListarLaudos(ctx context.Context, u conta.Usuario) ([]laudo.Registro, error)
	SalvarLaudo(ctx context.Context, u conta.Usuario, l laudo.Registro) error
	LerLaudo(ctx context.Context, u conta.Usuario, id string) (laudo.Registro, []laudo.FotoRegistro, error)
	// ApagarLaudo apaga o laudo e devolve as chaves dos arquivos para limpar o storage.
	ApagarLaudo(ctx context.Context, u conta.Usuario, id string) ([]string, error)

	// ChavesDaFoto: "" se a foto ainda não existe.
	ChavesDaFoto(ctx context.Context, u conta.Usuario, laudoID, fotoID string) (imagem, miniatura string, err error)
	// SalvarFoto grava os dados e a análise; imagem/miniatura vazias = manter as que já estão.
	SalvarFoto(ctx context.Context, u conta.Usuario, f laudo.FotoRegistro, imagem, miniatura string, bytes int) error
	ApagarFoto(ctx context.Context, u conta.Usuario, laudoID, fotoID string) ([]string, error)

	// link do cliente (só leitura)
	CriarLink(ctx context.Context, u conta.Usuario, laudoID, tokenNovo string) (string, error)
	ApagarLink(ctx context.Context, u conta.Usuario, laudoID string) error
	LaudoPublico(ctx context.Context, token string) (laudo.Registro, []laudo.FotoRegistro, conta.Usuario, error)
	ChavesFotoPublica(ctx context.Context, token, fotoID string) (imagem, miniatura string, err error)
}

// Arquivos é o storage das imagens (Supabase Storage em produção; disco em desenvolvimento).
type Arquivos interface {
	Nome() string
	Enviar(ctx context.Context, chave string, dados []byte, tipo string) error
	Baixar(ctx context.Context, chave string) (dados []byte, tipo string, err error)
	Apagar(ctx context.Context, chaves []string) error
}

// ErroDados: dado recusado pelo banco (vira 400 no HTTP).
type ErroDados struct{ Mensagem string }

func (e *ErroDados) Error() string { return e.Mensagem }
