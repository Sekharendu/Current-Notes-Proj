import { useState, useRef, useEffect } from 'react'
import { Search, X, PanelLeftClose, PanelLeft, ChevronLeft, Star, Trash2, Sun, Moon } from 'lucide-react'
import PropTypes from 'prop-types'
import { getColors } from '../theme'

export function TopBar({
  notes,
  search,
  onChangeSearch,
  onSelectNote,
  user,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
  isMobile = false,
  onMobileBack,
  selectedNote,
  onToggleFavorite,
  onDeleteNote,
  theme = 'dark',
  onToggleTheme,
}) {
  const c = getColors(theme)
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
    <header className="flex h-14 shrink-0 items-center gap-3 px-4 pl-3 flex-shrink-0" style={{ background: c.mainBg }}>
      {isMobile ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMobileBack?.() }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: c.icon }}
          aria-label="Back to notes"
          title="Back to notes"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSidebar() }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: c.icon }}
          onMouseEnter={(e) => e.currentTarget.style.background = c.hover}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={20} strokeWidth={1.75} /> : <PanelLeft size={20} strokeWidth={1.75} />}
        </button>
      )}

      {isMobile && <div className="flex-1" />}
      <div className={`relative flex min-w-0 flex-1 justify-center${isMobile ? ' hidden' : ''}`}>
        <div className="relative w-[65%] min-w-0 max-w-full" ref={searchRef}>
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={showSearchPanel
              ? { background: c.searchBg, border: `1px solid ${c.border}`, borderBottom: 'none', borderRadius: '6px 6px 0 0' }
              : { background: c.searchBg, border: `1px solid ${c.border}`, borderRadius: '6px' }}
          >
          <Search size={14} style={{ color: c.iconDark }} />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => { onChangeSearch(e.target.value); setIsSearchOpen(true) }}
            onFocus={() => search.trim() && setIsSearchOpen(true)}
            placeholder="Search notes (Ctrl+K)"
            className="w-full min-w-0 bg-transparent text-sm focus:outline-none"
            style={{ color: c.text }}
          />
          {search && (
            <button
              onClick={() => { onChangeSearch(''); setIsSearchOpen(false) }}
              className="text-xs transition-colors"
              style={{ color: c.textMuted }}
            >
              <X size={12} />
            </button>
          )}
          </div>

          {showSearchPanel && (
          <div className="absolute left-0 right-0 top-full z-50 rounded-b-lg rounded-t-none shadow-2xl overflow-hidden"
            style={{ background: c.searchResultBg, border: `1px solid ${c.border}`, borderTop: 'none' }}>
            {filteredNotes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-center" style={{ color: c.textMuted }}>
                No results found
              </p>
            ) : (
              <ul className="scroll-thin max-h-[224px] overflow-y-auto" style={{ borderColor: c.borderLight }}>
                {filteredNotes.map((note) => (
                  <li
                    key={note.id}
                    onClick={() => {
                      onSelectNote(note.id)
                      onChangeSearch('')
                      setIsSearchOpen(false)
                    }}
                    className="flex cursor-pointer flex-col gap-0.5 px-4 py-3 transition-colors"
                    style={{ color: c.text, borderBottom: `1px solid ${c.borderLight}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = c.searchResultHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="text-sm font-medium truncate" style={{ color: c.textBright }}>
                      {note.title || 'Untitled'}
                    </span>
                    <span className="text-xs truncate" style={{ color: c.textMuted }}>
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

      {isMobile ? (
        selectedNote && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite?.(selectedNote)}
              className="flex items-center justify-center h-9 w-9 rounded-md transition-colors"
              style={{ color: selectedNote.is_favorite ? c.favorite : c.textMuted }}
              title={selectedNote.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Star size={18} fill={selectedNote.is_favorite ? c.favorite : 'none'} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteNote?.(selectedNote.id)}
              className="flex items-center justify-center h-9 w-9 rounded-md transition-colors"
              style={{ color: c.textMuted }}
              title="Delete note"
            >
              <Trash2 size={18} strokeWidth={1.75} />
            </button>
          </div>
        )
      ) : (
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
                style={{ border: `2px solid ${c.avatarBorder}` }}
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: c.avatarBg, border: `2px solid ${c.avatarBorder}`, color: c.textHeading }}
              >
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg shadow-2xl overflow-hidden"
              style={{ background: c.menuBg, border: `1px solid ${c.border}` }}
            >
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
                <p className="text-xs font-medium truncate" style={{ color: c.textBright }}>
                  {user?.user_metadata?.full_name
                    || user?.user_metadata?.user_name
                    || user?.user_metadata?.name
                    || 'User'}
                </p>
                <p className="text-[11px] truncate" style={{ color: c.textMuted }}>
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => { onToggleTheme?.(); setIsUserMenuOpen(false) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                style={{ color: c.text, borderBottom: `1px solid ${c.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.menuHover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                onClick={() => { onLogout(); setIsUserMenuOpen(false) }}
                className="w-full px-3 py-2 text-left text-sm transition-colors"
                style={{ color: c.danger }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.menuHover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
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
  isMobile: PropTypes.bool,
  onMobileBack: PropTypes.func,
  selectedNote: PropTypes.object,
  onToggleFavorite: PropTypes.func,
  onDeleteNote: PropTypes.func,
  theme: PropTypes.string,
  onToggleTheme: PropTypes.func,
}