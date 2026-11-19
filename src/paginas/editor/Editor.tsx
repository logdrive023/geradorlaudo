import { Link, useParams, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileText } from 'lucide-react';
import { db, fotosDoLaudo, tocarLaudo } from '../../db/db';
import { useSessao } from '../../lib/sessao';
import { Carregando, Vazio } from '../../componentes/ui';
import { CabecalhoLaudo, type Passo } from '../../componentes/CabecalhoLaudo';
import { camposObrigatorios } from '../../dominio/tipos';
import { progressoFotos } from '../../dominio/regras';
import { AbaDados } from './AbaDados';
import { AbaFotos } from './AbaFotos';
import { AbaConferir } from './AbaConferir';
import { AbaLaudo } from './AbaLaudo';

export type Aba = 'dados' | 'fotos' | 'conferir' | 'laudo';

export function Editor() {
  const { id = '' } = useParams();
  const { usuario } = useSessao();
  const [busca, setBusca] = useSearchParams();
  const aba = (busca.get('aba') as Aba) || 'fotos';
  const irPara = (a: Aba, foto?: string) => { setBusca(foto ? { aba: a, foto } : { aba: a }, { replace: true }); scrollTo({ top: 0 }); };

  const laudo = useLiveQuery(() => db.laudos.get(id), [id], null);
  const fotos = useLiveQuery(() => fotosDoLaudo(id), [id]);
  const autor = useLiveQuery(() => (laudo ? db.usuarios.get(laudo.usuarioId) : undefined), [laudo?.usuarioId]);

  if (laudo === null || fotos === undefined) return <Carregando />;
  if (!laudo || !usuario || (laudo.usuarioId !== usuario.id && usuario.papel !== 'admin')) {
    return <div className="p-8"><Vazio icone={<FileText className="size-7" />} titulo="Laudo não encontrado" texto="Ele pode ter sido excluído ou pertence a outra conta."><Link to="/painel" className="pilula pilula-clara">Voltar aos laudos</Link></Vazio></div>;
  }

  const p = progressoFotos(fotos);
  const passos: Passo<Aba>[] = [
    { id: 'dados', rotulo: 'Dados', feito: camposObrigatorios(laudo.tipo).every((c) => laudo.dados[c.chave]?.trim()) },
    { id: 'fotos', rotulo: 'Fotos', info: String(p.total), feito: p.total > 0 && p.pendentes === 0 },
    { id: 'conferir', rotulo: 'Conferir', info: p.analisadas ? `${p.conferidas}/${p.analisadas}` : undefined, feito: p.total > 0 && p.conferidas === p.total },
    { id: 'laudo', rotulo: 'Laudo', feito: laudo.status === 'concluido' },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <CabecalhoLaudo
        laudo={laudo}
        autorNome={autor && autor.id !== usuario.id ? autor.nome : undefined}
        passos={passos}
        ativo={aba}
        aoIr={irPara}
        aoRenomear={(t) => tocarLaudo(laudo.id, { titulo: t })}
        aoMudarStatus={(s) => tocarLaudo(laudo.id, { status: s })}
      />
      <div className="flex-1">
        {aba === 'dados' && <AbaDados laudo={laudo} irPara={irPara} />}
        {aba === 'fotos' && <AbaFotos laudo={laudo} fotos={fotos} irPara={irPara} />}
        {aba === 'conferir' && <AbaConferir key={busca.get('foto') ?? ''} laudo={laudo} fotos={fotos} irPara={irPara} fotoInicial={busca.get('foto') ?? undefined} />}
        {aba === 'laudo' && <AbaLaudo laudo={laudo} fotos={fotos} autor={autor} irPara={irPara} />}
      </div>
    </div>
  );
}
