// Package migrations embute os arquivos .sql no binário; a API aplica os que faltam ao subir.
package migrations

import (
	"embed"
	"io/fs"
	"sort"
)

//go:embed *.sql
var arquivos embed.FS

// Migration é um arquivo NNNN_nome.sql.
type Migration struct {
	Versao string // nome sem .sql (ex.: 0001_inicial)
	SQL    string
}

// Todas devolve as migrations em ordem.
func Todas() ([]Migration, error) {
	nomes, err := fs.Glob(arquivos, "*.sql")
	if err != nil {
		return nil, err
	}
	sort.Strings(nomes)
	out := make([]Migration, 0, len(nomes))
	for _, n := range nomes {
		b, err := arquivos.ReadFile(n)
		if err != nil {
			return nil, err
		}
		out = append(out, Migration{Versao: n[:len(n)-4], SQL: string(b)})
	}
	return out, nil
}
