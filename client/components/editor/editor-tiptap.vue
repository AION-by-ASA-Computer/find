<template lang='pug'>
  .editor-tiptap-notion
    // Bubble Menu per formattazione inline
    bubble-menu.bubble-menu(
      v-if='editor'
      :editor='editor'
      :tippy-options="{ duration: 100 }"
    )
      .bubble-menu-content
        button.bubble-btn(@click='toggleBold', :class='{ active: editor.isActive("bold") }')
          v-icon(size='16') mdi-format-bold
        button.bubble-btn(@click='toggleItalic', :class='{ active: editor.isActive("italic") }')
          v-icon(size='16') mdi-format-italic
        button.bubble-btn(@click='toggleUnderline', :class='{ active: editor.isActive("underline") }')
          v-icon(size='16') mdi-format-underline
        button.bubble-btn(@click='toggleStrike', :class='{ active: editor.isActive("strike") }')
          v-icon(size='16') mdi-format-strikethrough
        button.bubble-btn(@click='toggleCode', :class='{ active: editor.isActive("code") }')
          v-icon(size='16') mdi-code-tags
        button.bubble-btn(@click='setLink')
          v-icon(size='16') mdi-link

    // Floating Menu per aggiungere blocchi
    floating-menu.floating-menu(
      v-if='editor'
      :editor='editor'
      :tippy-options="{ duration: 100 }"
    )
      button.plus-btn(@click='showSlashCommands')
        v-icon mdi-plus

    // Main Editor Content
    .editor-content-wrapper
      editor-content.editor-content(:editor='editor')

    // Slash Commands Modal
    v-dialog(v-model='slashMenuOpen', max-width='400', :style='slashMenuStyle')
      v-card.slash-menu-card
        v-list(dense)
          v-subheader Blocchi di Testo
          v-list-item(v-for='command in textCommands', :key='command.key', @click='executeCommand(command)')
            v-list-item-avatar
              v-icon(:color='command.color') {{ command.icon }}
            v-list-item-content
              v-list-item-title {{ command.title }}
              v-list-item-subtitle {{ command.description }}
            v-list-item-action
              v-chip(x-small, outlined) {{ command.shortcut }}

          v-divider.my-2

          v-subheader Contenuti Media
          v-list-item(v-for='command in mediaCommands', :key='command.key', @click='executeCommand(command)')
            v-list-item-avatar
              v-icon(:color='command.color') {{ command.icon }}
            v-list-item-content
              v-list-item-title {{ command.title }}
              v-list-item-subtitle {{ command.description }}

          v-divider.my-2

          v-subheader AI & Automazione
          v-list-item(v-for='command in aiCommands', :key='command.key', @click='executeCommand(command)')
            v-list-item-avatar
              v-icon(:color='command.color') {{ command.icon }}
            v-list-item-content
              v-list-item-title {{ command.title }}
              v-list-item-subtitle {{ command.description }}
            v-list-item-action
              v-chip(x-small, color='purple', text-color='white') AI

    // Status Bar
    v-system-bar.editor-status-bar(dark, status, color='grey darken-3')
      .caption.editor-locale {{locale.toUpperCase()}}
      .caption.px-3 /{{path}}
      template(v-if='$vuetify.breakpoint.mdAndUp')
        v-spacer
        .caption TipTap Notion-like Editor
        v-spacer
        .caption {{stats.words}} parole, {{stats.characters}} caratteri
        .caption.ml-3(v-if='editor') Blocchi: {{stats.blocks}}

    // Link Dialog
    page-selector(mode='select', v-model='insertLinkDialog', :open-handler='insertLinkHandler', :path='path', :locale='locale')
</template>

<script>
import _ from 'lodash'
import { get, sync } from 'vuex-pathify'
import { Editor } from '@tiptap/core'
import { BubbleMenu, FloatingMenu } from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'

/* global siteLangs */

