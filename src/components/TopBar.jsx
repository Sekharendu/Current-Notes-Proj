import { useState, useRef, useEffect } from 'react'
import { Search, X, PanelLeftClose, PanelLeft } from 'lucide-react'
import PropTypes from 'prop-types'

export function TopBar({
  notes,
  search,
  onChangeSearch,
  onSelectNote,
  user,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)

  const filteredNotes = search.trim()
    ? notes.filter((note) => {
        const q = search.toLowerCase()
        return (
          note.title?.toLowerCase().includes(q) ||
          note.content?.toLowerCase().includes(q)
        )
      })
    : []

  const showSearchPanel = isSearchOpen && Boolean(search.trim())

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      searchInputRef.current?.focus()
      setIsSearchOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ✅ GitHub uses avatar_url, Google uses picture — both are covered
  // But also add a fallback for the display name:
  const avatarUrl = user?.user_metadata?.avatar_url  // ✅ works for both GitHub and Google
                    || user?.user_metadata?.picture   // ✅ Google fallback

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-[#1a1a1a] px-4 pl-3 flex-shrink-0">
      {/* Sidebar toggle — bottom border is a single full-width line from App */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSidebar()
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#262626]"
        style={{ color: '#9ca3af' }}
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? <PanelLeftClose size={20} strokeWidth={1.75} /> : <PanelLeft size={20} strokeWidth={1.75} />}
      </button>

      {/* Search — ~65% width (35% narrower than full middle), centered */}
      <div className="relative flex min-w-0 flex-1 justify-center">
        <div className="relative w-[65%] min-w-0 max-w-full" ref={searchRef}>
          <div
            className={
              showSearchPanel
                ? 'flex items-center gap-2 rounded-t-md rounded-b-none bg-[#161616] border border-[#333333] border-b-0 px-3 py-1.5'
                : 'flex items-center gap-2 rounded-md bg-[#161616] border border-[#333333] px-3 py-1.5'
            }
          >
          <Search size={14} style={{ color: '#444444' }} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => { onChangeSearch(e.target.value); setIsSearchOpen(true) }}
            onFocus={() => search.trim() && setIsSearchOpen(true)}
            placeholder="Search notes (Ctrl+K)"
            className="w-full min-w-0 bg-transparent text-sm focus:outline-none"
            style={{ color: '#c9c9c9' }}
          />
          {search && (
            <button
              onClick={() => { onChangeSearch(''); setIsSearchOpen(false) }}
              className="text-xs transition-colors"
              style={{ color: '#555555' }}
            >
              <X size={12} />
            </button>
          )}
          </div>

          {/* Search dropdown — flush under search field; thin scrollbar matches editor */}
          {showSearchPanel && (
          <div className="absolute left-0 right-0 top-full z-50 rounded-b-lg rounded-t-none border border-[#333333] border-t-0 bg-[#1a1a1a] shadow-2xl overflow-hidden">
            {filteredNotes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-center" style={{ color: '#555555' }}>
                No results found
              </p>
            ) : (
              <ul className="scroll-thin max-h-[224px] overflow-y-auto divide-y divide-[#2a2a2a]">
                {filteredNotes.map((note) => (
                  <li
                    key={note.id}
                    onClick={() => {
                      onSelectNote(note.id)
                      onChangeSearch('')
                      setIsSearchOpen(false)
                    }}
                    className="flex cursor-pointer flex-col gap-0.5 px-4 py-3 transition-colors"
                    style={{ color: '#c9c9c9' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#232323'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="text-sm font-medium truncate" style={{ color: '#e0e0e0' }}>
                      {note.title || 'Untitled'}
                    </span>
                    <span className="text-xs truncate" style={{ color: '#555555' }}>
                      {note.content?.replace(/<[^>]*>/g, '').slice(0, 60)}...
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="relative flex-shrink-0" ref={userMenuRef}>
        <button
          onClick={() => setIsUserMenuOpen(prev => !prev)}
          className="flex items-center justify-center rounded-full focus:outline-none"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover"
              style={{ border: '2px solid #3a3a3a' }}
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: '#2a2a2a', border: '2px solid #3a3a3a' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </button>

      {isUserMenuOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg shadow-2xl overflow-hidden"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
            <p className="text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>
              {/* ✅ covers both Google and GitHub */}
              {user?.user_metadata?.full_name
                || user?.user_metadata?.user_name
                || user?.user_metadata?.name
                || 'User'}
            </p>
            <p className="text-[11px] truncate" style={{ color: '#555555' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => { onLogout(); setIsUserMenuOpen(false) }}
            className="w-full px-3 py-2 text-left text-sm transition-colors"
            style={{ color: '#f87171' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#232323'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Log out
          </button>
        </div>
      )}
      </div>
    </header>
  )
}

TopBar.propTypes = {
  notes: PropTypes.array.isRequired,
  search: PropTypes.string.isRequired,
  onChangeSearch: PropTypes.func.isRequired,
  onSelectNote: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
}