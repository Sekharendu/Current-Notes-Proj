import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Mathematics from '@tiptap/extension-mathematics'
import { CodeBlockWithToolbar } from './CodeBlockWithToolbar'
import { Star, Trash2 } from 'lucide-react'
import 'katex/dist/katex.min.css'

export function EditorPane({
  loading,
  selectedNote,
  onCreateNote,
  onTitleChange,
  onEditorChange,
  onSlashKey,
  onContextMenu,
  onFormatMenuKeyDown,
  isFormatMenuOpen,
  onToggleFavorite,   // ✅ new prop
  onDeleteNote,
  setEditorInstance,
}) {
  const isFormatMenuOpenRef = useRef(isFormatMenuOpen)
  const onFormatMenuKeyDownRef = useRef(onFormatMenuKeyDown)
  const onSlashKeyRef = useRef(onSlashKey)
  const onContextMenuRef = useRef(onContextMenu)

  useEffect(() => { isFormatMenuOpenRef.current = isFormatMenuOpen }, [isFormatMenuOpen])
  useEffect(() => { onFormatMenuKeyDownRef.current = onFormatMenuKeyDown }, [onFormatMenuKeyDown])
  useEffect(() => { onSlashKeyRef.current = onSlashKey }, [onSlashKey])
  useEffect(() => { onContextMenuRef.current = onContextMenu }, [onContextMenu])

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
          codeBlock: false,
        }),
        CodeBlockWithToolbar,
        Highlight,
        Mathematics,
      ],
      content: selectedNote?.content || '',
      onCreate: ({ editor }) => setEditorInstance(editor),
      editorProps: {
        handleDOMEvents: {
          contextmenu: (view, event) => {
            // ✅ Use event target to check if right-click is inside a code block DOM element
            const target = event.target
            const isInCodeBlock = target.closest('pre') !== null || 
                                  target.closest('code') !== null ||
                                  view.state.selection.$from.parent.type.name === 'codeBlock'
            
            if (isInCodeBlock) {
              event.preventDefault()
              return true
            }

            onContextMenuRef.current(event)
            return false
          },

          keydown: (view, event) => {
            const { $from } = view.state.selection
            // ✅ Walk up the node tree to check if anywhere in a code block
            let isInCodeBlock = false
            let depth = $from.depth
            while (depth >= 0) {
              if ($from.node(depth).type.name === 'codeBlock') {
                isInCodeBlock = true
                break
              }
              depth--
            }

            // ✅ Tab inside code block
            if (event.key === 'Tab') {
              if (isInCodeBlock) {
                event.preventDefault()
                view.dispatch(view.state.tr.insertText('    ').scrollIntoView())
                return true
              }
              return false
            }

            // ✅ Slash inside code block — just let it type, skip menu entirely
            if (event.key === '/') {
              if (isInCodeBlock) return false
              // not in code block — open slash menu
              setTimeout(() => {
                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0)
                  const rect = range.getBoundingClientRect()
                  onSlashKeyRef.current({ x: rect.left, y: rect.bottom })
                }
              }, 0)
              return false
            }

            // Format menu keyboard nav (only when not in code block)
            if (!isInCodeBlock && isFormatMenuOpenRef.current) {
              const handled = onFormatMenuKeyDownRef.current(event)
              if (handled) return true
              if (event.key === 'Backspace') {
                onFormatMenuKeyDownRef.current({ key: 'Escape', preventDefault: () => {} })
              }
              if (event.key.length === 1 && event.key !== '/') {
                onFormatMenuKeyDownRef.current({ key: 'Escape', preventDefault: () => {} })
              }
            }

            return false
          },
        },
        attributes: {
          class: 'tiptap scroll-thin min-h-[200px] w-full flex-1 overflow-y-auto border-0 bg-transparent focus:outline-none p-1',
        },
      },
      onUpdate: ({ editor }) => onEditorChange(editor.getHTML()),
      immediatelyRender: false,
    },
    [selectedNote?.id],
  )

  useEffect(() => {
    if (editor && selectedNote?.content !== undefined) {
      const current = editor.getHTML()
      if (current !== selectedNote.content) {
        editor.commands.setContent(selectedNote.content || '')
      }
    }
  }, [selectedNote?.id])

  if (loading) {
    return (
      <section className="flex-1 min-h-0 flex items-center justify-center">
        <p className="text-sm" style={{ color: '#555555' }}>Loading notes…</p>
      </section>
    )
  }

  if (!selectedNote) {
    return (
      <section className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
        <p className="text-sm" style={{ color: '#555555' }}>No notes yet.</p>
        <button
          type="button"
          onClick={onCreateNote}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
          style={{ background: '#3730a3' }}
        >
          Create your first note
        </button>
      </section>
    )
  }

return (
    <section className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{
          background: '#1a1a1a',
          padding: 'clamp(10px, 2.4vw, 38px)',
        }}
      >
        {/* Header row — title + icons (~40% tighter spacing vs prior) */}
        <div className="flex items-start justify-between mb-0.5 gap-4">
          <input
            type="text"
            value={selectedNote.title || ''}
            onChange={onTitleChange}
            className="flex-1 bg-transparent min-w-0 font-bold tracking-tight focus:outline-none"
            style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            placeholder="Untitled"
          />

          {/* ✅ Action icons */}
          <div className="flex items-center gap-1 pt-0.5 flex-shrink-0">
            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => onToggleFavorite(selectedNote)}
              className="flex items-center justify-center h-8 w-8 rounded-md transition-colors"
              style={{ color: selectedNote.is_favorite ? '#eab308' : '#444444' }}
              onMouseEnter={(e) => {
                if (!selectedNote.is_favorite) e.currentTarget.style.color = '#888888'
                e.currentTarget.style.background = '#1a1a1a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = selectedNote.is_favorite ? '#eab308' : '#444444'
                e.currentTarget.style.background = 'transparent'
              }}
              title={selectedNote.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Star
                size={18}
                fill={selectedNote.is_favorite ? '#eab308' : 'none'}
                strokeWidth={1.75}
              />
            </button>

            {/* Delete note */}
            <button
              type="button"
              onClick={() => onDeleteNote(selectedNote.id)}
              className="flex items-center justify-center h-8 w-8 rounded-md transition-colors"
              style={{ color: '#444444' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f87171'
                e.currentTarget.style.background = '#1a1a1a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#444444'
                e.currentTarget.style.background = 'transparent'
              }}
              title="Delete note"
            >
              <Trash2 size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Last edited */}
        <p className="mb-3.5 text-xs" style={{ color: '#3a3a3a' }}>
          Last edited{' '}
          {selectedNote.updated_at
            ? new Date(selectedNote.updated_at).toLocaleString()
            : 'just now'}
        </p>

        {/* Editor */}
        <EditorContent editor={editor} className="flex-1 overflow-y-auto scroll-thin" />
      </div>
    </section>
  )
}