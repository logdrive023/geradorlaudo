import { createContext, useContext, type ReactNode } from 'react';
import { STATUS_ACAO, dataCurta, itensPlano, planoPreenchido, reais, resumoPlano } from '../dominio/plano';
import { GRAVIDADE, type Achado, type Foto, type Gravidade, type Laudo, type Usuario } from '../dominio/modelo';
import { TIPOS } from '../dominio/tipos';
import { achadosValidos, porAmbiente, resumoAchados } from '../dominio/regras';
import { useUrl } from '../componentes/ui';
import { FotoMarcada } from '../componentes/FotoMarcada';
import { dataBR, dataExtenso, dois } from '../lib/util';
import { useTextos } from '../dominio/textos';

/**
 * O laudo em folhas A4. Estrutura baseada na ABNT NBR 13752 (perícias) e NBR 16747 (inspeção predial):
 * capa · objetivo/metodologia/normas · dados · constatações (com prioridade)
 * · relatório fotográfico numerado · conclusão · encerramento e assinatura.
 *
 * EDIÇÃO DIRETA: com `editar`, os textos viram editáveis na própria folha (toque e escreva).
 */

export interface Edicao {
  titulo: (v: string) => void;
  dado: (chave: string, v: string) => void;
  texto: (k: 'objetivo' | 'metodologia', v: string) => void;
  conclusao: (v: string) => void;
  legenda: (fotoId: string, v: string) => void;
  achado: (fotoId: string, achadoId: string, p: Partial<Achado>) => void;
}

const EdicaoCtx = createContext<Edicao | undefined>(undefined);

