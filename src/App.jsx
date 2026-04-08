import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Sidebar, SidebarTabs } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { EditorPane } from './components/EditorPane'
import './index.css'
import { Auth } from './components/Auth'
import { getColors } from './theme'
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
  Palette,
  ChevronRight,
} from 'lucide-react'

const TEXT_COLORS = [
  { label: 'Red',     color: '#ef4444' },
  { label: 'Orange',  color: '#f97316' },
  { label: 'Yellow',  color: '#eab308' },
  { label: 'Green',   color: '#22c55e' },
  { label: 'Blue',    color: '#3b82f6' },
  { label: 'Purple',  color: '#a855f7' },
  { label: 'Pink',    color: '#ec4899' },
  { label: 'Gray',    color: '#6b7280' },
]

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
  textColor: Palette,
  clearColor: Eraser,
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
    id: 'color',
    title: null,
    items: [{ label: 'Text Color', command: 'textColor', hasSubmenu: true }],
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
/** ~7 option rows visible; rest scrolls (section labels scroll with list) */
const FORMAT_MENU_LIST_MAX_PX = 300
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
  if (item.type === 'multi-note') {
    return [
      { action: 'delete-multi', label: `Delete ${item.noteIds.length} notes`, danger: true },
    ]
  }
  if (item.type === 'note') {
    const isFav = item.note?.is_favorite
    return [
      { action: 'favorite', label: isFav ? 'Remove from Favourites' : 'Add to Favourites', showStar: true },
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [mobileView, setMobileView] = useState('sidebar')
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark')
  const isDraggingRef = useRef(false)
  const colorSubmenuBtnRef = useRef(null)
  const [colorSubmenu, setColorSubmenu] = useState(null)
  const c = getColors(theme)

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('app-theme', next)
      return next
    })
  }, [])
  const MIN_SIDEBAR = 180
  const MAX_SIDEBAR = 480
  /** Must match TopBar + Sidebar header row (`h-14`) for the full-width divider */
  const HEADER_ROW_PX = 56

  sidebarContextRef.current = sidebarContext

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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

  const handleSelectNote = useCallback((noteId) => {
    setSelectedNoteId(noteId)
    setSelectedNoteIds([])
    if (isMobile) setMobileView('editor')
  }, [isMobile])

  const handleToggleNoteSelection = useCallback((noteId) => {
    setSelectedNoteIds(prev => {
      if (prev.includes(noteId)) return prev.filter(id => id !== noteId)
      const next = [...prev, noteId]
      if (prev.length === 0 && selectedNoteId && selectedNoteId !== noteId) {
        next.unshift(selectedNoteId)
      }
      return next
    })
  }, [selectedNoteId])

  const handleMobileBack = useCallback(() => {
    setMobileView('sidebar')
    setSelectedNoteId(null)
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
      'clearColor': () => chain.unsetColor().run(),
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
    if (command === 'textColor') return
    if (actions[command]) {
      actions[command]()
    } else if (command.startsWith('color-')) {
      chain.setColor(command.slice(6)).run()
    }
    setColorSubmenu(null)
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
    setColorSubmenu(null)
    slashInsertPosRef.current = null
  }, [selectedNoteId, selectedFolderId, activeTab, sidebarOpen, search])

  const updateNoteContent = async (changes) => {
    if (!selectedNote) return
    const next = { ...selectedNote, ...changes, updated_at: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? next : n)))
    if (String(selectedNote.id).startsWith('temp-')) return
    const { error } = await supabase.from('notes').update(changes).eq('id', selectedNote.id)
    if (error) console.error('Error updating note', error)
  }

  const handleTitleChange = (e) => updateNoteContent({ title: e.target.value || 'Untitled' })

  const handleCreateNote = useCallback(() => {
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    const optimisticNote = {
      id: tempId, user_id: user?.id, title: 'New Page', content: '',
      folder_id: selectedFolderId, is_favorite: false, created_at: now, updated_at: now,
    }
    setNotes(prev => [optimisticNote, ...prev])
    setSelectedNoteId(tempId)
    if (isMobile) setMobileView('editor')

    supabase.from('notes').insert([{
      user_id: user?.id, title: 'New Page', content: '', folder_id: selectedFolderId,
    }]).select().single().then(({ data, error }) => {
      if (error) { console.error('Error creating note', error); return }
      setNotes(prev => {
        const temp = prev.find(n => n.id === tempId)
        if (!temp) return prev
        if (temp.title !== 'New Page' || temp.content !== '') {
          supabase.from('notes').update({ title: temp.title, content: temp.content })
            .eq('id', data.id).then(({ error: e }) => { if (e) console.error('Sync error', e) })
        }
        return prev.map(n => n.id === tempId ? { ...n, id: data.id, created_at: data.created_at } : n)
      })
      setSelectedNoteId(prev => prev === tempId ? data.id : prev)
    })
  }, [user?.id, selectedFolderId, isMobile])

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
    if (!String(noteId).startsWith('temp-')) {
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      if (error) console.error('Error deleting note', error)
    }
  }

  const handleSidebarContext = (e, item) => {
    e.preventDefault()
    if (item.type === 'note' && selectedNoteIds.includes(item.note.id) && selectedNoteIds.length > 1) {
      setSidebarContext({ x: e.clientX, y: e.clientY, item: { type: 'multi-note', noteIds: [...selectedNoteIds] } })
    } else {
      if (item.type === 'note' && !selectedNoteIds.includes(item.note.id)) setSelectedNoteIds([])
      setSidebarContext({ x: e.clientX, y: e.clientY, item })
    }
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
    if (action === 'delete-multi' && target.type === 'multi-note') {
      const ids = target.noteIds
      if (!window.confirm(`Delete ${ids.length} notes?`)) { closeSidebarContext(); return }
      setNotes(prev => prev.filter(n => !ids.includes(n.id)))
      if (ids.includes(selectedNoteId)) setSelectedNoteId(null)
      setSelectedNoteIds([])
      const realIds = ids.filter(id => !String(id).startsWith('temp-'))
      if (realIds.length > 0) {
        const { error } = await supabase.from('notes').delete().in('id', realIds)
        if (error) console.error('Error deleting notes', error)
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

  const clearMenus = () => { closeSidebarContext(); setMenu(null); setColorSubmenu(null) }

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
      <div className="flex min-h-screen items-center justify-center" style={{ background: c.rootBg }}>
        <div className="text-sm" style={{ color: c.textMuted }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <Auth />

  // ── Render ────────────────────────────────────────────────────────
  return (
  <div className="flex overflow-hidden"
    style={{ background: c.rootBg, color: c.text, height: '100dvh' }}>
    <div className="relative flex w-full h-full" onClick={clearMenus}>
      {!isMobile && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20 h-px"
          style={{ top: HEADER_ROW_PX, background: c.border }}
          aria-hidden
        />
      )}

      {/* Sidebar column: full-width on mobile, animated width on desktop */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
        style={{
          width: isMobile ? '100%' : (sidebarOpen ? `${sidebarWidth}px` : 0),
          display: isMobile && mobileView !== 'sidebar' ? 'none' : undefined,
        }}
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
          onSelectNote={handleSelectNote}
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
          sidebarContext={sidebarContext}
          selectedNoteIds={selectedNoteIds}
          onToggleNoteSelection={handleToggleNoteSelection}
          isMobile={isMobile}
          onChangeSearch={setSearch}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      {!isMobile && sidebarOpen && (
        <div
          className="flex-shrink-0 w-1 cursor-col-resize flex items-center justify-center group"
          style={{ background: c.mainBg }}
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
        >
          <div
            className="w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: c.dragHandle }}
          />
        </div>
      )}

      <main
        className="flex flex-1 flex-col min-h-0 overflow-hidden min-w-0"
        style={{ background: c.mainBg, display: isMobile && mobileView !== 'editor' ? 'none' : undefined }}
      >
        <TopBar
          notes={notes}
          search={search}
          onChangeSearch={setSearch}
          onSelectNote={handleSelectNote}
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
          onMobileBack={handleMobileBack}
          selectedNote={selectedNote}
          onToggleFavorite={handleToggleFavorite}
          onDeleteNote={handleDeleteNote}
          theme={theme}
          onToggleTheme={toggleTheme}
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
          isMobile={isMobile}
          theme={theme}
        />
      </main>
    </div>

    {sidebarContext && (
        <div
          className="fixed z-40 min-w-[11rem] rounded-md py-1 px-0.5 text-[13px] shadow-xl"
          style={{ top: sidebarContext.y, left: sidebarContext.x, color: c.textBright, background: c.contextBg, border: `1px solid ${c.border}` }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
          aria-label="Note and folder actions"
        >
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>
            Actions
          </p>
          {sidebarMenuEntries.map((entry, i) => {
            const active = sidebarContextMenuIndex === i
            return (
              <button
                key={entry.action}
                type="button"
                role="menuitem"
                className={[
                  'flex w-full items-center rounded-md px-3 py-2 text-left transition-colors',
                  entry.showStar ? 'justify-between gap-2' : '',
                ].filter(Boolean).join(' ')}
                style={
                  active
                    ? { background: c.contextHover, color: c.textHeading }
                    : entry.danger
                      ? { color: c.danger }
                      : { color: c.textBright }
                }
                onMouseEnter={(e) => {
                  sidebarContextMenuIndexRef.current = i
                  setSidebarContextMenuIndex(i)
                  if (!active) e.currentTarget.style.background = c.contextHoverAlt
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
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
        className="format-menu-popover fixed z-50 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl py-1.5 shadow-2xl shadow-black/40"
        style={{
          top: formatMenuStylePos.top,
          left: formatMenuStylePos.left,
          background: c.contextBg,
          border: `1px solid ${c.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
        role="listbox"
        aria-label="Formatting"
      >
        <div className="px-3 pb-1.5 pt-0.5" style={{ borderBottom: `1px solid ${c.border}` }}>
          <p className="format-menu-header-title text-[11px] font-semibold uppercase tracking-[0.18em]">
            Formatting
          </p>
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
                  const hasColorSwatch = Boolean(item.colorSwatch)
                  const labelClass = [
                    'format-menu-label',
                    'min-w-0 flex-1 truncate',
                    selected && 'text-white',
                    !selected && item.command === 'highlight' && 'format-menu-label--highlight',
                    !selected && item.command === 'bold' && 'font-semibold',
                    !selected && item.command === 'italic' && 'italic',
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
                      ref={item.hasSubmenu ? colorSubmenuBtnRef : undefined}
                      key={`${group.id}-${item.command}-${ii}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => {
                        setSlashMenuIndex(flatIndex)
                        if (item.hasSubmenu) {
                          const rect = colorSubmenuBtnRef.current?.getBoundingClientRect()
                          if (rect) setColorSubmenu({ top: rect.top, left: rect.right + 4, bottom: rect.bottom })
                        } else {
                          setColorSubmenu(null)
                        }
                      }}
                      onClick={() => {
                        if (item.hasSubmenu) {
                          const rect = colorSubmenuBtnRef.current?.getBoundingClientRect()
                          if (rect) setColorSubmenu(prev => prev ? null : { top: rect.top, left: rect.right + 4, bottom: rect.bottom })
                        } else {
                          applyFormatMenuCommand(item.command)
                        }
                      }}
                      className={[
                        'format-menu-option',
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                        selected && 'format-menu-option--selected',
                        !selected && isDanger && 'format-menu-option--danger',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={!selected && !isDanger ? { color: c.text } : undefined}
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
                      {item.hasSubmenu && (
                        <ChevronRight size={14} strokeWidth={2} className="flex-shrink-0 ml-auto opacity-60" />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )}

    {menu && colorSubmenu && (
      <div
        className="fixed z-[60] rounded-xl py-2 px-2 shadow-2xl shadow-black/40"
        style={{
          top: Math.min(colorSubmenu.top, window.innerHeight - 260),
          left: Math.min(colorSubmenu.left, window.innerWidth - 180),
          background: c.contextBg,
          border: `1px solid ${c.border}`,
          minWidth: 160,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => setColorSubmenu(null)}
      >
        <p className="format-menu-section-title px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.textMuted }}>
          Pick a color
        </p>
        <div className="grid grid-cols-4 gap-1.5 px-1 pb-1.5">
          {TEXT_COLORS.map((tc) => (
            <button
              key={tc.color}
              type="button"
              title={tc.label}
              onClick={() => applyFormatMenuCommand(`color-${tc.color}`)}
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-transform hover:scale-110"
              style={{ background: `${tc.color}18`, border: `2px solid ${tc.color}` }}
            >
              <span className="rounded-full" style={{ width: 14, height: 14, background: tc.color }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => applyFormatMenuCommand('clearColor')}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors"
          style={{ color: c.danger }}
          onMouseEnter={(e) => e.currentTarget.style.background = c.contextHoverAlt}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Eraser size={14} strokeWidth={2} />
          Reset color
        </button>
      </div>
    )}
  </div>
)
}

export default App