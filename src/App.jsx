import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Sidebar, SidebarTabs } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { EditorPane } from './components/EditorPane'
import './index.css'
import { Auth } from './components/Auth'
import {
  Star,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Code2,
  Eraser,
  Copy,
  ClipboardPaste,
  TextSelect,
} from 'lucide-react'

const FORMAT_MENU_ICON = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  body: Pilcrow,
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  highlight: Highlighter,
  bullet: List,
  numbered: ListOrdered,
  code: Code2,
  clear: Eraser,
  copy: Copy,
  paste: ClipboardPaste,
  selectAll: TextSelect,
}

/** Unified format menu: slash (/) and right-click on selection */
const FORMAT_MENU_GROUPS = [
  {
    id: 'headings',
    title: 'Headings',
    items: [
      { label: 'Heading 1', command: 'h1' },
      { label: 'Heading 2', command: 'h2' },
      { label: 'Heading 3', command: 'h3' },
      { label: 'Paragraph', command: 'body' },
    ],
  },
  {
    id: 'style',
    title: 'Text',
    items: [
      { label: 'Bold', command: 'bold' },
      { label: 'Italic', command: 'italic' },
      { label: 'Strikethrough', command: 'strike' },
      { label: 'Highlight', command: 'highlight' },
    ],
  },
  {
    id: 'lists',
    title: 'Lists',
    items: [
      { label: 'Bullet list', command: 'bullet' },
      { label: 'Numbered list', command: 'numbered' },
    ],
  },
  {
    id: 'block',
    title: 'Blocks',
    items: [{ label: 'Code block', command: 'code' }],
  },
  {
    id: 'clipboard',
    title: 'Edit',
    items: [
      { label: 'Copy', command: 'copy' },
      { label: 'Paste', command: 'paste' },
      { label: 'Select all', command: 'selectAll' },
    ],
  },
  {
    id: 'clear',
    title: null,
    items: [{ label: 'Clear formatting', command: 'clear', danger: true }],
  },
]

const FORMAT_MENU_FLAT = FORMAT_MENU_GROUPS.flatMap((g) => g.items)

/** Gap from anchor; panel = header strip + list (max 5 option rows) + padding */
const FORMAT_MENU_GAP = 8
const FORMAT_MENU_HEADER_STRIP_PX = 56
/** ~5 option rows visible; rest scrolls (section labels scroll with list) */
const FORMAT_MENU_LIST_MAX_PX = 220
const FORMAT_MENU_PANEL_ESTIMATE = FORMAT_MENU_HEADER_STRIP_PX + FORMAT_MENU_LIST_MAX_PX + 20

function getFormatMenuPlacement(anchor) {
  const h = FORMAT_MENU_PANEL_ESTIMATE
  const gap = FORMAT_MENU_GAP
  const ih = window.innerHeight
  const iw = window.innerWidth
  const spaceBelow = ih - anchor.y - gap
  const spaceAbove = anchor.y - gap

  let top
  let opensAbove = false
  if (spaceBelow >= h) {
    top = anchor.y + gap
  } else if (spaceAbove >= h) {
    top = anchor.y - h - gap
    opensAbove = true
  } else if (spaceBelow >= spaceAbove) {
    top = Math.min(anchor.y + gap, ih - h - gap)
  } else {
    top = Math.max(gap, anchor.y - h - gap)
    opensAbove = true
  }

  const panelW = Math.min(288, iw - 16)
  let left = Math.min(anchor.x, iw - panelW - gap)
  left = Math.max(gap, left)

  top = Math.max(gap, Math.min(top, ih - h - gap))

  return { top, left, opensAbove }
}

function getSidebarContextMenuItems(item) {
  if (!item) return []
  if (item.type === 'note') {
    return [
      { action: 'favorite', label: 'Add to Favourites', showStar: true },
      { action: 'rename', label: 'Rename', showStar: false },
      { action: 'delete', label: 'Delete', danger: true },
    ]
  }
  return [
    { action: 'rename', label: 'Rename', showStar: false },
    { action: 'delete', label: 'Delete', danger: true },
  ]
}

