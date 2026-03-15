import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

export function TopBar({ notes, search, onChangeSearch, onSelectNote, selectedNote, onDeleteNote, user, onLogout }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const searchRef = useRef(null)
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

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  return (
    <header className="flex items-center gap-3 border-b border-[#1f1f1f] bg-[#111111] px-5 py-3 flex-shrink-0">

      {/* Search */}
      <div className="relative flex-1" ref={searchRef}>
        <div className="flex items-center gap-2 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5">
          <span className="text-xs" style={{ color: '#444444' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => { onChangeSearch(e.target.value); setIsSearchOpen(true) }}
            onFocus={() => search.trim() && setIsSearchOpen(true)}
            placeholder="Search by title or content"
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: '#c9c9c9' }}
          />
          {search && (
            <button
              onClick={() => { onChangeSearch(''); setIsSearchOpen(false) }}
              className="text-xs transition-colors"
              style={{ color: '#555555' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {isSearchOpen && search.trim() && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] shadow-2xl overflow-hidden">
            {filteredNotes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-center" style={{ color: '#555555' }}>
                No results found
              </p>
            ) : (
              <ul className="max-h-[224px] overflow-y-auto divide-y divide-[#2a2a2a]">
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

        {/* User dropdown */}
        {isUserMenuOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg shadow-2xl overflow-hidden"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>
                {user?.user_metadata?.full_name || user?.user_metadata?.user_name || 'User'}
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
  selectedNote: PropTypes.object,
  onDeleteNote: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
}