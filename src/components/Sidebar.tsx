import type { JSX } from 'react';
import { FocusFlowLogo } from './FocusFlowLogo';

interface SidebarProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: JSX.Element;
}

export function Sidebar({ activeTab, onChangeTab, isOpen, onCloseMobile }: SidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      id: 'timer',
      label: 'Pomodoro',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Cronograma',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      id: 'reviews',
      label: 'Revisões',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12a48.29 48.29 0 017.324 0c1.884.143 3.42 1.547 3.7 3.439.092 1.21.138 2.43.138 3.661m0 0l-3-3m3 3l3-3" />
        </svg>
      ),
    },
    {
      id: 'details',
      label: 'Detalhamentos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleSelectTab = (id: string) => {
    onChangeTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* 1. LAYOUT DESKTOP (Visível quando isOpen for verdadeiro no desktop) */}
      {isOpen && (
        <aside className="hidden md:flex w-[250px] flex-col gap-2 p-4 rounded-3xl bg-bg-card/40 border border-gray-700/50 backdrop-blur-md transition-all">
          <div className="flex items-center px-3 py-4 mb-4 border-b border-gray-800/60">
            <FocusFlowLogo size="md" showText={true} />
          </div>

          <nav className="flex flex-col gap-1.5 w-full">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-accent-primary/15 text-white border-l-4 border-accent-primary font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-bg-card/30'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* 2. LAYOUT MOBILE (Fundo escuro com Blur + Drawer lateral completo) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex animate-fadeIn">
          {/* Backdrop Blur de Fundo */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Gaveta Lateral (Drawer) */}
          <div className="relative w-[280px] max-w-[85vw] bg-bg-dark border-r border-gray-800 h-full p-5 flex flex-col justify-between z-[101] shadow-2xl overflow-y-auto custom-scrollbar">
            <div>
              {/* Topo do Drawer Mobile */}
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-800">
                <FocusFlowLogo size="md" showText={true} />
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Fechar Menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Lista Vertical de Itens com Nomes e Ícones */}
              <nav className="flex flex-col gap-2 w-full">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-accent-primary/20 text-white border-l-4 border-accent-primary font-bold shadow-lg shadow-accent-primary/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Rodapé do Drawer Mobile */}
            <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-500 text-center">
              FocusFlow • Gestão de Estudos
            </div>
          </div>
        </div>
      )}
    </>
  );
}

