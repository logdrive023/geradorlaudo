import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SessaoProvider, useSessao } from './lib/sessao';
import { lerConfig } from './db/db';
import { Casco } from './componentes/Casco';
import { Carregando } from './componentes/ui';
import { Site } from './paginas/site/Site';
import { NaoEncontrada } from './paginas/site/NaoEncontrada';
import { Entrar } from './paginas/entrar/Entrar';
import { Painel } from './paginas/painel/Painel';
import { Editor } from './paginas/editor/Editor';
import { Configuracoes } from './paginas/config/Configuracoes';
import { Usuarios } from './paginas/admin/Usuarios';
import { VerLaudo } from './paginas/publico/VerLaudo';

function Tema() {
  const tema = useLiveQuery(async () => (await lerConfig()).tema, [], 'claro');
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => document.documentElement.classList.toggle('escuro', tema === 'escuro' || (tema === 'sistema' && mq.matches));
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, [tema]);
  return null;
}

function Protegido({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { usuario } = useSessao();
  const loc = useLocation();
  if (usuario === undefined) return <Carregando />;
  if (!usuario) return <Navigate to="/entrar" replace state={{ de: loc.pathname }} />;
  if (admin && usuario.papel !== 'admin') return <Navigate to="/painel" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <SessaoProvider>
        <Tema />
        <Routes>
          <Route path="/" element={<Site />} />
          <Route path="/entrar" element={<Entrar modo="entrar" />} />
          <Route path="/cadastrar" element={<Entrar modo="criar" />} />
          <Route path="/esqueci" element={<Entrar modo="esqueci" />} />
          <Route path="/ver/:token" element={<VerLaudo />} />
          <Route element={<Protegido><Casco /></Protegido>}>
            <Route path="/painel" element={<Painel />} />
            <Route path="/laudo/:id" element={<Editor />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/usuarios" element={<Protegido admin><Usuarios /></Protegido>} />
          </Route>
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </SessaoProvider>
    </BrowserRouter>
  );
}
