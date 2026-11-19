package conta

import "testing"

func TestSenha(t *testing.T) {
	h, err := ResumoSenha("1431senha")
	if err != nil {
		t.Fatal(err)
	}
	if !ConfereSenha("1431senha", h) {
		t.Fatal("senha certa deveria conferir")
	}
	if ConfereSenha("errada", h) || ConfereSenha("1431senha", "") || ConfereSenha("1431senha", "$argon2id$v=19$lixo") {
		t.Fatal("senha errada ou hash inválido não pode conferir")
	}
}

func TestToken(t *testing.T) {
	tk, r, err := NovoToken()
	if err != nil || len(tk) < 40 || string(ResumoToken(tk)) != string(r) {
		t.Fatalf("token mal formado: %q", tk)
	}
}
