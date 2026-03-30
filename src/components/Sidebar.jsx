import PropTypes from 'prop-types'
import { List, Star, Plus, FileText, FolderPlus, ChevronRight, ChevronDown, Folder } from 'lucide-react'
import { KiroBitLogo } from './KiroBitLogo'

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
  onCloseSidebarContext
}) {
  const displayNotes = notes.filter((n) =>
    activeTab === SidebarTabs.FAVORITES ? n.is_favorite : true
  )

  return (
    <aside className="flex flex-col h-full overflow-hidden"
      style={{ background: '#222222', borderRight: '1px solid #333333' }}>

      {/* Header — height matches TopBar (`h-14`); bottom rule is drawn in App full-width */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" aria-hidden>
            <KiroBitLogo variant="minimal" size="xs" />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight truncate min-w-0" style={{ color: '#ffffff' }}>
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}'s Notes
            </span>
            <span className="text-[11px]" style={{ color: '#6b7280' }}>Personal workspace</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid #333333' }}>
        <button
          type="button"
          className={classNames(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            activeTab === SidebarTabs.ALL
              ? 'bg-[#2a2a2a] text-white'
              : 'text-[#6b7280] hover:bg-[#353535] hover:text-[#f3f4f6]',
          )}
          onClick={(e) => { e.stopPropagation(); onChangeTab(SidebarTabs.ALL); onSelectFolder(null) }}
        >
          <List size={17} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={classNames(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            activeTab === SidebarTabs.FAVORITES
              ? 'bg-[#2a2a2a] text-yellow-400'
              : 'text-[#6b7280] hover:bg-[#353535] hover:text-[#f3f4f6]',
          )}
          onClick={(e) => { e.stopPropagation(); onChangeTab(SidebarTabs.FAVORITES); onSelectFolder(null) }}
          title="Favorites"
        >
          <Star size={17} strokeWidth={1.75} fill={activeTab === SidebarTabs.FAVORITES ? '#eab308' : 'none'} />
        </button>

        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[#9ca3af] hover:bg-[#333333] hover:text-[#d1d5db]"
          onClick={(e) => { e.stopPropagation(); onCreateNote() }}
          title="New note"
        >
          <Plus size={17} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[#6b7280] hover:bg-[#353535] hover:text-[#f3f4f6]"
          onClick={(e) => { e.stopPropagation(); onCreateFolder() }}
          title="New folder"
        >
          <FolderPlus size={17} strokeWidth={1.75} />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="scroll-thin flex-1 overflow-y-auto px-2 py-2"
        onClick={(e) => {
          e.stopPropagation()
          onCloseSidebarContext()
          }}>

        {/* Folders */}
        {activeTab === SidebarTabs.ALL && folders.map((folder) => (
          <div key={folder.id} className="mb-0.5">
            {editingItem && editingItem.kind === 'folder' && editingItem.id === folder.id ? (
              // ✅ CHANGED: py-1.5 → py-2, text-xs → text-sm
              <div className="flex items-center rounded-md px-2.5 py-2.5 text-[15px] leading-snug"
                style={{ color: '#9ca3af' }}>
                <ChevronDown size={16} strokeWidth={1.75} className="mr-1 flex-shrink-0" style={{ color: '#6b7280' }} />
                <Folder size={17} strokeWidth={1.75} className="mr-2 flex-shrink-0" style={{ color: '#9ca3af' }} />
                <input
                  autoFocus
                  value={editingItem.tempName}
                  onChange={(e) => onChangeEditingName(e.target.value)}
                  onBlur={onCommitEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                    if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                  }}
                  // ✅ CHANGED: text-xs → text-sm
                  className="w-full rounded-sm px-1 py-0.5 text-[15px] outline-none"
                  style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #444444' }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleFolderOpen(folder.id); onSelectFolder(folder.id) }}
                onContextMenu={(e) => onSidebarContext(e, { type: 'folder', folder })}
                className={classNames(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-left text-[15px] font-medium leading-snug transition-colors',
                  selectedFolderId === folder.id && !selectedNoteId
                    ? 'bg-[#505050] text-[#f3f4f6] hover:bg-[#464646]'
                    : 'text-[#9ca3af] hover:bg-[#3a3a3a] hover:text-[#f3f4f6]',
                )}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  {openFolders.includes(folder.id)
                    ? <ChevronDown size={16} strokeWidth={1.75} className="flex-shrink-0" style={{ color: '#6b7280' }} />
                    : <ChevronRight size={16} strokeWidth={1.75} className="flex-shrink-0" style={{ color: '#6b7280' }} />
                  }
                  <Folder size={17} strokeWidth={1.75} className="flex-shrink-0" style={{ color: '#9ca3af' }} />
                  <span className="truncate min-w-0">{folder.name || 'New Folder'}</span>
                </span>
              </button>
            )}

            {/* Notes inside folder */}
            {openFolders.includes(folder.id) &&
              notes.filter((n) => n.folder_id === folder.id).map((note) => (
                editingItem && editingItem.kind === 'note' && editingItem.id === note.id ? (
                  // ✅ CHANGED: text-[11px] → text-xs
                  <div key={note.id} className="ml-6 mt-0.5 flex w-[calc(100%-1.5rem)] items-center rounded-md px-2.5 py-2 text-[13px] leading-snug"
                    style={{ color: '#9ca3af' }}>
                    <input
                      autoFocus
                      value={editingItem.tempName}
                      onChange={(e) => onChangeEditingName(e.target.value)}
                      onBlur={onCommitEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                        if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                      }}
                      // ✅ CHANGED: text-[11px] → text-xs
                      className="w-full rounded-sm px-1 py-0.5 text-[13px] outline-none"
                      style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #444444' }}
                    />
                  </div>
                ) : (
                  <button
                    key={note.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelectNote(note.id) }}
                    onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                    className={classNames(
                      'ml-6 mt-0.5 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] leading-snug transition-colors',
                      selectedNoteId === note.id
                        ? 'bg-[#505050] text-[#f3f4f6] hover:bg-[#464646]'
                        : 'text-[#9ca3af] hover:bg-[#3a3a3a] hover:text-[#f3f4f6]',
                    )}
                  >
                    <FileText
                      size={15}
                      strokeWidth={1.75}
                      className="flex-shrink-0"
                      style={{ color: selectedNoteId === note.id ? '#9ca3af' : '#6b7280' }}
                    />
                    <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
                    {note.is_favorite && <Star size={13} fill='#eab308' color='#eab308' className="flex-shrink-0" />}
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
                // ✅ CHANGED: text-xs → text-sm, py-1.5 → py-2
                <div key={note.id} className="flex items-center rounded-md px-2.5 py-2.5 text-[15px] leading-snug"
                  style={{ color: '#9ca3af' }}>
                  <input
                    autoFocus
                    value={editingItem.tempName}
                    onChange={(e) => onChangeEditingName(e.target.value)}
                    onBlur={onCommitEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); onCommitEditing() }
                      if (e.key === 'Escape') { e.preventDefault(); onCancelEditing() }
                    }}
                    className="w-full rounded-sm px-1 py-0.5 text-[15px] outline-none"
                    style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #444444' }}
                  />
                </div>
              ) : (
                <button
                  key={note.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelectNote(note.id) }}
                  onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                  className={classNames(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-[15px] leading-snug transition-colors',
                    selectedNoteId === note.id
                      ? 'bg-[#505050] text-[#f3f4f6] hover:bg-[#464646]'
                      : 'text-[#9ca3af] hover:bg-[#3a3a3a] hover:text-[#f3f4f6]',
                  )}
                >
                  <FileText
                    size={16}
                    strokeWidth={1.75}
                    className="flex-shrink-0"
                    style={{ color: selectedNoteId === note.id ? '#9ca3af' : '#6b7280' }}
                  />
                  <span className="flex-1 truncate min-w-0">{note.title || 'Untitled'}</span>
                  {note.is_favorite && <Star size={13} fill='#eab308' color='#eab308' className="flex-shrink-0" />}
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
}