/** Texto editável na folha: toque, escreva, e salva ao sair do campo. */
function Ed({ v, salvar, bloco, vazio = 'Toque para escrever' }: { v: string; salvar?: (v: string) => void; bloco?: boolean; vazio?: string }) {
  const ed = useContext(EdicaoCtx);
  if (!ed || !salvar) return <>{v}</>;
  // sempre <span> (pode ficar dentro de <p>); em bloco vira display:block
  return (
    <span
      key={v}
      className="editavel"
      contentEditable
      suppressContentEditableWarning
      data-vazio={vazio}
      spellCheck
      style={bloco ? { whiteSpace: 'pre-line', display: 'block' } : undefined}
      onKeyDown={(e) => { if (!bloco && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') { e.currentTarget.textContent = v; e.currentTarget.blur(); } }}
      onBlur={(e) => { const t = (e.currentTarget.innerText ?? '').replace(/ /g, ' ').trim(); if (t !== v.trim()) salvar(t); }}
    >{v}</span>
  );
}

interface Props { laudo: Laudo; fotos: Foto[]; autor?: Usuario; editar?: Edicao }

function Folha({ n, total, laudo, autor, children, capa }: { n: number; total: number; laudo: Laudo; autor?: Usuario; children: ReactNode; capa?: boolean }) {
  return (
    <section className="folha">
      {!capa && (
        <div className="cab">
          <span>{TIPOS[laudo.tipo].nome} — {laudo.dados.endereco || laudo.titulo}</span>
          <span>{autor?.nome}{autor?.registro ? ` · ${autor.registro}` : ''}</span>
        </div>
      )}
      <div className={capa ? '' : 'corpo'}>{children}</div>
      <div className="rod">
        <span>{[autor?.endereco, autor?.cidade && `${autor.cidade}${autor.uf ? `/${autor.uf}` : ''}`, autor?.telefone].filter(Boolean).join(' · ') || 'LaudoTech'}</span>
        <span>Página {n} de {total}</span>
      </div>
    </section>
  );
}

/** Tabela rótulo → valor. Com `chave`, o valor é editável e grava em laudo.dados. */
function Linhas({ itens }: { itens: { rotulo: string; valor?: string; chave?: string }[] }) {
  const ed = useContext(EdicaoCtx);
  const v = itens.filter((i) => i.valor?.trim());
  if (!v.length) return null;
  return (
    <table><tbody>{v.map((i) => (
      <tr key={i.rotulo}><th style={{ width: '38%' }}>{i.rotulo}</th><td><Ed v={i.valor!} salvar={i.chave && ed ? (x) => ed.dado(i.chave!, x) : undefined} /></td></tr>
    ))}</tbody></table>
  );
}

function Img({ b, style }: { b?: Blob; style?: React.CSSProperties }) {
  const u = useUrl(b);
  return u ? <img src={u} alt="" style={style} /> : null;
}

export function Documento({ laudo, fotos, autor, editar }: Props) {
  const t = TIPOS[laudo.tipo];
  const tx = useTextos(laudo);
  const d = laudo.dados;
  const e = editar;
  const r = resumoAchados(fotos);
  const grupos = porAmbiente(fotos);
  const paresFotos: Foto[][] = [];
  for (let i = 0; i < fotos.length; i += 2) paresFotos.push(fotos.slice(i, i + 2));
  const total = 5 + paresFotos.length;
  const numero = new Map(fotos.map((f, i) => [f.id, i + 1]));
  const linhasConst = fotos.flatMap((f) => achadosValidos(f).map((a) => ({ f, a })));
  const ordemG: Record<Gravidade, number> = { critico: 0, medio: 1, minimo: 2 };
  linhasConst.sort((x, y) => ordemG[x.a.gravidade] - ordemG[y.a.gravidade]);
  const imovel = t.foco === 'imovel';
  const local = d.cidadeUf?.split('/')[0]?.trim() || autor?.cidade || '';
  // plano de ação: só entra no documento quando o engenheiro preencheu algo
  const plano = itensPlano(laudo, fotos);
  const comPlano = imovel && planoPreenchido(plano);
  const rp = resumoPlano(plano);
  const nConclusao = comPlano ? 7 : 6;

  let n = 0;
  return (
    <EdicaoCtx.Provider value={e}>
      <div>
        {/* 1. CAPA */}
        <Folha n={++n} total={total} laudo={laudo} autor={autor} capa>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '250mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Img b={laudo.logo ?? autor?.logo} style={{ maxHeight: '22mm', maxWidth: '60mm', objectFit: 'contain' }} />
              <span style={{ fontSize: '8.5pt', color: '#6b7890' }}>{dataExtenso(d.dataVistoria)}</span>
            </div>
            <div style={{ height: '5px', margin: '10mm 0 12mm', background: 'repeating-linear-gradient(-45deg,#FF8A1F 0 10px,#121A2B 10px 20px)' }} />
            <div style={{ fontSize: '10pt', fontWeight: 800, letterSpacing: '.14em', color: '#F07400', textTransform: 'uppercase' }}>{t.nome}</div>
            <h1 style={{ fontSize: '26pt', lineHeight: 1.1, margin: '4mm 0 6mm' }}><Ed v={laudo.titulo} salvar={e?.titulo} /></h1>
            <Linhas itens={[
              { rotulo: 'Imóvel', valor: d.endereco, chave: 'endereco' }, { rotulo: 'Cidade / UF', valor: d.cidadeUf, chave: 'cidadeUf' },
              { rotulo: 'Solicitante', valor: d.solicitante, chave: 'solicitante' }, { rotulo: 'Processo / referência', valor: d.processo, chave: 'processo' },
            ]} />
            {laudo.imagemLocalizacao && (
              <div style={{ marginTop: '8mm', textAlign: 'center' }}>
                <Img b={laudo.imagemLocalizacao} style={{ maxWidth: '100%', maxHeight: '95mm', objectFit: 'contain', border: '1px solid #d4dae4', borderRadius: 6 }} />
                <div style={{ fontSize: '8.5pt', color: '#6b7890', marginTop: 4 }}>Localização esquemática do imóvel</div>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '10mm', borderTop: '1px solid #e3e8f0' }}>
              <div style={{ fontWeight: 800 }}>{autor?.nome}</div>
              <div style={{ color: '#526079' }}>{[autor?.profissao, autor?.registro].filter(Boolean).join(' · ')}</div>
              <div style={{ color: '#526079' }}>ART/RRT nº <Ed v={d.art ?? ''} salvar={e && ((x) => e.dado('art', x))} vazio="número da ART" /></div>
            </div>
          </div>
        </Folha>

        {/* 2. OBJETIVO, METODOLOGIA, NORMAS */}
        <Folha n={++n} total={total} laudo={laudo} autor={autor}>
          <h2>1. Objetivo</h2>
          <p><Ed v={tx.objetivo} salvar={e && ((x) => e.texto('objetivo', x))} bloco /></p>
          {(d.objeto || e) && imovel !== undefined && d.objeto !== undefined && <><h3>Objeto</h3><p><Ed v={d.objeto ?? ''} salvar={e && ((x) => e.dado('objeto', x))} bloco /></p></>}
          <h2 style={{ marginTop: '7mm' }}>2. Metodologia</h2>
          <p><Ed v={tx.metodologia} salvar={e && ((x) => e.texto('metodologia', x))} bloco /></p>
          <h3>Normas e referências</h3>
          <ul style={{ paddingLeft: '5mm', margin: 0 }}>{tx.normas.map((x) => <li key={x}>{x}</li>)}</ul>
          {d.quesitos && <><h3>Quesitos</h3><ol style={{ paddingLeft: '5mm', margin: 0 }}>{d.quesitos.split('\n').filter(Boolean).map((q, i) => <li key={i}>{q}</li>)}</ol></>}
          <h3>Responsável técnico</h3>
          <Linhas itens={[{ rotulo: 'Nome', valor: autor?.nome }, { rotulo: 'Profissão', valor: autor?.profissao }, { rotulo: 'Registro', valor: autor?.registro }, { rotulo: 'ART / RRT', valor: d.art, chave: 'art' }]} />
        </Folha>

        {/* 3. DADOS (gerados do padrão do tipo de laudo) */}
        <Folha n={++n} total={total} laudo={laudo} autor={autor}>
          <h2>3. Dados {imovel ? 'do imóvel e da vistoria' : 'da análise'}</h2>
          {d.valor && (
            <div style={{ margin: '0 0 5mm', padding: '4mm 5mm', border: '2px solid #FF8A1F', borderRadius: 8, background: '#FFF6EC' }}>
              <div style={{ fontSize: '9pt', fontWeight: 800, color: '#8A4300', textTransform: 'uppercase', letterSpacing: '.08em' }}>Valor de mercado{d.dataBase ? ` em ${dataBR(d.dataBase)}` : ''}</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '20pt', fontWeight: 800, color: '#1D3B70' }}>R$ <Ed v={d.valor} salvar={e && ((x) => e.dado('valor', x))} /></div>
            </div>
          )}
          {t.secoes.map((sec) => {
            const linhas = sec.campos.filter((c) => c.tipo !== 'area' && c.chave !== 'art' && d[c.chave]?.trim())
              .map((c) => ({ rotulo: c.rotulo, valor: c.tipo === 'data' ? dataBR(d[c.chave]) : d[c.chave], chave: c.tipo === 'data' ? undefined : c.chave }));
            const textos = sec.campos.filter((c) => c.tipo === 'area' && !['objeto', 'quesitos'].includes(c.chave) && d[c.chave]?.trim());
            if (!linhas.length && !textos.length) return null;
            return (
              <div key={sec.titulo} style={{ breakInside: 'avoid' }}>
                <h3>{sec.titulo}</h3>
                <Linhas itens={linhas} />
                {textos.map((c) => <div key={c.chave}><b style={{ fontSize: '9.5pt', color: '#1D3B70' }}>{c.rotulo}</b><p><Ed v={d[c.chave]} salvar={e && ((x) => e.dado(c.chave, x))} bloco /></p></div>)}
              </div>
            );
          })}
        </Folha>

        {/* 4. CONSTATAÇÕES / LISTA DE ANEXOS */}
        <Folha n={++n} total={total} laudo={laudo} autor={autor}>
          {imovel ? (
            <>
              <h2>4. Constatações</h2>
              <p>Foram registradas <b>{fotos.length}</b> fotografias em <b>{grupos.length}</b> ambiente(s) e constatadas <b>{r.total}</b> anomalia(s) aparente(s)
                {r.total > 0 && <> — {r.critico} crítica(s), {r.medio} média(s) e {r.minimo} mínima(s)</>}. A coluna “Foto” remete ao relatório fotográfico.</p>
              {linhasConst.length > 0 ? (
                <table>
                  <thead><tr><th>Foto</th><th>Ambiente</th><th>Anomalia</th><th>Grau / prioridade</th><th>Recomendação</th></tr></thead>
                  <tbody>{linhasConst.map(({ f, a }) => (
                    <tr key={a.id}>
                      <td>{dois(numero.get(f.id)!)}</td>
                      <td>{f.analise?.ambiente}</td>
                      <td><b><Ed v={a.tipo} salvar={e && ((x) => e.achado(f.id, a.id, { tipo: x }))} /></b><br /><span style={{ color: '#526079' }}><Ed v={a.descricao} salvar={e && ((x) => e.achado(f.id, a.id, { descricao: x }))} bloco /></span></td>
                      <td><span className={`selo selo-${a.gravidade}`}>{GRAVIDADE[a.gravidade].nome}</span><br /><span style={{ fontSize: '8pt' }}>{GRAVIDADE[a.gravidade].prioridade}</span></td>
                      <td><Ed v={a.recomendacao} salvar={e && ((x) => e.achado(f.id, a.id, { recomendacao: x }))} bloco /></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p><i>Não foram constatadas anomalias aparentes.</i></p>}
              <h3>Critério de classificação</h3>
              <table><tbody>{(Object.keys(GRAVIDADE) as Gravidade[]).map((g) => (
                <tr key={g}><th style={{ width: '25%' }}><span className={`selo selo-${g}`}>{GRAVIDADE[g].nome}</span> {GRAVIDADE[g].prioridade}</th><td>{GRAVIDADE[g].texto}</td></tr>
              ))}</tbody></table>
            </>
          ) : (
            <>
              <h2>4. Documentos anexados</h2>
              <table><thead><tr><th>Nº</th><th>Documento</th></tr></thead><tbody>{fotos.map((f, i) => <tr key={f.id}><td>{dois(i + 1)}</td><td><Ed v={f.analise?.legenda || f.nomeArquivo} salvar={e && ((x) => e.legenda(f.id, x))} /></td></tr>)}</tbody></table>
            </>
          )}
        </Folha>

        {/* 5. RELATÓRIO FOTOGRÁFICO (2 por folha) */}
        {paresFotos.map((par, pi) => (
          <Folha key={pi} n={++n} total={total} laudo={laudo} autor={autor}>
            {pi === 0 && <h2>{imovel ? '5. Relatório fotográfico' : '5. Anexos'}</h2>}
            {par.map((f) => {
              const ach = achadosValidos(f);
              return (
                <figure key={f.id} style={{ margin: '0 0 6mm', breakInside: 'avoid' }}>
                  <div style={{ width: '100mm', margin: '0 auto' }}><FotoMarcada foto={f} achados={ach} imprimir className="rounded" /></div>
                  <figcaption style={{ marginTop: 6 }}>
                    <b>Foto {dois(numero.get(f.id)!)}</b> — <Ed v={f.analise?.legenda || f.nomeArquivo} salvar={e && ((x) => e.legenda(f.id, x))} />
                    {f.tiradaEm && <span style={{ color: '#6b7890' }}> ({dataBR(f.tiradaEm)})</span>}
                    {ach.length > 0 && (
                      <ol style={{ margin: '3px 0 0', paddingLeft: '5mm', fontSize: '9pt' }}>
                        {ach.map((a) => <li key={a.id}><b>{a.tipo}</b> <span className={`selo selo-${a.gravidade}`}>{GRAVIDADE[a.gravidade].nome}</span> — <Ed v={a.descricao} salvar={e && ((x) => e.achado(f.id, a.id, { descricao: x }))} />{a.causaProvavel && <> Causa provável: <Ed v={a.causaProvavel} salvar={e && ((x) => e.achado(f.id, a.id, { causaProvavel: x }))} /></>}</li>)}
                      </ol>
                    )}
                    {f.observacao && <div style={{ fontSize: '9pt', color: '#526079' }}>Obs.: {f.observacao}</div>}
                  </figcaption>
                </figure>
              );
            })}
          </Folha>
        ))}

        {/* 6. CONCLUSÃO E ENCERRAMENTO */}
        <Folha n={++n} total={total} laudo={laudo} autor={autor}>
          {comPlano && (
            <div style={{ marginBottom: '7mm' }}>
              <h2>6. Plano de ação</h2>
              <p>Prioridades, prazos e responsáveis para correção das anomalias constatadas{rp.custo > 0 && <>, com custo estimado total de <b>{reais(rp.custo)}</b></>}.</p>
              <table>
                <thead><tr><th>Foto</th><th>Anomalia</th><th>Prioridade</th><th>Prazo</th><th>Responsável</th><th>Custo est.</th><th>Situação</th></tr></thead>
                <tbody>{plano.map((i) => (
                  <tr key={i.achado.id}>
                    <td>{dois(i.numeroFoto)}</td>
                    <td><b>{i.achado.tipo}</b><br /><span style={{ color: '#526079' }}>{i.foto.analise?.ambiente}</span></td>
                    <td><span className={`selo selo-${i.achado.gravidade}`}>{GRAVIDADE[i.achado.gravidade].nome}</span><br /><span style={{ fontSize: '8pt' }}>{GRAVIDADE[i.achado.gravidade].prioridade}</span></td>
                    <td>{dataCurta(i.prazo)}</td>
                    <td>{i.acomp.responsavel || '—'}</td>
                    <td>{i.acomp.custo != null ? reais(i.acomp.custo) : '—'}</td>
                    <td>{STATUS_ACAO[i.acomp.status].nome}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <h2>{nConclusao}. Conclusão</h2>
          {e ? <p><Ed v={laudo.conclusao} salvar={e.conclusao} bloco vazio="Toque para escrever a conclusão (ou use “Escrever com a Lia”)" /></p>
            : (laudo.conclusao || 'Conclusão ainda não redigida.').split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          <h2 style={{ marginTop: '8mm' }}>{nConclusao + 1}. Encerramento</h2>
          <p>O presente laudo é composto por {total} páginas, todas rubricadas, sendo esta a última, datada e assinada.
            As constatações referem-se ao estado aparente verificado na data da diligência, sem ensaios destrutivos, salvo indicação em contrário.</p>
          <div style={{ marginTop: '28mm', textAlign: 'center' }}>
            <div>{local ? `${local}, ` : ''}{dataExtenso(d.dataVistoria)}.</div>
            <div style={{ marginTop: '14mm', minHeight: '18mm', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
              <Img b={autor?.assinatura} style={{ maxHeight: '22mm', maxWidth: '70mm', objectFit: 'contain' }} />
            </div>
            <div style={{ width: '80mm', margin: '0 auto', borderTop: '1px solid #121A2B', paddingTop: 4 }}>
              <b>{autor?.nome}</b><br />{[autor?.profissao, autor?.registro].filter(Boolean).join(' · ')}{d.art && <><br />ART/RRT nº {d.art}</>}
            </div>
          </div>
          {d.codigoVerificacao && (
            <div style={{ marginTop: '12mm', border: '1px solid #c9d2e0', borderRadius: 6, padding: '3mm 4mm', fontSize: '9pt', color: '#526079', textAlign: 'center' }}>
              <b style={{ color: '#1D3B70' }}>Autenticidade</b> · confira este laudo em <b style={{ color: '#1D3B70' }}>{location.host}/verificar/{d.codigoVerificacao}</b>
              {' '}· código <b style={{ fontFamily: 'monospace', color: '#1D3B70' }}>{d.codigoVerificacao}</b>
            </div>
          )}
        </Folha>
      </div>
    </EdicaoCtx.Provider>
  );
}
