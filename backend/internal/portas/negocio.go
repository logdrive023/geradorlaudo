package portas

import (
	"context"
	"encoding/json"
	"time"

	"github.com/logdrive023/geradorlaudo/backend/internal/dominio/conta"
)

// Organizacao: a empresa (ou o profissional sozinho, que é uma organização de 1).
type Organizacao struct {
	ID     string          `json:"id"`
	Nome   string          `json:"nome"`
	CNPJ   string          `json:"cnpj"`
	Config json.RawMessage `json:"config"`
}

// Assinatura: plano e limites da organização (sem gateway ligado, fica no plano de teste).
type Assinatura struct {
	Plano       string     `json:"plano"`
	Status      string     `json:"status"`
	LaudosMes   int        `json:"laudosMes"`
	UsuariosMax int        `json:"usuariosMax"`
	Creditos    int        `json:"creditos"`
	PeriodoFim  *time.Time `json:"periodoFim,omitempty"`
}

// Uso do mês corrente (para o admin ver e para o limite do plano).
type Uso struct {
	LaudosMes  int            `json:"laudosMes"`
	AnalisesIA int            `json:"analisesIA"`
	PorMotor   map[string]int `json:"porMotor"`
	Usuarios   int            `json:"usuarios"`
}

type Membro struct {
	UsuarioID string `json:"usuarioId"`
	Nome      string `json:"nome"`
	Papel     string `json:"papel"`
}

type Convite struct {
	Email    string    `json:"email"`
	Nome     string    `json:"nome"`
	Papel    string    `json:"papel"`
	OrgNome  string    `json:"organizacao,omitempty"`
	CriadoEm time.Time `json:"criadoEm"`
	ExpiraEm time.Time `json:"expiraEm"`
	Pendente bool      `json:"pendente"`
}

type EventoAuditoria struct {
	ID        int64           `json:"id"`
	UsuarioID string          `json:"usuarioId,omitempty"`
	Nome      string          `json:"nome,omitempty"`
	Acao      string          `json:"acao"`
	AlvoTipo  string          `json:"alvoTipo,omitempty"`
	AlvoID    string          `json:"alvoId,omitempty"`
	Detalhe   json.RawMessage `json:"detalhe,omitempty"`
	CriadoEm  time.Time       `json:"criadoEm"`
}

// RespostaCliente: o que o cliente fez pelo link (aceite, comentário, contestação, pedido de reparo, aprovação).
type RespostaCliente struct {
	ID           string          `json:"id"`
	AlvoTipo     string          `json:"alvoTipo"`
	AlvoID       string          `json:"alvoId"`
	Tipo         string          `json:"tipo"`
	AchadoID     string          `json:"achadoId,omitempty"`
	Nome         string          `json:"nome"`
	Documento    string          `json:"documento,omitempty"`
	Texto        string          `json:"texto,omitempty"`
	Dados        json.RawMessage `json:"dados,omitempty"`
	HashConteudo string          `json:"hashConteudo,omitempty"`
	IPHash       string          `json:"-"`
	Agente       string          `json:"-"`
	Lido         bool            `json:"lido"`
	CriadoEm     time.Time       `json:"criadoEm"`
}

// Emissao: o laudo emitido, com código público e o resumo do conteúdo (autenticidade pelo QR).
type Emissao struct {
	Codigo       string    `json:"codigo"`
	HashConteudo string    `json:"hash"`
	EmitidoEm    time.Time `json:"emitidoEm"`
}

// Verificacao: o que qualquer pessoa vê ao ler o QR do laudo (sem fotos nem achados).
type Verificacao struct {
	Codigo       string    `json:"codigo"`
	Titulo       string    `json:"titulo"`
	Tipo         string    `json:"tipo"`
	EmitidoEm    time.Time `json:"emitidoEm"`
	HashConteudo string    `json:"hash"`
	Responsavel  string    `json:"responsavel"`
	Registro     string    `json:"registro"`
	Organizacao  string    `json:"organizacao"`
}

