import { useState } from 'react'

interface FolderCard {
  name: string;
  description: string;
  badge: string;
}

const folders: FolderCard[] = [
  { name: 'app', description: 'Core application entry point, routing, and global providers.', badge: 'Core' },
  { name: 'components', description: 'Shared reusable presentation components (buttons, inputs, modals).', badge: 'UI' },
  { name: 'screens', description: 'Page/Screen level components representing main routing destinations.', badge: 'Views' },
  { name: 'core', description: 'Business logic, constants, or platform level integrations.', badge: 'System' },
  { name: 'hooks', description: 'Global custom React hooks for sharing side-effects and states.', badge: 'Hooks' },
  { name: 'context', description: 'Global React Context providers (auth, theme, configuration).', badge: 'State' },
  { name: 'services', description: 'API requests, HTTP clients, and external network interactions.', badge: 'Network' },
  { name: 'config', description: 'Environment variables, app constants, and external integrations config.', badge: 'Config' },
  { name: 'utils', description: 'Helper functions, formatting helpers, and standalone algorithms.', badge: 'Utils' },
]

function App() {
  const [count, setCount] = useState(0)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  return (
    <div className="min-h-screen text-slate-100 font-sans antialiased">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-600/10 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/30">
            E
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Estudo.js
          </span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-slate-400">
          <a href="#" className="hover:text-violet-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-violet-400 transition-colors">Architecture</a>
          <a href="#" className="hover:text-violet-400 transition-colors">Guides</a>
        </nav>
        <button className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all">
          v1.0.0
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Tailwind CSS v4 & React 19 Active
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight mb-6">
          Modern React + Vite
          <br />
          <span className="text-gradient">Clean Architecture</span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
          A premium, pre-configured boilerplate featuring Vite 8, React 19, TypeScript, and the brand-new Tailwind CSS v4 pipeline for lightning-fast styling.
        </p>

        {/* Counter and Interactive elements */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button 
            onClick={() => setCount((c) => c + 1)}
            className="glow-btn px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-500/25"
          >
            Interactive Counter: <code className="bg-black/30 px-2 py-0.5 rounded text-sm text-cyan-300 font-mono">{count}</code>
          </button>
          
          <a 
            href="#architecture" 
            className="px-6 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
          >
            Explore Structure
          </a>
        </div>

        {/* Architecture Section */}
        <section id="architecture" className="w-full pt-12 border-t border-white/5">
          <div className="text-left mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Project Workspace</h2>
            <p className="text-slate-400 text-sm md:text-base">
              Click on any directory node to explore its role in this architecture structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {folders.map((folder) => (
              <div 
                key={folder.name}
                onClick={() => setSelectedFolder(selectedFolder === folder.name ? null : folder.name)}
                className={`glass-panel p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  selectedFolder === folder.name 
                    ? 'border-violet-500/50 bg-violet-950/20 ring-1 ring-violet-500/20' 
                    : 'hover:border-white/15'
                }`}
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 transition-colors ${selectedFolder === folder.name ? 'text-cyan-400' : 'text-violet-400 group-hover:text-cyan-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="font-mono text-sm font-semibold tracking-wide text-slate-200">
                      src/{folder.name}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    selectedFolder === folder.name 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}>
                    {folder.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                  {folder.description}
                </p>
                
                {selectedFolder === folder.name && (
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-cyan-400 flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Ready for development
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 mt-20 py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div>
          © 2026 Estudo Template. All rights reserved.
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition-colors">GitHub</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  )
}

export default App
