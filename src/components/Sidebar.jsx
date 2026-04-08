import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { List, Star, Plus, FileText, FolderPlus, ChevronRight, ChevronDown, Folder, Search, X, MoreHorizontal, Sun, Moon } from 'lucide-react'
import { KiroBitLogo } from './KiroBitLogo'
import { getColors } from '../theme'

function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

export const SidebarTabs = {
  ALL: 'all',
  FAVORITES: 'favorites',
}

export function Sidebar({
  activeTab,
  onChangeTab,
  folders,
  user,
  notes,
  selectedFolderId,
  onSelectFolder,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onSidebarContext,
  editingItem,
  onChangeEditingName,
  onCommitEditing,
  onCancelEditing,
  openFolders,
  onToggleFolderOpen,
  onCloseSidebarContext,
  sidebarContext,
  selectedNoteIds = [],
  onToggleNoteSelection,
  isMobile = false,
  search = '',
  onChangeSearch,
  onLogout,
  theme = 'dark',
  onToggleTheme,
}) {
  const c = getColors(theme)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)

  const mobileFilteredNotes = (isMobile && search.trim())
    ? notes.filter((n) => {
        const q = search.toLowerCase()
        return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
      })
    : []
  const showMobileSearch = isMobile && isSearchOpen && Boolean(search.trim())

  useEffect(() => {
    if (!isMobile) return
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isMobile])
  const displayNotes = notes.filter((n) =>
    activeTab === SidebarTabs.FAVORITES ? n.is_favorite : true
  )

  return (
    <aside className="flex flex-col h-full overflow-hidden"
      style={{ background: isMobile ? c.sidebarMobileBg : c.sidebarBg, borderRight: isMobile ? 'none' : `1px solid ${c.border}` }}>

      {/* Header — on mobile acts as user menu button */}
      <div className={classNames("relative flex shrink-0 items-center justify-between", isMobile ? "h-16 px-5" : "h-14 px-4")} ref={isMobile ? userMenuRef : undefined}>
        {isMobile ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(prev => !prev) }}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg" aria-hidden>
              <KiroBitLogo variant="minimal" size="xs" />
            </span>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-base font-semibold tracking-tight truncate min-w-0" style={{ color: c.textHeading }}>
                {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}&apos;s Notes
              </span>
              <span className="text-xs" style={{ color: c.textSubtle }}>Personal workspace</span>
            </div>
            <ChevronDown size={16} strokeWidth={2} className="flex-shrink-0 ml-0.5" style={{ color: c.textSubtle }} />
          </button>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" aria-hidden>
              <KiroBitLogo variant="minimal" size="xs" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight truncate min-w-0" style={{ color: c.textHeading }}>
                {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}'s Notes
              </span>
              <span className="text-[11px]" style={{ color: c.textSubtle }}>Personal workspace</span>
            </div>
          </div>
        )}
        {/* Mobile user menu dropdown */}
        {isMobile && isUserMenuOpen && (
          <div
            className="absolute left-4 top-full z-50 mt-1 w-52 rounded-lg shadow-2xl overflow-hidden"
            style={{ background: c.menuBg, border: `1px solid ${c.border}` }}
          >
            <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${c.border}` }}>
              <p className="text-xs font-medium truncate" style={{ color: c.textBright }}>
                {user?.user_metadata?.full_name || user?.user_metadata?.user_name || user?.user_metadata?.name || 'User'}
              </p>
              <p className="text-[11px] truncate" style={{ color: c.textMuted }}>{user?.email}</p>
            </div>
            <button
              onClick={() => { onToggleTheme?.(); setIsUserMenuOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
              style={{ color: c.text, borderBottom: `1px solid ${c.border}` }}
              onMouseEnter={(e) => e.currentTarget.style.background = c.menuHover}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              onClick={() => { onLogout?.(); setIsUserMenuOpen(false) }}
              className="w-full px-3 py-2.5 text-left text-sm transition-colors"
              style={{ color: c.danger }}
              onMouseEnter={(e) => e.currentTarget.style.background = c.menuHover}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      <div className={classNames("flex items-center gap-2", isMobile ? "px-4 py-3" : "px-3 py-2")}
        style={{ borderBottom: `1px solid ${c.border}` }}>
        <button
          type="button"
          className={classNames("flex items-center justify-center rounded-md transition-colors", isMobile ? "h-10 w-10" : "h-8 w-8")}
          style={activeTab === SidebarTabs.ALL
            ? { background: c.tabActiveBg, color: c.textHeading }
            : { color: c.iconMuted }}
          onMouseEnter={(e) => { if (activeTab !== SidebarTabs.ALL) { e.currentTarget.style.background = c.contextHoverAlt; e.currentTarget.style.color = c.hoverText } }}
          onMouseLeave={(e) => { if (activeTab !== SidebarTabs.ALL) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.iconMuted } }}
          onClick={(e) => { e.stopPropagation(); onChangeTab(SidebarTabs.ALL); onSelectFolder(null) }}
        >
          <List size={isMobile ? 20 : 17} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={classNames("flex items-center justify-center rounded-md transition-colors", isMobile ? "h-10 w-10" : "h-8 w-8")}
          style={activeTab === SidebarTabs.FAVORITES
            ? { background: c.tabActiveBg, color: c.favorite }
            : { color: c.iconMuted }}
          onMouseEnter={(e) => { if (activeTab !== SidebarTabs.FAVORITES) { e.currentTarget.style.background = c.contextHoverAlt; e.currentTarget.style.color = c.hoverText } }}
          onMouseLeave={(e) => { if (activeTab !== SidebarTabs.FAVORITES) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.iconMuted } }}
          onClick={(e) => { e.stopPropagation(); onChangeTab(SidebarTabs.FAVORITES); onSelectFolder(null) }}
          title="Favorites"
        >
          <Star size={isMobile ? 20 : 17} strokeWidth={1.75} fill={activeTab === SidebarTabs.FAVORITES ? c.favorite : 'none'} />
        </button>

        <button
          type="button"
          className={classNames("ml-auto flex items-center justify-center rounded-md transition-colors", isMobile ? "h-10 w-10" : "h-8 w-8")}
          style={{ color: c.icon }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.hover; e.currentTarget.style.color = c.textBright }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.icon }}
          onClick={(e) => { e.stopPropagation(); onCreateNote() }}
          title="New note"
        >
          <Plus size={isMobile ? 20 : 17} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={classNames("flex items-center justify-center rounded-md transition-colors", isMobile ? "h-10 w-10" : "h-8 w-8")}
          style={{ color: c.iconMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.contextHoverAlt; e.currentTarget.style.color = c.hoverText }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.iconMuted }}
          onClick={(e) => { e.stopPropagation(); onCreateFolder() }}
          title="New folder"
        >
          <FolderPlus size={isMobile ? 20 : 17} strokeWidth={1.75} />
        </button>
      </div>

      {/* Mobile search bar */}
      {isMobile && (
        <div className="relative px-4 py-3" style={{ borderBottom: `1px solid ${c.border}` }} ref={searchRef}>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={showMobileSearch
              ? { background: c.searchBg, border: `1px solid ${c.border}`, borderBottom: 'none', borderRadius: '6px 6px 0 0' }
              : { background: c.searchBg, border: `1px solid ${c.border}`, borderRadius: '6px' }}
          >
            <Search size={16} style={{ color: c.iconDark }} />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => { onChangeSearch?.(e.target.value); setIsSearchOpen(true) }}
              onFocus={() => search.trim() && setIsSearchOpen(true)}
              placeholder="Search notes..."
              className="w-full min-w-0 bg-transparent text-base focus:outline-none"
              style={{ color: c.text }}
            />
            {search && (
              <button
                onClick={() => { onChangeSearch?.(''); setIsSearchOpen(false) }}
                className="text-sm transition-colors"
                style={{ color: c.textMuted }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {showMobileSearch && (
            <div className="absolute left-3 right-3 top-full z-50 rounded-b-lg rounded-t-none shadow-2xl overflow-hidden"
              style={{ background: c.mobileSearchResultsBg, border: `1px solid ${c.border}`, borderTop: 'none' }}>
              {mobileFilteredNotes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-center" style={{ color: c.textMuted }}>No results found</p>
              ) : (
                <ul className="scroll-thin max-h-[224px] overflow-y-auto" style={{ borderColor: c.borderLight }}>
                  {mobileFilteredNotes.map((note) => (
                    <li
                      key={note.id}
                      onClick={() => { onSelectNote(note.id); onChangeSearch?.(''); setIsSearchOpen(false) }}
                      className="flex cursor-pointer flex-col gap-0.5 px-4 py-3 transition-colors"
                      style={{ color: c.text, borderBottom: `1px solid ${c.borderLight}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = c.menuHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="text-sm font-medium truncate" style={{ color: c.textBright }}>{note.title || 'Untitled'}</span>
                      <span className="text-xs truncate" style={{ color: c.textMuted }}>{note.content?.replace(/<[^>]*>/g, '').slice(0, 60)}...</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scrollable list */}
      <div className={classNames("scroll-thin flex-1 overflow-y-auto", isMobile ? "px-3 py-3" : "px-2 py-2")}
        onClick={(e) => {
          e.stopPropagation()
          onCloseSidebarContext()
          }}>

        {/* Folders */}
        {activeTab === SidebarTabs.ALL && folders.map((folder) => (
          <div key={folder.id} className="mb-0.5">
            {editingItem && editingItem.kind === 'folder' && editingItem.id === folder.id ? (
              <div className={classNames("flex items-center rounded-md px-2.5 leading-snug", isMobile ? "py-3 text-[17px]" : "py-2.5 text-[15px]")}
                style={{ color: c.icon }}>
                <ChevronDown size={isMobile ? 18 : 16} strokeWidth={1.75} className="mr-1 flex-shrink-0" style={{ color: c.iconMuted }} />
                <Folder size={isMobile ? 19 : 17} strokeWidth={1.75} className="mr-2 flex-shrink-0" style={{ color: c.icon }} />
                <input
                  autoFocus
                  value={editingItem.tempName}
                  onChange={(e) => onChangeEditingName(e.target.value)}
                  onBlur={onCommitEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                    if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                  }}
                  className={classNames("w-full rounded-sm px-1 py-0.5 outline-none", isMobile ? "text-[17px]" : "text-[15px]")}
                  style={{ background: c.inputBg, color: c.textHeading, border: `1px solid ${c.inputBorder}` }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleFolderOpen(folder.id); onSelectFolder(folder.id) }}
                onContextMenu={(e) => onSidebarContext(e, { type: 'folder', folder })}
                className={classNames("flex w-full items-center justify-between rounded-md px-2.5 text-left font-medium leading-snug transition-colors", isMobile ? "py-3 text-[17px]" : "py-2.5 text-[15px]")}
                style={
                  !isMobile && selectedFolderId === folder.id && !selectedNoteId
                    ? { background: c.selected, color: c.selectedText }
                    : { color: c.icon }
                }
                onMouseEnter={(e) => {
                  if (isMobile || !(selectedFolderId === folder.id && !selectedNoteId)) {
                    e.currentTarget.style.background = c.hover
                    e.currentTarget.style.color = c.hoverText
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && selectedFolderId === folder.id && !selectedNoteId) {
                    e.currentTarget.style.background = c.selected
                    e.currentTarget.style.color = c.selectedText
                  } else {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = c.icon
                  }
                }}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  {openFolders.includes(folder.id)
                    ? <ChevronDown size={isMobile ? 18 : 16} strokeWidth={1.75} className="flex-shrink-0" style={{ color: c.iconMuted }} />
                    : <ChevronRight size={isMobile ? 18 : 16} strokeWidth={1.75} className="flex-shrink-0" style={{ color: c.iconMuted }} />
                  }
                  <Folder size={isMobile ? 19 : 17} strokeWidth={1.75} className="flex-shrink-0" style={{ color: c.icon }} />
                  <span className="truncate min-w-0">{folder.name || 'New Folder'}</span>
                </span>
              </button>
            )}

            {/* Notes inside folder */}
            {openFolders.includes(folder.id) &&
              notes.filter((n) => n.folder_id === folder.id).map((note) => (
                editingItem && editingItem.kind === 'note' && editingItem.id === note.id ? (
                  <div key={note.id} className={classNames('ml-6 mt-0.5 flex w-[calc(100%-1.5rem)] items-center rounded-md px-2.5 leading-snug', isMobile ? 'py-3 text-[17px]' : 'py-1.5 text-[14px]')}
                    style={{ color: c.icon }}>
                    <input
                      autoFocus
                      value={editingItem.tempName}
                      onChange={(e) => onChangeEditingName(e.target.value)}
                      onBlur={onCommitEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                        if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                      }}
                      className={classNames('w-full rounded-sm px-1 py-0.5 outline-none', isMobile ? 'text-[17px]' : 'text-[14px]')}
                      style={{ background: c.inputBg, color: c.textHeading, border: `1px solid ${c.inputBorder}` }}
                    />
                  </div>
                ) : (
                  <button
                    key={note.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (e.ctrlKey || e.metaKey) onToggleNoteSelection(note.id)
                      else onSelectNote(note.id)
                    }}
                    onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                    className={classNames(
                      'ml-6 mt-0.5 mb-0.5 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-2.5 text-left leading-snug transition-colors',
                      isMobile ? 'py-3 text-[17px] active:scale-[0.97] active:opacity-80' : 'py-1.5 text-[14px]',
                    )}
                    style={
                      !isMobile && selectedNoteId === note.id
                        ? { background: c.selected, color: c.selectedText }
                        : selectedNoteIds.includes(note.id)
                          ? { background: c.multiSelect, color: c.multiSelectText, boxShadow: selectedNoteId !== note.id ? `inset 2px 0 0 ${c.multiSelectAccent}` : undefined }
                          : { color: c.icon }
                    }
                    onMouseEnter={(e) => {
                      if (!(!isMobile && selectedNoteId === note.id)) {
                        e.currentTarget.style.background = selectedNoteIds.includes(note.id) ? c.multiSelectHover : c.hover
                        e.currentTarget.style.color = c.hoverText
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile && selectedNoteId === note.id) {
                        e.currentTarget.style.background = c.selected
                        e.currentTarget.style.color = c.selectedText
                      } else if (selectedNoteIds.includes(note.id)) {
                        e.currentTarget.style.background = c.multiSelect
                        e.currentTarget.style.color = c.multiSelectText
                      } else {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = c.icon
                      }
                    }}
                  >
                    <FileText
                      size={isMobile ? 17 : 15}
                      strokeWidth={1.75}
                      className="flex-shrink-0"
                      style={{ color: c.iconMuted }}
                    />
                    <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                    {note.is_favorite && <Star size={isMobile ? 15 : 13} fill={c.favorite} color={c.favorite} className="flex-shrink-0" />}
                    {isMobile && (
                      <button
                        type="button"
                        className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded transition-colors"
                        style={{ color: c.iconMuted }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (sidebarContext?.item?.type === 'note' && sidebarContext.item.note?.id === note.id) {
                            onCloseSidebarContext(); return
                          }
                          const rect = e.currentTarget.getBoundingClientRect()
                          const menuW = 176
                          const x = Math.max(8, rect.right - menuW)
                          const spaceBelow = window.innerHeight - rect.bottom
                          const y = spaceBelow > 140 ? rect.bottom + 4 : rect.top - 120
                          onSidebarContext({ preventDefault: () => {}, clientX: x, clientY: y }, { type: 'note', note })
                        }}
                      >
                        <MoreHorizontal size={16} strokeWidth={2} />
                      </button>
                    )}
                  </button>
                )
              ))
            }
          </div>
        ))}

        {/* Standalone / Favorites notes */}
        <div
          className={activeTab === SidebarTabs.ALL ? 'mt-2' : ''}
          // style={activeTab === SidebarTabs.ALL ? { borderTop: '1px solid #333333' } : {}}
        >
          {displayNotes
            .filter((n) => activeTab === SidebarTabs.FAVORITES ? true : !n.folder_id)
            .map((note) => (
              editingItem && editingItem.kind === 'note' && editingItem.id === note.id ? (
                <div key={note.id} className={classNames('flex items-center rounded-md px-2.5 leading-snug', isMobile ? 'py-2.5 text-[17px]' : 'py-1.5 text-[14px]')}
                  style={{ color: c.icon }}>
                  <input
                    autoFocus
                    value={editingItem.tempName}
                    onChange={(e) => onChangeEditingName(e.target.value)}
                    onBlur={onCommitEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                      if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                    }}
                    className={classNames('w-full rounded-sm px-1 py-0.5 outline-none', isMobile ? 'text-[17px]' : 'text-[14px]')}
                    style={{ background: c.inputBg, color: c.textHeading, border: `1px solid ${c.inputBorder}` }}
                  />
                </div>
              ) : (
                <button
                  key={note.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (e.ctrlKey || e.metaKey) onToggleNoteSelection(note.id)
                    else onSelectNote(note.id)
                  }}
                  onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                  className={classNames(
                    'flex w-full items-center gap-2 rounded-md px-2.5 text-left leading-snug transition-colors',
                    isMobile ? 'py-2 text-[17px] active:scale-[0.97] active:opacity-80' : 'mb-0.5 py-1.5 text-[14px]',
                  )}
                  style={
                    !isMobile && selectedNoteId === note.id
                      ? { background: c.selected, color: c.selectedText }
                      : selectedNoteIds.includes(note.id)
                        ? { background: c.multiSelect, color: c.multiSelectText, boxShadow: selectedNoteId !== note.id ? `inset 2px 0 0 ${c.multiSelectAccent}` : undefined }
                        : { color: c.icon }
                  }
                  onMouseEnter={(e) => {
                    if (!(!isMobile && selectedNoteId === note.id)) {
                      e.currentTarget.style.background = selectedNoteIds.includes(note.id) ? c.multiSelectHover : c.hover
                      e.currentTarget.style.color = c.hoverText
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile && selectedNoteId === note.id) {
                      e.currentTarget.style.background = c.selected
                      e.currentTarget.style.color = c.selectedText
                    } else if (selectedNoteIds.includes(note.id)) {
                      e.currentTarget.style.background = c.multiSelect
                      e.currentTarget.style.color = c.multiSelectText
                    } else {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = c.icon
                    }
                  }}
                >
                  <FileText
                    size={isMobile ? 18 : 16}
                    strokeWidth={1.75}
                    className="flex-shrink-0"
                    style={{ color: c.iconMuted }}
                  />
                  <span className="flex-1 truncate min-w-0">{note.title || 'Untitled'}</span>
                  {note.is_favorite && <Star size={isMobile ? 15 : 13} fill={c.favorite} color={c.favorite} className="flex-shrink-0" />}
                  {isMobile && (
                    <button
                      type="button"
                      className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded transition-colors"
                      style={{ color: c.iconMuted }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (sidebarContext?.item?.type === 'note' && sidebarContext.item.note?.id === note.id) {
                          onCloseSidebarContext(); return
                        }
                        const rect = e.currentTarget.getBoundingClientRect()
                        const menuW = 176
                        const x = Math.max(8, rect.right - menuW)
                        const spaceBelow = window.innerHeight - rect.bottom
                        const y = spaceBelow > 140 ? rect.bottom + 4 : rect.top - 120
                        onSidebarContext({ preventDefault: () => {}, clientX: x, clientY: y }, { type: 'note', note })
                      }}
                    >
                      <MoreHorizontal size={18} strokeWidth={2} />
                    </button>
                  )}
                </button>
              )
            ))
          }
        </div>
      </div>
      
    </aside>
  )
}

Sidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onChangeTab: PropTypes.func.isRequired,
  folders: PropTypes.array.isRequired,
  notes: PropTypes.array.isRequired,
  selectedFolderId: PropTypes.string,
  onSelectFolder: PropTypes.func.isRequired,
  selectedNoteId: PropTypes.string,
  onSelectNote: PropTypes.func.isRequired,
  onCreateNote: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
  onSidebarContext: PropTypes.func.isRequired,
  editingItem: PropTypes.shape({
    kind: PropTypes.oneOf(['folder', 'note']),
    id: PropTypes.string,
    tempName: PropTypes.string,
    mode: PropTypes.oneOf(['rename', 'create']),
  }),
  onChangeEditingName: PropTypes.func.isRequired,
  onCommitEditing: PropTypes.func.isRequired,
  onCancelEditing: PropTypes.func.isRequired,
  openFolders: PropTypes.array.isRequired,
  onToggleFolderOpen: PropTypes.func.isRequired,
  onCloseSidebarContext: PropTypes.func.isRequired,
  sidebarContext: PropTypes.object,
  selectedNoteIds: PropTypes.array,
  onToggleNoteSelection: PropTypes.func,
  isMobile: PropTypes.bool,
  search: PropTypes.string,
  onChangeSearch: PropTypes.func,
  onLogout: PropTypes.func,
  theme: PropTypes.string,
  onToggleTheme: PropTypes.func,
}