type TextoBiblioteca struct {
	ID           string    `json:"id"`
	Tipo         string    `json:"tipo"`
	Sistema      string    `json:"sistema"`
	Gravidade    string    `json:"gravidade"`
	Descricao    string    `json:"descricao"`
	Causa        string    `json:"causaProvavel"`
	Recomendacao string    `json:"recomendacao"`
	Usos         int       `json:"usos"`
	AtualizadoEm time.Time `json:"atualizadoEm"`
}

type Agendamento struct {
	ID             string    `json:"id"`
	UsuarioID      string    `json:"usuarioId,omitempty"`
	ClienteNome    string    `json:"clienteNome"`
	ClienteContato string    `json:"clienteContato"`
	Endereco       string    `json:"endereco"`
	Tipo           string    `json:"tipo"`
	Inicio         time.Time `json:"inicio"`
	DuracaoMin     int       `json:"duracaoMin"`
	Status         string    `json:"status"`
	LaudoID        string    `json:"laudoId,omitempty"`
	Observacao     string    `json:"observacao"`
}

// Negocio: organização com papéis, entrega ao cliente e base comercial.
// Separado de Banco para nada do que já existe mudar; o adaptador postgres implementa os dois.
type Negocio interface {
	// organização e equipe (admin)
	Organizacao(ctx context.Context, u conta.Usuario) (Organizacao, Assinatura, Uso, error)
	SalvarOrganizacao(ctx context.Context, u conta.Usuario, nome, cnpj string, config json.RawMessage) error
	ListarUsuarios(ctx context.Context, u conta.Usuario) ([]conta.Usuario, error)
	AlterarUsuario(ctx context.Context, u conta.Usuario, id string, papel *string, ativo *bool) error
	CriarConvite(ctx context.Context, u conta.Usuario, c Convite, resumoToken []byte) error
	ListarConvites(ctx context.Context, u conta.Usuario) ([]Convite, error)
	LerConvite(ctx context.Context, resumoToken []byte) (Convite, error)
	AceitarConvite(ctx context.Context, resumoToken []byte, nome, senhaHash string) (conta.Usuario, error)

	// quem trabalha em cada laudo/obra
	Membros(ctx context.Context, u conta.Usuario, tipo, id string) ([]Membro, error)
	DefinirMembros(ctx context.Context, u conta.Usuario, tipo, id string, usuarios []string) error

	Auditar(ctx context.Context, u conta.Usuario, acao, alvoTipo, alvoID string, detalhe any)
	Auditoria(ctx context.Context, u conta.Usuario, limite int) ([]EventoAuditoria, error)

	// cliente pelo link
	ResponderPorLink(ctx context.Context, tipo, token string, r RespostaCliente) (RespostaCliente, error)
	Respostas(ctx context.Context, u conta.Usuario, tipo, id string) ([]RespostaCliente, error)

	// autenticidade
	Emitir(ctx context.Context, u conta.Usuario, laudoID, hash, codigoNovo string) (Emissao, error)
	Verificar(ctx context.Context, codigo string) (Verificacao, error)

	// biblioteca de textos e agenda
	Biblioteca(ctx context.Context, u conta.Usuario) ([]TextoBiblioteca, error)
	SalvarTexto(ctx context.Context, u conta.Usuario, t TextoBiblioteca) (TextoBiblioteca, error)
	ApagarTexto(ctx context.Context, u conta.Usuario, id string) error
	Agenda(ctx context.Context, u conta.Usuario, de, ate time.Time) ([]Agendamento, error)
	SalvarAgendamento(ctx context.Context, u conta.Usuario, a Agendamento) (Agendamento, error)
	ApagarAgendamento(ctx context.Context, u conta.Usuario, id string) error

	// uso e cobrança (preparado)
	RegistrarUso(ctx context.Context, u conta.Usuario, laudoID, motor, evento string)
	GuardarEventoPagamento(ctx context.Context, id, gateway, tipo string, payload json.RawMessage) (novo bool, err error)
	GuardarEntrada(ctx context.Context, canal, remetente, tipo, texto, midiaID string) error
}