function App() {
  const slashInsertPosRef = useRef(null)
  const sidebarContextRef = useRef(null)
  const sidebarContextMenuIndexRef = useRef(0)
  const applySidebarActionRef = useRef(async () => {})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(SidebarTabs.ALL)
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [search, setSearch] = useState('')
  const [sidebarContext, setSidebarContext] = useState(null)
  const [sidebarContextMenuIndex, setSidebarContextMenuIndex] = useState(0)
  const [editingItem, setEditingItem] = useState(null)
  const [openFolders, setOpenFolders] = useState([])
  const editorRef = useRef(null)
  const [editor, setEditor] = useState()
  const [menu, setMenu] = useState(null)
  const [slashMenuIndex, setSlashMenuIndex] = useState(0)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(288) // 288px = w-72
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isDraggingRef = useRef(false)
  const MIN_SIDEBAR = 180
  const MAX_SIDEBAR = 480
  /** Must match TopBar + Sidebar header row (`h-14`) for the full-width divider */
  const HEADER_ROW_PX = 56

  sidebarContextRef.current = sidebarContext

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
        supabase.from('folders').select('*')
          .eq('user_id', user.id)  // ✅ only this user's folders
          .order('created_at', { ascending: true }),
        supabase.from('notes').select('*')
          .eq('user_id', user.id)  // ✅ only this user's notes
          .order('updated_at', { ascending: false }),
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
  
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open)
  }, [])

  // Add drag handlers
  const handleDragStart = (e) => {
    if (!sidebarOpen) return
    isDraggingRef.current = true
    e.preventDefault()

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, e.clientX))
      setSidebarWidth(newWidth)
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Touch support for mobile drag
  const handleTouchStart = () => {
    if (!sidebarOpen) return

    const onTouchMove = (e) => {
      const touch = e.touches[0]
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, touch.clientX))
      setSidebarWidth(newWidth)
    }

    const onTouchEnd = () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }

    document.addEventListener('touchmove', onTouchMove)
    document.addEventListener('touchend', onTouchEnd)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNotes([])
    setFolders([])
    setSelectedNoteId(null)
  }

  /** Clipboard / focus: run after menu unmounts so the editor can take focus again */
  const runAfterMenuClose = useCallback((fn) => {
    setTimeout(fn, 10)
  }, [])

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
      'copy': () => {
        runAfterMenuClose(() => {
          if (!editor) return
          editor.chain().focus().run()
          const { from, to } = editor.state.selection
          const text =
            from === to
              ? editor.getText({ blockSeparator: '\n' })
              : editor.state.doc.textBetween(from, to, '\n')
          void navigator.clipboard.writeText(text).catch(() => {
            try {
              editor.view.dom.focus()
              document.execCommand('copy')
            } catch {
              /* ignore */
            }
          })
        })
      },
      'paste': () => {
        runAfterMenuClose(() => {
          if (!editor) return
          editor.chain().focus().run()
          void (async () => {
            try {
              const items = await navigator.clipboard.read()
              for (const item of items) {
                if (item.types.includes('text/html')) {
                  const html = await (await item.getType('text/html')).text()
                  editor.chain().focus().insertContent(html).run()
                  return
                }
              }
              const plain = await navigator.clipboard.readText()
              editor.chain().focus().insertContent(plain).run()
            } catch {
              try {
                const plain = await navigator.clipboard.readText()
                editor.chain().focus().insertContent(plain).run()
              } catch {
                /* ignore */
              }
            }
          })()
        })
      },
      'selectAll': () => {
        runAfterMenuClose(() => {
          if (!editor) return
          editor.chain().focus().selectAll().run()
        })
      },
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
    setSlashMenuIndex(0)
    setMenu({ x: e.clientX, y: e.clientY, source: 'context' })
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
    setMenu({ x: cursorCoords.x, y: cursorCoords.y, source: 'slash' })
    setTimeout(() => {
      const closeOnNextClick = () => {
        setMenu(null)
        document.removeEventListener('click', closeOnNextClick)
      }
      document.addEventListener('click', closeOnNextClick)
    }, 0)
  }, [editor])

  const applyFormatMenuCommand = (command) => {
    if (!editor) return
    if (menu?.source === 'slash' && slashInsertPosRef.current !== null) {
      const pos = slashInsertPosRef.current
      editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
      slashInsertPosRef.current = null
    }
    applyCommand(command)
  }

  function handleFormatMenuKeyDown(e) {
    if (!menu) return false
    const len = FORMAT_MENU_FLAT.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSlashMenuIndex((prev) => (prev + 1) % len)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSlashMenuIndex((prev) => (prev - 1 + len) % len)
      return true
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      applyFormatMenuCommand(FORMAT_MENU_FLAT[slashMenuIndex].command)
      return true
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      slashInsertPosRef.current = null
      setMenu(null)
      return true
    }
    return false
  }

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

  /** Editor format menu (/) + right-click: close when navigating away — sidebar clicks use stopPropagation so they never hit clearMenus. */
  useEffect(() => {
    setMenu(null)
    setSlashMenuIndex(0)
    slashInsertPosRef.current = null
  }, [selectedNoteId, selectedFolderId, activeTab, sidebarOpen, search])

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
      user_id: user?.id, title: 'New Page', content: '', folder_id: selectedFolderId,
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

  const sidebarMenuEntries = useMemo(
    () => (sidebarContext ? getSidebarContextMenuItems(sidebarContext.item) : []),
    [sidebarContext]
  )

  const applySidebarAction = async (action) => {
    const target = sidebarContextRef.current?.item
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

  applySidebarActionRef.current = applySidebarAction

  useEffect(() => {
    if (sidebarContext) {
      sidebarContextMenuIndexRef.current = 0
      setSidebarContextMenuIndex(0)
    }
  }, [sidebarContext])

  useEffect(() => {
    if (!sidebarContext) return
    const items = sidebarMenuEntries
    const len = items.length
    if (len === 0) return

    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        const n = (sidebarContextMenuIndexRef.current + 1) % len
        sidebarContextMenuIndexRef.current = n
        setSidebarContextMenuIndex(n)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        const n = (sidebarContextMenuIndexRef.current - 1 + len) % len
        sidebarContextMenuIndexRef.current = n
        setSidebarContextMenuIndex(n)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        const action = items[sidebarContextMenuIndexRef.current]?.action
        if (action) applySidebarActionRef.current(action)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeSidebarContext()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [sidebarContext, sidebarMenuEntries])

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

  const formatMenuPopoverRef = useRef(null)
  const [formatMenuMeasuredPos, setFormatMenuMeasuredPos] = useState(null)

  const formatMenuPlacement = useMemo(
    () => (menu ? getFormatMenuPlacement({ x: menu.x, y: menu.y }) : null),
    [menu]
  )

  /** When the menu opens above the anchor, placement used a tall height estimate — measure real height so the gap matches the “open below” case (FORMAT_MENU_GAP). */
  useLayoutEffect(() => {
    if (!menu) {
      setFormatMenuMeasuredPos(null)
      return
    }
    if (!formatMenuPlacement?.opensAbove) {
      setFormatMenuMeasuredPos(null)
      return
    }
    const el = formatMenuPopoverRef.current
    if (!el) return
    const measuredH = el.getBoundingClientRect().height
    const gap = FORMAT_MENU_GAP
    let top = menu.y - measuredH - gap
    const ih = window.innerHeight
    top = Math.max(gap, Math.min(top, ih - measuredH - gap))
    setFormatMenuMeasuredPos({ top, left: formatMenuPlacement.left })
  }, [menu, formatMenuPlacement])

  const formatMenuStylePos =
    menu && formatMenuPlacement
      ? (formatMenuPlacement.opensAbove && formatMenuMeasuredPos
          ? formatMenuMeasuredPos
          : formatMenuPlacement)
      : null

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
  // ✅ CHANGED: h-screen → height:100dvh (fixes mobile browser bar)
  <div className="flex overflow-hidden text-[#c9c9c9]"
    style={{ background: '#0f0f0f', height: '100dvh' }}>
    <div className="relative flex w-full h-full" onClick={clearMenus}>
      {/* One horizontal rule under the header row (sidebar title + top bar), full viewport width */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-[#333333]"
        style={{ top: HEADER_ROW_PX }}
        aria-hidden
      />

      {/* Sidebar column: width animates when toggled */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
        style={{ width: sidebarOpen ? `${sidebarWidth}px` : 0 }}
      >
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
          onCloseSidebarContext={closeSidebarContext}
        />
      </div>

      {/* Drag handle between sidebar and editor (hidden when sidebar collapsed) */}
      {sidebarOpen && (
        <div
          className="flex-shrink-0 w-1 cursor-col-resize flex items-center justify-center group"
          style={{ background: '#1a1a1a' }}
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
        >
          <div
            className="w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: '#444444' }}
          />
        </div>
      )}

      <main className="flex flex-1 flex-col bg-[#1a1a1a] min-h-0 overflow-hidden min-w-0">
        <TopBar
          notes={notes}
          search={search}
          onChangeSearch={setSearch}
          onSelectNote={setSelectedNoteId}
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
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
          onFormatMenuKeyDown={handleFormatMenuKeyDown}
          isFormatMenuOpen={Boolean(menu)}
          setEditorInstance={setEditor}
          onToggleFavorite={handleToggleFavorite}
          onDeleteNote={handleDeleteNote}
        />
      </main>
    </div>

    {/* Sidebar context menu — unchanged */}
    {sidebarContext && (
        <div
          className="fixed z-40 min-w-[11rem] rounded-md border border-[#333333] bg-[#1a1a1a] py-1 px-0.5 text-[13px] shadow-xl"
          style={{ top: sidebarContext.y, left: sidebarContext.x, color: '#e8e8e8' }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
          aria-label="Note and folder actions"
        >
          {sidebarMenuEntries.map((entry, i) => {
            const active = sidebarContextMenuIndex === i
            return (
              <button
                key={entry.action}
                type="button"
                role="menuitem"
                className={[
                  'flex w-full items-center rounded-md px-3 py-2 text-left transition-colors',
                  active
                    ? 'bg-[#2a2a2a] text-white'
                    : entry.danger
                      ? 'text-rose-400 hover:bg-[#353535] hover:text-rose-300'
                      : 'text-[#e0e0e0] hover:bg-[#353535] hover:text-[#f9fafb]',
                  entry.showStar ? 'justify-between gap-2' : '',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => {
                  sidebarContextMenuIndexRef.current = i
                  setSidebarContextMenuIndex(i)
                }}
                onClick={() => applySidebarAction(entry.action)}
              >
                <span>{entry.label}</span>
                {entry.showStar ? <Star size={13} strokeWidth={1.75} className="shrink-0 opacity-90" /> : null}
              </button>
            )
          })}
        </div>
    )}

    {/* Unified format menu: same UI for / and right-click (source only affects deleting /) */}
    {menu && formatMenuStylePos && (
      <div
        ref={formatMenuPopoverRef}
        className="format-menu-popover fixed z-50 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-[#333333] bg-[#1a1a1a] py-1.5 shadow-2xl shadow-black/40"
        style={{
          top: formatMenuStylePos.top,
          left: formatMenuStylePos.left,
        }}
        onClick={(e) => e.stopPropagation()}
        role="listbox"
        aria-label="Formatting"
      >
        <div className="border-b border-[#333333] px-3 pb-1.5 pt-0.5">
          <p className="format-menu-header-title text-[11px] font-semibold uppercase tracking-[0.18em]">
            Formatting
          </p>
          {/* <p className="text-[11px] text-slate-500">
            Headings, text, lists, and blocks — same menu for / and right-click
          </p> */}
        </div>
        <div
          className="scroll-thin overflow-y-auto px-1.5 py-1"
          style={{ maxHeight: FORMAT_MENU_LIST_MAX_PX }}
        >
          {FORMAT_MENU_GROUPS.map((group, gi) => {
            let flatOffset = 0
            for (let i = 0; i < gi; i++) flatOffset += FORMAT_MENU_GROUPS[i].items.length
            return (
              <div key={group.id} className="mb-2 last:mb-0">
                {group.title && (
                  <p className="format-menu-section-title px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    {group.title}
                  </p>
                )}
                {group.items.map((item, ii) => {
                  const flatIndex = flatOffset + ii
                  const selected = flatIndex === slashMenuIndex
                  const isDanger = item.danger
                  const Icon = FORMAT_MENU_ICON[item.command] ?? Pilcrow
                  const labelClass = [
                    'format-menu-label',
                    'min-w-0 flex-1 truncate',
                    selected && 'text-white',
                    !selected && item.command === 'highlight' && 'format-menu-label--highlight',
                    !selected && item.command === 'bold' && 'font-semibold',
                    !selected && item.command === 'italic' && 'italic',
                    !selected && !item.danger && item.command !== 'highlight' && 'text-[#d1d5db]',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  const iconClass = [
                    'format-menu-icon',
                    item.command === 'highlight' && 'format-menu-icon--highlight',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <button
                      key={`${group.id}-${item.command}-${ii}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setSlashMenuIndex(flatIndex)}
                      onClick={() => applyFormatMenuCommand(item.command)}
                      className={[
                        'format-menu-option',
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                        selected && 'format-menu-option--selected',
                        !selected && isDanger && 'format-menu-option--danger text-rose-400',
                        !selected && !isDanger && 'text-[#d1d5db]',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <Icon
                        size={17}
                        strokeWidth={2}
                        className={iconClass}
                        aria-hidden
                      />
                      <span className={labelClass}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )}
  </div>
)
}

export default App