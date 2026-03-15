import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Sidebar, SidebarTabs } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { EditorPane } from './components/EditorPane'
import './index.css'
import { Auth } from './components/Auth'

const SLASH_COMMANDS = [
  { label: 'Heading 1', command: 'h1' },
  { label: 'Heading 2', command: 'h2' },
  { label: 'Heading 3', command: 'h3' },
  { label: 'Bold', command: 'bold' },
  { label: 'Italic', command: 'italic' },
  { label: 'Strikethrough', command: 'strike' },
  { label: 'Highlight', command: 'highlight' },
  { label: 'Bullet List', command: 'bullet' },
  { label: 'Numbered List', command: 'numbered' },
  { label: 'Code Block', command: 'code' },
]

function App() {
  const slashInsertPosRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(SidebarTabs.ALL)
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [search, setSearch] = useState('')
  const [sidebarContext, setSidebarContext] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [openFolders, setOpenFolders] = useState([])
  const editorRef = useRef(null)
  const [editor, setEditor] = useState()
  const [menu, setMenu] = useState(null)
  const [slashMenuIndex, setSlashMenuIndex] = useState(0)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const CONTEXT_MENU_HEIGHT = 260  // accurate height for 6 buttons + label + divider
  const SLASH_MENU_HEIGHT = 220    // 5 visible items + label + scroll

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Data loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const [{ data: foldersData }, { data: notesData }] = await Promise.all([
        supabase.from('folders').select('*').order('created_at', { ascending: true }),
        supabase.from('notes').select('*').order('updated_at', { ascending: false }),
      ])
      setFolders(foldersData ?? [])
      setNotes(notesData ?? [])
      if (!selectedNoteId && (notesData?.length ?? 0) > 0) {
        setSelectedNoteId(notesData[0].id)
      }
      setLoading(false)
    }
    load()
  }, [user])

  // ── Handlers ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNotes([])
    setFolders([])
    setSelectedNoteId(null)
  }

  const applyCommand = (command) => {
    const chain = editor.chain().focus()
    const actions = {
      'h1': () => chain.toggleHeading({ level: 1 }).run(),
      'h2': () => chain.toggleHeading({ level: 2 }).run(),
      'h3': () => chain.toggleHeading({ level: 3 }).run(),
      'h4': () => chain.toggleHeading({ level: 4 }).run(),
      'body': () => chain.setParagraph().run(),
      'bold': () => chain.toggleBold().run(),
      'italic': () => chain.toggleItalic().run(),
      'strike': () => chain.toggleStrike().run(),
      'highlight': () => chain.toggleHighlight().run(),
      'bullet': () => chain.toggleBulletList().run(),
      'numbered': () => chain.toggleOrderedList().run(),
      'code': () => chain.toggleCodeBlock().run(),
      'clear': () => chain.clearNodes().unsetAllMarks().run(),
    }
    if (actions[command]) actions[command]()
    setMenu(null)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // ✅ Don't open context menu inside code block
    if (editor) {
      const isInCodeBlock = editor.state.selection.$from.parent.type.name === 'codeBlock'
      if (isInCodeBlock) return
    }

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') return
    setMenu({ x: e.clientX, y: e.clientY, type: 'context' })
    setTimeout(() => {
      const closeOnNextClick = () => {
        setMenu(null)
        document.removeEventListener('click', closeOnNextClick)
      }
      document.addEventListener('click', closeOnNextClick)
    }, 0)
  }

  const handleSlashKey = useCallback((cursorCoords) => {
    if (editor) {
      // ✅ Read position AFTER setTimeout so '/' is already inserted
      // editor.state.selection.from is now pointing AFTER the '/'
      // so the '/' is at from - 1
      slashInsertPosRef.current = editor.state.selection.from - 1
    }
    setSlashMenuIndex(0)
    setMenu({ x: cursorCoords.x, y: cursorCoords.y, type: 'slash' })
    setTimeout(() => {
      const closeOnNextClick = () => {
        setMenu(null)
        document.removeEventListener('click', closeOnNextClick)
      }
      document.addEventListener('click', closeOnNextClick)
    }, 0)
  }, [editor])

  const applySlashCommand = (command) => {
    if (!editor) return
    const pos = slashInsertPosRef.current
    if (pos !== null) {
      editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
    }
    applyCommand(command)
    slashInsertPosRef.current = null
  }

  const handleSlashMenuKeyDown = useCallback((e) => {
    if (!menu || menu.type !== 'slash') return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSlashMenuIndex((prev) => (prev + 1) % SLASH_COMMANDS.length)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSlashMenuIndex((prev) => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length)
      return true
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      applySlashCommand(SLASH_COMMANDS[slashMenuIndex].command)
      return true
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setMenu(null)
      return true
    }
    return false
  }, [menu, slashMenuIndex])

  const visibleNotes = useMemo(() => {
    let list = notes
    if (activeTab === SidebarTabs.FAVORITES) list = list.filter((n) => n.is_favorite)
    if (selectedFolderId) list = list.filter((n) => n.folder_id === selectedFolderId)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((n) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))
    }
    return list
  }, [notes, activeTab, selectedFolderId, search])

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? visibleNotes[0] ?? null

  useEffect(() => {
    if (!selectedNote && visibleNotes.length > 0) {
      setSelectedNoteId(visibleNotes[0].id)
    }
  }, [selectedNote, visibleNotes])

  const updateNoteContent = async (changes) => {
    if (!selectedNote) return
    const next = { ...selectedNote, ...changes, updated_at: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? next : n)))
    const { error } = await supabase.from('notes').update(changes).eq('id', selectedNote.id)
    if (error) console.error('Error updating note', error)
  }

  const handleTitleChange = (e) => updateNoteContent({ title: e.target.value || 'Untitled' })

  const handleCreateNote = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('notes').insert([{
      user_id: user?.id, title: 'Untitled', content: '', folder_id: selectedFolderId,
    }]).select().single()
    if (error) { console.error('Error creating note', error); return }
    setNotes((prev) => [data, ...prev])
    setSelectedNoteId(data.id)
  }

  const handleCreateFolder = async () => {
    const tempId = `temp-folder-${Date.now()}`
    setFolders((prev) => [...prev, { id: tempId, name: '', user_id: null, created_at: new Date().toISOString() }])
    setEditingItem({ kind: 'folder', id: tempId, tempName: '', mode: 'create' })
  }

  const handleToggleFavorite = async (note) => {
    const next = !note.is_favorite
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_favorite: next } : n)))
    const { error } = await supabase.from('notes').update({ is_favorite: next }).eq('id', note.id)
    if (error) console.error('Error updating favorite', error)
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    if (selectedNoteId === noteId) setSelectedNoteId(null)
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (error) console.error('Error deleting note', error)
  }

  const handleSidebarContext = (e, item) => {
    e.preventDefault()
    setSidebarContext({ x: e.clientX, y: e.clientY, item })
  }

  const closeSidebarContext = () => setSidebarContext(null)

  const applySidebarAction = async (action) => {
    const target = sidebarContext?.item
    if (!target) return
    if (action === 'favorite' && target.type === 'note') await handleToggleFavorite(target.note)
    if (action === 'rename') {
      if (target.type === 'folder') {
        setEditingItem({ kind: 'folder', id: target.folder.id, tempName: target.folder.name ?? '', mode: 'rename' })
      } else {
        setEditingItem({ kind: 'note', id: target.note.id, tempName: target.note.title ?? '', mode: 'rename' })
      }
    }
    if (action === 'delete') {
      if (target.type === 'folder') {
        if (!window.confirm('Delete this folder? Notes in it will become standalone notes.')) return
        setFolders((prev) => prev.filter((f) => f.id !== target.folder.id))
        setNotes((prev) => prev.map((n) => n.folder_id === target.folder.id ? { ...n, folder_id: null } : n))
        await supabase.from('folders').delete().eq('id', target.folder.id)
      } else {
        await handleDeleteNote(target.note.id)
      }
    }
    closeSidebarContext()
  }

  const handleChangeEditingName = (name) => setEditingItem((prev) => prev ? { ...prev, tempName: name } : prev)

  const handleCancelEditing = () => {
    if (editingItem?.mode === 'create' && editingItem.kind === 'folder') {
      setFolders((prev) => prev.filter((f) => f.id !== editingItem.id))
    }
    setEditingItem(null)
  }

  const handleCommitEditing = async () => {
    if (!editingItem) return
    const name = editingItem.tempName?.trim() ?? ''
    if (!name) { handleCancelEditing(); return }
    if (editingItem.kind === 'folder') {
      if (editingItem.mode === 'create') {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase.from('folders').insert([{ user_id: user?.id, name }]).select().single()
        if (error) { console.error('Error creating folder', error); return }
        setFolders((prev) => prev.map((f) => f.id === editingItem.id ? { ...f, ...data } : f))
      } else {
        setFolders((prev) => prev.map((f) => f.id === editingItem.id ? { ...f, name } : f))
        const { error } = await supabase.from('folders').update({ name }).eq('id', editingItem.id)
        if (error) console.error('Error renaming folder', error)
      }
    } else if (editingItem.kind === 'note') {
      setNotes((prev) => prev.map((n) => n.id === editingItem.id ? { ...n, title: name } : n))
      const { error } = await supabase.from('notes').update({ title: name }).eq('id', editingItem.id)
      if (error) console.error('Error renaming note', error)
    }
    setEditingItem(null)
  }

  const handleToggleFolderOpen = (folderId) => {
    setOpenFolders((prev) => prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId])
  }

  const clearMenus = () => { closeSidebarContext(); setMenu(null) }

  // ── Smart menu positioning ────────────────────────────────────────
  const menuHeight = menu?.type === 'context' ? CONTEXT_MENU_HEIGHT : SLASH_MENU_HEIGHT
  const showAbove = menu ? (window.innerHeight - menu.y) < menuHeight + 40 : false

  // ── Early returns ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return <Auth />

  // ── Render ────────────────────────────────────────────────────────
  return (
<div className="flex h-screen overflow-hidden bg-[#0f0f0f] text-slate-100">
  <div className="flex w-full h-full" onClick={clearMenus}>
        <Sidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          folders={folders}
          user={user}
          notes={notes}
          search={search}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onSidebarContext={handleSidebarContext}
          editingItem={editingItem}
          onChangeEditingName={handleChangeEditingName}
          onCommitEditing={handleCommitEditing}
          onCancelEditing={handleCancelEditing}
          openFolders={openFolders}
          onToggleFolderOpen={handleToggleFolderOpen}
        />

<main className="flex flex-1 flex-col bg-[#0f0f0f] min-h-0 overflow-hidden">
          <TopBar
            notes={notes}
            search={search}
            onChangeSearch={setSearch}
            selectedNote={selectedNote}
            onSelectNote={setSelectedNoteId}
            onDeleteNote={handleDeleteNote}
            user={user}
            onLogout={handleLogout}
            onOpenMenu={(e) =>
              setSidebarContext((prev) =>
                prev && prev.special === 'top' ? null : {
                  special: 'top', x: e.clientX, y: e.clientY + 10,
                  item: { type: 'note', note: selectedNote },
                }
              )
            }
          />
          <EditorPane
            loading={loading}
            selectedNote={selectedNote}
            onCreateNote={handleCreateNote}
            onTitleChange={handleTitleChange}
            editorRef={editorRef}
            onEditorChange={(html) => updateNoteContent({ content: html })}
            onSlashKey={handleSlashKey}
            onContextMenu={handleContextMenu}
            onSlashMenuKeyDown={handleSlashMenuKeyDown}
            isSlashMenuOpen={menu?.type === 'slash'}
            setEditorInstance={setEditor}
             onToggleFavorite={handleToggleFavorite}  // ✅ add
  onDeleteNote={handleDeleteNote}
          />
        </main>
      </div>

      {/* Sidebar context menu */}
      {sidebarContext && (
        <div
          className="fixed z-40 w-40 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-xs text-slate-100 shadow-xl"
          style={{ top: sidebarContext.y, left: sidebarContext.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-[#2a2a2a]" onClick={() => applySidebarAction('favorite')}>
            <span>Add to Favourites</span><span>★</span>
          </button>
          <button type="button" className="w-full px-3 py-1.5 text-left hover:bg-[#2a2a2a]" onClick={() => applySidebarAction('rename')}>Rename</button>
          <button type="button" className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-[#2a2a2a]" onClick={() => applySidebarAction('delete')}>Delete</button>
        </div>
      )}

      {/* Context + Slash menu */}
      {menu && (
        <div
          className="fixed z-50 w-52 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1 shadow-xl"
          style={{
            top: showAbove ? menu.y - menuHeight : menu.y + 8, // ✅ +8 instead of +24 — closer to cursor
            left: Math.min(menu.x, window.innerWidth - 220),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.type === 'context' ? (
            <>
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500">Format</p>
              <button onClick={() => applyCommand('h1')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm">Heading 1</button>
              <button onClick={() => applyCommand('h2')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm">Heading 2</button>
              <button onClick={() => applyCommand('bold')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm font-bold">Bold</button>
              <button onClick={() => applyCommand('italic')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm italic">Italic</button>
              <button onClick={() => applyCommand('highlight')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm text-yellow-400">Highlight</button>
              <div className="my-1 border-t border-[#2a2a2a]" />
              <button onClick={() => applyCommand('clear')} className="w-full text-left px-3 py-1.5 hover:bg-[#2a2a2a] rounded text-sm text-rose-400">Clear Formatting</button>
            </>
          ) : (
            <>
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-slate-500">Format</p>
              <div className="max-h-[160px] overflow-y-auto scroll-thin">
                {SLASH_COMMANDS.map((item, i) => (
                  <button
                    key={item.command}
                    onClick={() => applySlashCommand(item.command)}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      i === slashMenuIndex ? 'bg-indigo-600 text-white' : 'hover:bg-[#2a2a2a] text-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App