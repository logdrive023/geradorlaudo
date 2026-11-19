import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Laudo, ModeloTexto, TipoLaudo } from './modelo';
import { TIPOS } from './tipos';

export interface Textos { objetivo: string; metodologia: string; normas: string[] }

/** Padrão do sistema → modelo personalizado do tipo → ajuste deste laudo. */
export function textosDoTipo(tipo: TipoLaudo, modelo?: ModeloTexto): Textos {
  const t = TIPOS[tipo];
  return {
    objetivo: modelo?.objetivo?.trim() || t.objetivo,
    metodologia: modelo?.metodologia?.trim() || t.metodologia,
    normas: modelo?.normas?.filter((n) => n.trim()).length ? modelo.normas.filter((n) => n.trim()) : t.normas,
  };
}

export function textosDoLaudo(laudo: Laudo, modelo?: ModeloTexto): Textos {
  const base = textosDoTipo(laudo.tipo, modelo);
  return {
    ...base,
    objetivo: laudo.textos?.objetivo?.trim() || base.objetivo,
    metodologia: laudo.textos?.metodologia?.trim() || base.metodologia,
  };
}

export function useModelo(tipo: TipoLaudo) {
  return useLiveQuery(() => db.modelos.get(tipo), [tipo]);
}

export function useTextos(laudo: Laudo): Textos {
  return textosDoLaudo(laudo, useModelo(laudo.tipo));
}