export default {
  components: {
    BubbleMenu,
    FloatingMenu,
    EditorContent: () => import('@tiptap/vue-2').then(m => m.EditorContent)
  },
  props: {
    save: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      editor: null,
      stats: {
        characters: 0,
        words: 0,
        blocks: 0
      },
      insertLinkDialog: false,
      slashMenuOpen: false,
      slashMenuPosition: { x: 0, y: 0 },
      textCommands: [
        {
          key: 'heading1',
          title: 'Titolo 1',
          description: 'Titolo principale',
          icon: 'mdi-format-header-1',
          color: 'blue',
          shortcut: '# + spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run()
        },
        {
          key: 'heading2',
          title: 'Titolo 2',
          description: 'Sottotitolo',
          icon: 'mdi-format-header-2',
          color: 'blue',
          shortcut: '## + spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run()
        },
        {
          key: 'heading3',
          title: 'Titolo 3',
          description: 'Sezione',
          icon: 'mdi-format-header-3',
          color: 'blue',
          shortcut: '### + spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 3 }).run()
        },
        {
          key: 'paragraph',
          title: 'Testo',
          description: 'Paragrafo normale',
          icon: 'mdi-format-paragraph',
          color: 'grey',
          shortcut: '',
          action: () => this.editor.chain().focus().setParagraph().run()
        },
        {
          key: 'bulletList',
          title: 'Lista Puntata',
          description: 'Lista con punti',
          icon: 'mdi-format-list-bulleted',
          color: 'orange',
          shortcut: '- + spazio',
          action: () => this.editor.chain().focus().toggleBulletList().run()
        },
        {
          key: 'orderedList',
          title: 'Lista Numerata',
          description: 'Lista con numeri',
          icon: 'mdi-format-list-numbered',
          color: 'orange',
          shortcut: '1. + spazio',
          action: () => this.editor.chain().focus().toggleOrderedList().run()
        },
        {
          key: 'blockquote',
          title: 'Citazione',
          description: 'Blocco citazione',
          icon: 'mdi-format-quote-close',
          color: 'indigo',
          shortcut: '> + spazio',
          action: () => this.editor.chain().focus().toggleBlockquote().run()
        },
        {
          key: 'codeBlock',
          title: 'Codice',
          description: 'Blocco di codice',
          icon: 'mdi-code-braces',
          color: 'purple',
          shortcut: '``` + spazio',
          action: () => this.editor.chain().focus().toggleCodeBlock().run()
        }
      ],
      mediaCommands: [
        {
          key: 'image',
          title: 'Immagine',
          description: 'Carica o inserisci immagine',
          icon: 'mdi-image',
          color: 'green',
          action: () => this.insertImage()
        },
        {
          key: 'table',
          title: 'Tabella',
          description: 'Inserisci tabella',
          icon: 'mdi-table',
          color: 'blue',
          action: () => this.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        },
        {
          key: 'divider',
          title: 'Separatore',
          description: 'Linea di separazione',
          icon: 'mdi-minus',
          color: 'grey',
          action: () => this.editor.chain().focus().setHorizontalRule().run()
        }
      ],
      aiCommands: [
        {
          key: 'ai-improve',
          title: 'Migliora Testo',
          description: 'AI migliora il testo selezionato',
          icon: 'mdi-auto-fix',
          color: 'purple',
          action: () => this.aiImproveText()
        },
        {
          key: 'ai-continue',
          title: 'Continua Scrittura',
          description: 'AI continua dal cursore',
          icon: 'mdi-pencil-plus',
          color: 'purple',
          action: () => this.aiContinueWriting()
        },
        {
          key: 'ai-summarize',
          title: 'Riassumi',
          description: 'AI crea riassunto',
          icon: 'mdi-format-list-text',
          color: 'purple',
          action: () => this.aiSummarize()
        }
      ]
    }
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown
    },
    locale: get('page/locale'),
    path: get('page/path'),
    activeModal: sync('editor/activeModal'),
    slashMenuStyle() {
      return {
        position: 'fixed',
        left: `${this.slashMenuPosition.x}px`,
        top: `${this.slashMenuPosition.y}px`,
        zIndex: 9999
      }
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.configure({
            // Disabilita alcuni shortcuts default per usare i nostri
            blockquote: {
              HTMLAttributes: {
                class: 'notion-blockquote',
              },
            },
          }),
          Underline,
          Image.configure({
            HTMLAttributes: {
              class: 'notion-image',
            },
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              class: 'notion-link',
            },
          }),
          Table.configure({
            resizable: true,
            HTMLAttributes: {
              class: 'notion-table',
            },
          }),
          TableRow,
          TableHeader,
          TableCell,
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
          Highlight.configure({
            HTMLAttributes: {
              class: 'notion-highlight',
            },
          }),
          CharacterCount,
          Placeholder.configure({
            placeholder: ({ node }) => {
              if (node.type.name === 'heading') {
                return `Titolo ${node.attrs.level}`
              }
              return 'Digita "/" per i comandi o inizia a scrivere...'
            },
          }),
        ],
        content: this.$store.get('editor/content') || '',
        editorProps: {
          attributes: {
            class: 'notion-editor-content',
          },
          handleKeyDown: (view, event) => {
            // Gestisci slash commands
            if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
              setTimeout(() => this.showSlashCommandsAtCursor(), 10)
            }
            return false
          },
        },
        onUpdate: ({ editor }) => {
          const html = editor.getHTML()
          this.$store.set('editor/content', html)
          this.updateStats()
        },
        onSelectionUpdate: ({ editor }) => {
          // Aggiorna stato per bubble menu
          this.$forceUpdate()
        },
        onCreate: ({ editor }) => {
          this.updateStats()
        },
      })
    },

    updateStats() {
      if (!this.editor) return
      
      const characterCount = this.editor.storage.characterCount
      this.stats = {
        characters: characterCount.characters(),
        words: characterCount.words(),
        blocks: this.countBlocks()
      }
    },

    countBlocks() {
      if (!this.editor) return 0
      
      let blockCount = 0
      this.editor.state.doc.descendants((node) => {
        if (node.isBlock) {
          blockCount++
        }
      })
      return blockCount
    },

    // Bubble Menu Actions
    toggleBold() {
      this.editor.chain().focus().toggleBold().run()
    },

    toggleItalic() {
      this.editor.chain().focus().toggleItalic().run()
    },

    toggleUnderline() {
      this.editor.chain().focus().toggleUnderline().run()
    },

    toggleStrike() {
      this.editor.chain().focus().toggleStrike().run()
    },

    toggleCode() {
      this.editor.chain().focus().toggleCode().run()
    },

    setLink() {
      const url = window.prompt('URL del link')
      if (url) {
        this.editor.chain().focus().setLink({ href: url }).run()
      }
    },

    // Slash Commands
    showSlashCommands() {
      this.slashMenuOpen = true
    },

    showSlashCommandsAtCursor() {
      const selection = this.editor.state.selection
      const coords = this.editor.view.coordsAtPos(selection.from)
      
      this.slashMenuPosition = {
        x: coords.left,
        y: coords.bottom + 10
      }
      this.slashMenuOpen = true
    },

    executeCommand(command) {
      this.slashMenuOpen = false
      
      // Rimuovi il carattere "/" se presente
      const { from, to } = this.editor.state.selection
      const textBefore = this.editor.state.doc.textBetween(Math.max(0, from - 1), from)
      
      if (textBefore === '/') {
        this.editor.chain().deleteRange({ from: from - 1, to: from }).run()
      }
      
      // Esegui il comando
      command.action()
    },

    // Media Actions
    insertImage() {
      this.$root.$emit('editorModal', {
        modal: 'editorModalMedia',
        mode: 'image'
      })
    },

    insertLinkHandler({ locale, path }) {
      const url = siteLangs.length > 0 ? `/${locale}/${path}` : `/${path}`
      this.editor.chain().focus().setLink({ href: url }).run()
    },

    // AI Actions (placeholder per integrazione futura)
    aiImproveText() {
      this.$store.commit('showNotification', {
        style: 'info',
        message: 'Funzionalità AI in arrivo! Integrazione con GPT/Claude prevista.',
        icon: 'robot'
      })
    },

    aiContinueWriting() {
      this.$store.commit('showNotification', {
        style: 'info',
        message: 'AI continua scrittura - funzionalità in sviluppo.',
        icon: 'robot'
      })
    },

    aiSummarize() {
      this.$store.commit('showNotification', {
        style: 'info',
        message: 'AI riassunto automatico - in arrivo presto!',
        icon: 'robot'
      })
    }
  },

  async mounted() {
    this.$store.set('editor/editorKey', 'tiptap')
    
    // Inizializza editor dopo DOM ready
    this.$nextTick(() => {
      this.initializeEditor()
    })

    // Gestisci eventi da altri componenti
    this.$root.$on('editorInsert', opts => {
      switch (opts.kind) {
        case 'IMAGE':
          this.editor.chain().focus().setImage({ src: opts.path, alt: opts.text || '' }).run()
          break
        case 'BINARY':
          this.editor.chain().focus().setLink({ href: opts.path }).insertContent(opts.text || opts.path).run()
          break
        case 'DIAGRAM':
          this.editor.chain().focus().setImage({ src: `data:image/svg+xml;base64,${opts.text}` }).run()
          break
      }
    })

    this.$root.$on('editorLinkToPage', opts => {
      this.insertLinkDialog = true
    })

    this.$root.$on('saveConflict', () => {
      // Handle conflicts
    })

    this.$root.$on('overwriteEditorContent', () => {
      this.editor.commands.setContent(this.$store.get('editor/content'))
      this.updateStats()
    })
  },

  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
    
    this.$root.$off('editorInsert')
    this.$root.$off('editorLinkToPage')
    this.$root.$off('saveConflict')
    this.$root.$off('overwriteEditorContent')
  }
}
</script>

