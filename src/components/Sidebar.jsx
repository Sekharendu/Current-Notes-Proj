import PropTypes from 'prop-types'

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
  notes,
  search,
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
}) {

  const displayNotes = notes
  .filter((n) => activeTab === SidebarTabs.FAVORITES ? n.is_favorite : true)
  .filter((n) => search.trim()
    ? n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase())
    : true
  )
  return (
    <aside className="flex w-72 flex-col border-r border-slate-800 bg-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold">
            N
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">Notes</span>
            <span className="text-[11px] text-slate-400">Personal workspace</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
        <button
          type="button"
          className={classNames(
            'flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800',
            activeTab === SidebarTabs.ALL && 'bg-slate-800 text-slate-50',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onChangeTab(SidebarTabs.ALL)
            onSelectFolder(null)
          }}
        >
          <span className="text-lg">☰</span>
        </button>
        <button
          type="button"
          className={classNames(
            'flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800',
            activeTab === SidebarTabs.FAVORITES && 'bg-slate-800 text-yellow-400',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onChangeTab(SidebarTabs.FAVORITES)
            onSelectFolder(null)
          }}
        >
          <span className="text-lg">★</span>
        </button>
        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-slate-100 hover:bg-slate-700"
          onClick={(e) => {
            e.stopPropagation()
            onCreateNote()
          }}
        >
          +
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-50"
          onClick={(e) => {
            e.stopPropagation()
            onCreateFolder()
          }}
        >
          📁
        </button>
      </div>

      <div
        className="scroll-thin flex-1 overflow-y-auto px-2 py-2"
        onClick={(e) => {
          e.stopPropagation()
          onSelectFolder(null)
        }}
      >
        {activeTab === SidebarTabs.ALL && folders.map((folder) => (
          <div key={folder.id} className="mb-1">
            {editingItem && editingItem.kind === 'folder' && editingItem.id === folder.id ? (
              <div className="flex items-center rounded-md px-2 py-1.5 text-xs text-slate-300">
                <span className="mr-1 text-[10px] text-slate-500">▾</span>
                <span className="mr-2">📁</span>
                <input
                  autoFocus
                  value={editingItem.tempName}
                  onChange={(e) => onChangeEditingName(e.target.value)}
                  onBlur={onCommitEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onCommitEditing()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      onCancelEditing()
                    }
                  }}
                  className="w-full rounded-sm bg-slate-900/80 px-1 py-0.5 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-slate-500"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFolderOpen(folder.id)
                  onSelectFolder(folder.id)
                  // onSelectNote(null)
                }}
                onContextMenu={(e) => onSidebarContext(e, { type: 'folder', folder })}
                className={classNames(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800/70',
                  selectedFolderId === folder.id && !selectedNoteId && 'bg-slate-800 text-slate-50',
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="text-[10px]">
                    {openFolders.includes(folder.id) ? '▾' : '▸'}
                  </span>
                  <span className="ml-1">📁</span>
                  <span className="truncate">{folder.name || 'New Folder'} </span>
                </span>
              </button>
            )}

            {openFolders.includes(folder.id) &&
              notes
                .filter((n) => n.folder_id === folder.id)
                .map((note) => (
                editingItem &&
                editingItem.kind === 'note' &&
                editingItem.id === note.id ? (
                  <div className="ml-7 mt-0.5 flex w-[calc(100%-1.75rem)] items-center rounded-md px-2 py-1 text-[11px] text-slate-300">
                    <input
                      autoFocus
                      value={editingItem.tempName}
                      onChange={(e) => onChangeEditingName(e.target.value)}
                      onBlur={onCommitEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onCommitEditing()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          onCancelEditing()
                        }
                      }}
                      className="w-full rounded-sm bg-slate-900/80 px-1 py-0.5 text-[11px] text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-slate-500"
                    />
                  </div>
                ) : (
                  <button
                    key={note.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectNote(note.id)
                    }}
                    onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                    className={classNames(
                      'ml-7 mt-0.5 flex w-[calc(100%-1.75rem)] items-center justify-between rounded-md px-2 py-1 text-left text-[11px] text-slate-300 hover:bg-slate-800/70',
                      selectedNoteId === note.id && 'bg-slate-800 text-slate-50',
                    )}
                  >
                    <span className="truncate">{note.title || 'Untitled'}</span>
                    {note.is_favorite && (
                      <span className="ml-1 text-[10px] text-yellow-400">★</span>
                    )}
                  </button>
                )
              ))}
          </div>
        ))}

        <div className="mt-2 border-t border-slate-800/70 pt-2">
          {displayNotes
            .filter((n) => activeTab === SidebarTabs.FAVORITES ? true : !n.folder_id)
            .map((note) => (
              (editingItem &&
              editingItem.kind === 'note' &&
              editingItem.id === note.id ? (
                <div className="flex items-center rounded-md px-2 py-1.5 text-xs text-slate-300">
                  <input
                    autoFocus
                    value={editingItem.tempName}
                    onChange={(e) => onChangeEditingName(e.target.value)}
                    onBlur={onCommitEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onCommitEditing()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        onCancelEditing()
                      }
                    }}
                    className="w-full rounded-sm bg-slate-900/80 px-1 py-0.5 text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-slate-500"
                  />
                </div>
              ) : (
                <button
                  key={note.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectNote(note.id)
                  }}
                  onContextMenu={(e) => onSidebarContext(e, { type: 'note', note })}
                  className={classNames(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800/70',
                    selectedNoteId === note.id && 'bg-slate-800 text-slate-50',
                  )}
                >
                  <span className="truncate">{note.title || 'Untitled'}</span>
                  {note.is_favorite && (
                    <span className="ml-1 text-[10px] text-yellow-400">★</span>
                  )}
                </button>
              ))
            ))}
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
}