<style lang="scss">
.editor-tiptap-notion {
  position: relative;
  height: calc(100vh - 64px - 24px);
  background: #fafafa;

  @at-root .theme--dark & {
    background: #1e1e1e;
  }

  // Bubble Menu Styles
  .bubble-menu {
    z-index: 1000;
    
    .bubble-menu-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
      display: flex;
      padding: 4px;
      gap: 2px;

      @at-root .theme--dark & {
        background: #2d2d2d;
        border-color: #404040;
      }

      .bubble-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #666;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #f5f5f5;
          color: #333;

          @at-root .theme--dark & {
            background: #404040;
            color: #fff;
          }
        }

        &.active {
          background: #e3f2fd;
          color: #1976d2;

          @at-root .theme--dark & {
            background: #1976d2;
            color: white;
          }
        }
      }
    }
  }

  // Floating Menu Styles
  .floating-menu {
    z-index: 1000;

    .plus-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid #e0e0e0;
      background: white;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      opacity: 0.5;

      &:hover {
        opacity: 1;
        background: #f5f5f5;
        transform: scale(1.1);
      }

      @at-root .theme--dark & {
        background: #2d2d2d;
        border-color: #404040;
        color: #ccc;
      }
    }
  }

  // Editor Content Wrapper
  .editor-content-wrapper {
    height: calc(100% - 24px);
    overflow-y: auto;
    padding: 40px;

    .editor-content {
      max-width: 800px;
      margin: 0 auto;
    }
  }

  // Notion-style Editor Content
  .notion-editor-content {
    outline: none;
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

    // Headings
    h1, h2, h3, h4, h5, h6 {
      margin: 2em 0 0.5em 0;
      font-weight: 600;
      line-height: 1.2;
      
      &:first-child {
        margin-top: 0;
      }
    }

    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.8em;
    }
    
    h2 { 
      font-size: 2em;
      margin-bottom: 0.6em;
    }
    
    h3 { 
      font-size: 1.5em; 
      margin-bottom: 0.5em;
    }

    // Paragraphs
    p {
      margin: 1em 0;
      
      &.is-editor-empty:first-child::before {
        color: #aaa;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
    }

    // Lists
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;

      li {
        margin: 0.25em 0;
        
        p {
          margin: 0;
        }
      }
    }

    // Blockquotes
    .notion-blockquote {
      border-left: 4px solid #e0e0e0;
      padding-left: 1.5em;
      margin: 2em 0;
      font-style: italic;
      color: #666;

      @at-root .theme--dark & {
        border-left-color: #404040;
        color: #ccc;
      }
    }

    // Code
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9em;

      @at-root .theme--dark & {
        background: #2d2d2d;
      }
    }

    pre {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5em;
      margin: 2em 0;
      overflow-x: auto;

      @at-root .theme--dark & {
        background: #1e1e1e;
        border-color: #404040;
      }

      code {
        background: none;
        padding: 0;
        color: inherit;
      }
    }

    // Images
    .notion-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 2em 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    // Links
    .notion-link {
      color: #1976d2;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s;

      &:hover {
        border-bottom-color: #1976d2;
      }

      @at-root .theme--dark & {
        color: #64b5f6;
      }
    }

    // Highlights
    .notion-highlight {
      background: linear-gradient(104deg, rgba(130, 255, 173, 0) 0.9%, rgba(130, 255, 173, 1.25) 2.4%, rgba(130, 255, 173, 0.5) 5.8%, rgba(130, 255, 173, 0.1) 93%, rgba(130, 255, 173, 0.7) 96%, rgba(130, 255, 173, 0) 98%), linear-gradient(183deg, rgba(130, 255, 173, 0) 0%, rgba(130, 255, 173, 0.3) 7.9%, rgba(130, 255, 173, 0) 15%);
      padding: 2px 0;
    }

    // Tables
    .notion-table {
      border-collapse: collapse;
      width: 100%;
      margin: 2em 0;
      
      th, td {
        border: 1px solid #e0e0e0;
        padding: 12px 16px;
        text-align: left;

        @at-root .theme--dark & {
          border-color: #404040;
        }
      }

      th {
        background: #f8f9fa;
        font-weight: 600;

        @at-root .theme--dark & {
          background: #2d2d2d;
        }
      }
    }

    // Horizontal Rule
    hr {
      border: none;
      height: 1px;
      background: #e0e0e0;
      margin: 3em 0;

      @at-root .theme--dark & {
        background: #404040;
      }
    }
  }

  // Slash Menu Styles
  .slash-menu-card {
    max-height: 400px;
    overflow-y: auto;
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);

    .v-list-item {
      min-height: 48px;
      border-radius: 8px;
      margin: 2px 8px;

      &:hover {
        background: rgba(25, 118, 210, 0.04);
      }
    }

    .v-subheader {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      padding-left: 16px;
    }
  }

  // Status Bar
  .editor-status-bar {
    .editor-locale {
      background-color: rgba(255,255,255,.25);
      display: inline-flex;
      padding: 0 12px;
      height: 24px;
      min-width: 63px;
      justify-content: center;
      align-items: center;
      border-radius: 12px;
    }
  }
}

// Mobile Styles
@media (max-width: 768px) {
  .editor-tiptap-notion {
    .editor-content-wrapper {
      padding: 20px 16px;
    }

    .bubble-menu-content {
      .bubble-btn {
        width: 36px;
        height: 36px;
      }
    }
  }
}
</style>