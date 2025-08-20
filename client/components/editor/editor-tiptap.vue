<template lang="pug">
  .editor-tiptap-notion
    // Bubble Menu per selezione testo
    bubble-menu.bubble-menu(
      v-if="editor && !isMobile",
      :editor="editor",
      :tippy-options="{ duration: 100 }"
    )
      .bubble-menu-content
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('bold') }",
          @click="editor.chain().focus().toggleBold().run()"
        )
          v-icon(size="16") mdi-format-bold
        
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('italic') }",
          @click="editor.chain().focus().toggleItalic().run()"
        )
          v-icon(size="16") mdi-format-italic
        
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('underline') }",
          @click="editor.chain().focus().toggleUnderline().run()"
        )
          v-icon(size="16") mdi-format-underline
        
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('strike') }",
          @click="editor.chain().focus().toggleStrike().run()"
        )
          v-icon(size="16") mdi-format-strikethrough
        
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('code') }",
          @click="editor.chain().focus().toggleCode().run()"
        )
          v-icon(size="16") mdi-code-tags
        
        v-divider.mx-1(vertical)
        
        v-btn.bubble-btn(
          icon,
          x-small,
          :class="{ active: editor.isActive('link') }",
          @click="setLinkFromSelection"
        )
          v-icon(size="16") mdi-link
        
        v-btn.bubble-btn(
          icon,
          x-small,
          @click="aiImproveText"
        )
          v-icon(size="16", color="purple") mdi-robot

    // Floating Menu per linee vuote
    floating-menu.floating-menu(
      v-if="editor && !isMobile",
      :editor="editor",
      :tippy-options="{ duration: 100 }"
    )
      .floating-menu-content
        v-btn.floating-btn(
          icon,
          small,
          @click="toggleSlashMenu"
        )
          v-icon mdi-plus
        
        v-btn.floating-btn(
          icon,
          small,
          @click="aiContinueWriting"
        )
          v-icon(color="purple") mdi-robot

    // Area Editor principale
    .editor-content-wrapper
      editor-content.editor-content(ref="editor", :editor="editor")

    // Slash Menu
    v-menu.slash-menu(
      v-model="slashMenuOpen",
      :position-x="slashMenuPosition.x",
      :position-y="slashMenuPosition.y",
      :close-on-content-click="true",
      offset-y,
      max-width="320"
    )
      v-card
        v-card-text.pa-0
          v-list.py-0(dense)
            v-subheader.px-4.py-2 Formattazione Testo
            v-list-item(v-for='command in textCommands', :key='command.key', @click='executeCommand(command)')
              v-list-item-avatar
                v-icon(:color='command.color', size="20") {{ command.icon }}
              v-list-item-content
                v-list-item-title.body-2 {{ command.title }}
                v-list-item-subtitle.caption {{ command.description }}
              v-list-item-action(v-if="command.shortcut")
                v-chip.caption(x-small, outlined) {{ command.shortcut }}

            v-divider.my-1

            v-subheader.px-4.py-2 Contenuti Media
            v-list-item(v-for='command in mediaCommands', :key='command.key', @click='executeCommand(command)')
              v-list-item-avatar
                v-icon(:color='command.color', size="20") {{ command.icon }}
              v-list-item-content
                v-list-item-title.body-2 {{ command.title }}
                v-list-item-subtitle.caption {{ command.description }}

            v-divider.my-1

            v-subheader.px-4.py-2 AI & Automazione
            v-list-item(v-for='command in aiCommands', :key='command.key', @click='executeCommand(command)')
              v-list-item-avatar
                v-icon(:color='command.color', size="20") {{ command.icon }}
              v-list-item-content
                v-list-item-title.body-2 {{ command.title }}
                v-list-item-subtitle.caption {{ command.description }}
              v-list-item-action
                v-chip.caption(x-small, color='purple', text-color='white') AI

    // Dialog per inserimento link
    v-dialog(v-model="insertLinkDialog", max-width="500")
      v-card
        v-card-title
          v-icon.mr-2 mdi-link
          | Inserisci Link
        v-card-text
          v-text-field(
            label="URL del link",
            v-model="linkUrl",
            placeholder="https://esempio.com",
            outlined,
            dense,
            @keyup.enter="confirmInsertLink"
          )
          v-text-field(
            label="Testo del link (opzionale)",
            v-model="linkText",
            outlined,
            dense,
            @keyup.enter="confirmInsertLink"
          )
        v-card-actions
          v-spacer
          v-btn(text, @click="insertLinkDialog = false") Annulla
          v-btn(color="primary", @click="confirmInsertLink") Inserisci

    // Dialog per inserimento immagine  
    v-dialog(v-model="insertImageDialog", max-width="500")
      v-card
        v-card-title
          v-icon.mr-2 mdi-image
          | Inserisci Immagine
        v-card-text
          v-text-field(
            label="URL dell'immagine",
            v-model="imageUrl",
            placeholder="https://esempio.com/immagine.jpg",
            outlined,
            dense,
            @keyup.enter="confirmInsertImage"
          )
          v-text-field(
            label="Testo alternativo",
            v-model="imageAlt",
            outlined,
            dense,
            @keyup.enter="confirmInsertImage"
          )
        v-card-actions
          v-spacer
          v-btn(text, @click="insertImageDialog = false") Annulla
          v-btn(color="primary", @click="confirmInsertImage") Inserisci

    // Loading overlay per AI
    v-overlay(v-model="aiLoading", opacity="0.8")
      v-progress-circular(indeterminate, size="64", color="purple")
      .mt-4.text-center AI sta generando...

    // Status Bar
    v-system-bar.editor-status-bar(dark, status, color='grey darken-3', height="24")
      .caption.editor-locale {{locale.toUpperCase()}}
      .caption.px-3 /{{path}}
      template(v-if='$vuetify.breakpoint.mdAndUp')
        v-spacer
        .caption TipTap Notion-like Editor
        v-spacer
        .caption(v-if='showCharacterCount') 
          | {{stats.words}} parole • {{stats.characters}} caratteri
</template>

<script>
import _ from 'lodash'
import { get, sync } from 'vuex-pathify'
import { Editor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/vue-2'
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
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import YouTube from '@tiptap/extension-youtube'

export default {
  name: 'EditorTiptap',
  components: {
    EditorContent,
    BubbleMenu,
    FloatingMenu
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
        words: 0
      },
      insertLinkDialog: false,
      insertImageDialog: false,
      linkUrl: '',
      linkText: '',
      imageUrl: '',
      imageAlt: '',
      aiLoading: false,
      showCharacterCount: true,
      slashMenuOpen: false,
      slashMenuPosition: { x: 0, y: 0 },
      
      // Slash Commands
      textCommands: [
        {
          key: 'heading1',
          title: 'Titolo 1',
          description: 'Titolo principale grande',
          icon: 'mdi-format-header-1',
          color: 'blue',
          shortcut: '# Spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run()
        },
        {
          key: 'heading2',
          title: 'Titolo 2',
          description: 'Sottotitolo sezione',
          icon: 'mdi-format-header-2',
          color: 'blue',
          shortcut: '## Spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run()
        },
        {
          key: 'heading3',
          title: 'Titolo 3',
          description: 'Sottotitolo piccolo',
          icon: 'mdi-format-header-3',
          color: 'blue',
          shortcut: '### Spazio',
          action: () => this.editor.chain().focus().toggleHeading({ level: 3 }).run()
        },
        {
          key: 'paragraph',
          title: 'Paragrafo',
          description: 'Testo normale',
          icon: 'mdi-format-pilcrow',
          color: 'grey',
          action: () => this.editor.chain().focus().setParagraph().run()
        },
        {
          key: 'bullet-list',
          title: 'Lista Puntata',
          description: 'Lista con punti',
          icon: 'mdi-format-list-bulleted',
          color: 'orange',
          shortcut: '- Spazio',
          action: () => this.editor.chain().focus().toggleBulletList().run()
        },
        {
          key: 'ordered-list',
          title: 'Lista Numerata',
          description: 'Lista numerata',
          icon: 'mdi-format-list-numbered',
          color: 'orange',
          shortcut: '1. Spazio',
          action: () => this.editor.chain().focus().toggleOrderedList().run()
        },
        {
          key: 'task-list',
          title: 'Lista Task',
          description: 'Lista con checkbox',
          icon: 'mdi-format-list-checkbox',
          color: 'green',
          shortcut: '[] Spazio',
          action: () => this.editor.chain().focus().toggleTaskList().run()
        },
        {
          key: 'blockquote',
          title: 'Citazione',
          description: 'Blocco citazione',
          icon: 'mdi-format-quote-close',
          color: 'indigo',
          shortcut: '> Spazio',
          action: () => this.editor.chain().focus().toggleBlockquote().run()
        },
        {
          key: 'code-block',
          title: 'Blocco Codice',
          description: 'Codice con sintassi',
          icon: 'mdi-code-braces',
          color: 'red',
          shortcut: '``` Spazio',
          action: () => this.editor.chain().focus().toggleCodeBlock().run()
        }
      ],
      
      mediaCommands: [
        {
          key: 'image',
          title: 'Immagine',
          description: 'Inserisci immagine',
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
          action: () => this.insertTable()
        },
        {
          key: 'divider',
          title: 'Divisore',
          description: 'Linea orizzontale',
          icon: 'mdi-minus',
          color: 'grey',
          shortcut: '--- Invio',
          action: () => this.editor.chain().focus().setHorizontalRule().run()
        },
        {
          key: 'youtube',
          title: 'Video YouTube',
          description: 'Embed video YouTube',
          icon: 'mdi-youtube',
          color: 'red',
          action: () => this.insertYouTube()
        }
      ],
      
      aiCommands: [
        {
          key: 'ai-improve',
          title: 'Migliora Testo',
          description: 'AI migliora la scrittura',
          icon: 'mdi-robot',
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
        },
        {
          key: 'ai-translate',
          title: 'Traduci',
          description: 'AI traduce il testo',
          icon: 'mdi-translate',
          color: 'purple',
          action: () => this.aiTranslate()
        }
      ]
    }
  },
  
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown
    },
    locale: get('page/locale'),
    path: get('page/path')
  },
  
  watch: {
    '$store.state.editor.content'(newVal) {
      if (this.editor && newVal !== this.editor.getHTML()) {
        this.editor.commands.setContent(newVal, false)
      }
    }
  },
  
  methods: {
    initializeEditor() {
      this.editor = new Editor({
        element: this.$refs.editor,
        extensions: [
          StarterKit.configure({
            blockquote: {
              HTMLAttributes: {
                class: 'notion-blockquote',
              },
            },
            codeBlock: {
              HTMLAttributes: {
                class: 'notion-code-block',
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
            multicolor: true,
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
              return 'Premi "/" per i comandi oppure inizia a scrivere...'
            },
          }),
          Typography,
          TaskList.configure({
            HTMLAttributes: {
              class: 'notion-task-list',
            },
          }),
          TaskItem.configure({
            HTMLAttributes: {
              class: 'notion-task-item',
            },
          }),
          HorizontalRule.configure({
            HTMLAttributes: {
              class: 'notion-divider',
            },
          }),
          YouTube.configure({
            HTMLAttributes: {
              class: 'notion-youtube',
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
            if (event.key === '/' && this.shouldShowSlashMenu()) {
              setTimeout(() => this.showSlashMenu(), 100)
              return false
            }
            // Chiudi slash menu su Escape
            if (event.key === 'Escape' && this.slashMenuOpen) {
              this.slashMenuOpen = false
              return true
            }
            return false
          }
        },
        onUpdate: ({ editor }) => {
          this.updateContent(editor)
          this.updateStats(editor)
        },
        onSelectionUpdate: ({ editor }) => {
          this.updateStats(editor)
        },
        onCreate: ({ editor }) => {
          this.updateStats(editor)
        }
      })
    },
    
    updateContent(editor) {
      const html = editor.getHTML()
      if (this.$store.set) {
        this.$store.set('editor/content', html)
      } else if (this.$store.commit) {
        this.$store.commit('editor/SET_CONTENT', html)
      }
    },
    
    updateStats(editor) {
      if (this.showCharacterCount) {
        const characterCount = editor.storage.characterCount
        if (characterCount) {
          this.stats = {
            characters: characterCount.characters(),
            words: characterCount.words()
          }
        }
      }
    },
    
    // Slash Menu
    shouldShowSlashMenu() {
      const { selection } = this.editor.state
      const { from } = selection
      const text = this.editor.state.doc.textBetween(from - 1, from)
      return text === '/' || from === 0
    },
    
    showSlashMenu() {
      const { selection } = this.editor.state
      const { from } = selection
      
      const start = this.editor.view.coordsAtPos(from)
      this.slashMenuPosition = {
        x: start.left,
        y: start.bottom + 10
      }
      this.slashMenuOpen = true
    },
    
    toggleSlashMenu() {
      if (this.slashMenuOpen) {
        this.slashMenuOpen = false
      } else {
        this.showSlashMenu()
      }
    },
    
    executeCommand(command) {
      this.slashMenuOpen = false
      // Rimuovi il carattere "/" se presente
      const { selection } = this.editor.state
      const { from } = selection
      const text = this.editor.state.doc.textBetween(from - 1, from)
      if (text === '/') {
        this.editor.chain().focus().deleteRange({ from: from - 1, to: from }).run()
      }
      
      command.action()
    },
    
    // Media insertion
    insertImage() {
      this.imageUrl = ''
      this.imageAlt = ''
      this.insertImageDialog = true
    },
    
    confirmInsertImage() {
      if (this.imageUrl && this.editor) {
        this.editor.chain().focus().setImage({ 
          src: this.imageUrl,
          alt: this.imageAlt || '',
          title: this.imageAlt || ''
        }).run()
      }
      this.insertImageDialog = false
    },
    
    insertTable() {
      if (this.editor) {
        this.editor.chain().focus().insertTable({ 
          rows: 3, 
          cols: 3, 
          withHeaderRow: true 
        }).run()
      }
    },
    
    insertYouTube() {
      const url = prompt('Inserisci URL YouTube:')
      if (url && this.editor) {
        this.editor.chain().focus().setYouTubeVideo({ src: url }).run()
      }
    },
    
    // Link management
    setLinkFromSelection() {
      const { from, to } = this.editor.state.selection
      const text = this.editor.state.doc.textBetween(from, to)
      
      this.linkText = text
      this.linkUrl = this.editor.getAttributes('link').href || ''
      this.insertLinkDialog = true
    },
    
    confirmInsertLink() {
      if (this.linkUrl && this.editor) {
        if (this.linkText) {
          this.editor.chain().focus().insertContent(this.linkText).setLink({ href: this.linkUrl }).run()
        } else {
          this.editor.chain().focus().setLink({ href: this.linkUrl }).run()
        }
      }
      this.insertLinkDialog = false
      this.linkUrl = ''
      this.linkText = ''
    },
    
    // AI Functions
    async aiImproveText() {
      if (!this.editor) return
      
      const { from, to } = this.editor.state.selection
      const selectedText = this.editor.state.doc.textBetween(from, to)
      
      if (!selectedText) {
        this.$store.commit('showNotification', {
          style: 'warning',
          message: 'Seleziona del testo da migliorare con AI',
          icon: 'robot'
        })
        return
      }
      
      this.aiLoading = true
      
      try {
        // Qui chiamerai l'API AI - per ora simuliamo
        const improvedText = await this.callAI('improve', selectedText)
        this.editor.chain().focus().deleteRange({ from, to }).insertContent(improvedText).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'Testo migliorato con AI!',
          icon: 'robot'
        })
      } catch (error) {
        this.$store.commit('showNotification', {
          style: 'error',
          message: 'Errore AI: ' + error.message,
          icon: 'robot'
        })
      } finally {
        this.aiLoading = false
      }
    },
    
    async aiContinueWriting() {
      if (!this.editor) return
      
      this.aiLoading = true
      
      try {
        const { from } = this.editor.state.selection
        const currentText = this.editor.state.doc.textBetween(Math.max(0, from - 200), from)
        
        const continuation = await this.callAI('continue', currentText)
        this.editor.chain().focus().insertContent(' ' + continuation).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'AI ha continuato la scrittura!',
          icon: 'robot'
        })
      } catch (error) {
        this.$store.commit('showNotification', {
          style: 'error',
          message: 'Errore AI: ' + error.message,
          icon: 'robot'
        })
      } finally {
        this.aiLoading = false
      }
    },
    
    async aiSummarize() {
      if (!this.editor) return
      
      const content = this.editor.getText()
      if (!content || content.length < 100) {
        this.$store.commit('showNotification', {
          style: 'warning',
          message: 'Testo troppo corto per creare un riassunto',
          icon: 'robot'
        })
        return
      }
      
      this.aiLoading = true
      
      try {
        const summary = await this.callAI('summarize', content)
        this.editor.chain().focus().insertContent('\n\n**Riassunto AI:**\n' + summary).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'Riassunto AI creato!',
          icon: 'robot'
        })
      } catch (error) {
        this.$store.commit('showNotification', {
          style: 'error',
          message: 'Errore AI: ' + error.message,
          icon: 'robot'
        })
      } finally {
        this.aiLoading = false
      }
    },
    
    async aiTranslate() {
      const { from, to } = this.editor.state.selection
      const selectedText = this.editor.state.doc.textBetween(from, to)
      
      if (!selectedText) {
        this.$store.commit('showNotification', {
          style: 'warning',
          message: 'Seleziona del testo da tradurre',
          icon: 'robot'
        })
        return
      }
      
      const targetLang = prompt('Traduci in (inglese, francese, spagnolo, etc.):')
      if (!targetLang) return
      
      this.aiLoading = true
      
      try {
        const translation = await this.callAI('translate', selectedText, { targetLanguage: targetLang })
        this.editor.chain().focus().deleteRange({ from, to }).insertContent(translation).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: `Testo tradotto in ${targetLang}!`,
          icon: 'robot'
        })
      } catch (error) {
        this.$store.commit('showNotification', {
          style: 'error',
          message: 'Errore AI: ' + error.message,
          icon: 'robot'
        })
      } finally {
        this.aiLoading = false
      }
    },
    
    // AI API Call - integra con server/modules/editor/tiptap/ai-integration.js
    async callAI(action, text, context = {}) {
      try {
        const response = await fetch('/api/editor/tiptap/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.get('user/token')}`
          },
          body: JSON.stringify({
            action,
            text,
            context
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        return data.result
      } catch (error) {
        console.error('AI API Error:', error)
        throw error
      }
    }
  },
  
  async mounted() {
    if (this.$store.set) {
      this.$store.set('editor/editorKey', 'tiptap')
    }
    
    await this.$nextTick()
    this.initializeEditor()
    
    // Event listeners
    this.$root.$on('editorInsert', opts => {
      switch (opts.kind) {
        case 'IMAGE':
          this.editor.chain().focus().setImage({ src: opts.path, alt: opts.text || '' }).run()
          break
        case 'BINARY':
          this.editor.chain().focus().setLink({ href: opts.path }).insertContent(opts.text || opts.path).run()
          break
      }
    })
  },
  
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy()
    }
    this.$root.$off('editorInsert')
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
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #f5f5f5;
          @at-root .theme--dark & {
            background: #404040;
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
    z-index: 999;
    
    .floating-menu-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e0e0e0;
      display: flex;
      padding: 4px;
      gap: 4px;

      @at-root .theme--dark & {
        background: #2d2d2d;
        border-color: #404040;
      }

      .floating-btn {
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: #f5f5f5;
          @at-root .theme--dark & {
            background: #404040;
          }
        }
      }
    }
  }

  // Editor Content Wrapper
  .editor-content-wrapper {
    height: calc(100% - 24px);
    overflow-y: auto;
    position: relative;
  }

  // Main Editor Content
  .editor-content {
    height: 100%;
    
    .notion-editor-content {
      max-width: 100%;
      margin: 0 auto;
      padding: 40px 96px;
      min-height: calc(100vh - 200px);
      outline: none;

      @media (max-width: 1024px) {
        padding: 30px 60px;
      }

      @media (max-width: 768px) {
        padding: 20px 24px;
      }

      // Typography Notion-like
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.2;
        font-weight: 600;
        margin: 2em 0 0.5em 0;
        color: #111827;

        @at-root .theme--dark & {
          color: #f9fafb;
        }

        &:first-child {
          margin-top: 0;
        }
      }

      h1 {
        font-size: 2.5rem;
        letter-spacing: -0.02em;
      }

      h2 {
        font-size: 2rem;
        letter-spacing: -0.01em;
      }

      h3 {
        font-size: 1.5rem;
      }

      h4 {
        font-size: 1.25rem;
      }

      h5, h6 {
        font-size: 1rem;
      }

      p {
        margin: 1em 0;
        line-height: 1.6;
        color: #374151;
        font-size: 16px;

        @at-root .theme--dark & {
          color: #d1d5db;
        }

        &:first-child {
          margin-top: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }

        // Placeholder
        &.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;

          @at-root .theme--dark & {
            color: #6b7280;
          }
        }
      }

      // Lists Notion-style
      ul, ol {
        margin: 1em 0;
        padding-left: 1.5em;

        li {
          margin: 0.25em 0;
          line-height: 1.6;

          p {
            margin: 0;
          }

          // Nested lists
          ul, ol {
            margin: 0.25em 0;
          }
        }
      }

      ul {
        list-style-type: disc;

        ul {
          list-style-type: circle;
          
          ul {
            list-style-type: square;
          }
        }
      }

      // Task Lists Notion-style
      ul.notion-task-list {
        list-style: none;
        padding-left: 0;

        li.notion-task-item {
          display: flex;
          align-items: flex-start;
          margin: 0.5em 0;

          > label {
            margin-right: 0.5em;
            margin-top: 0.1em;
            user-select: none;
            cursor: pointer;

            input[type="checkbox"] {
              margin: 0;
              cursor: pointer;
            }
          }

          > div {
            flex: 1;
          }
        }
      }

      // Blockquotes Notion-style
      blockquote.notion-blockquote {
        margin: 1.5em 0;
        padding: 0 0 0 1em;
        border-left: 3px solid #e5e7eb;
        color: #6b7280;
        font-style: italic;
        position: relative;

        @at-root .theme--dark & {
          border-left-color: #4b5563;
          color: #9ca3af;
        }

        p {
          color: inherit;
        }
      }

      // Code Blocks Notion-style
      pre.notion-code-block {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1em;
        margin: 1.5em 0;
        overflow-x: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.4;

        @at-root .theme--dark & {
          background: #1f2937;
          border-color: #374151;
        }

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: inherit;
        }
      }

      // Inline Code
      code {
        background: #f1f5f9;
        color: #e11d48;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875em;

        @at-root .theme--dark & {
          background: #374151;
          color: #fca5a5;
        }
      }

      // Tables Notion-style
      table.notion-table {
        width: 100%;
        margin: 1.5em 0;
        border-collapse: collapse;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;

        @at-root .theme--dark & {
          border-color: #374151;
        }

        th, td {
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
          text-align: left;
          vertical-align: top;

          @at-root .theme--dark & {
            border-color: #374151;
          }
        }

        th {
          background: #f9fafb;
          font-weight: 600;
          color: #111827;

          @at-root .theme--dark & {
            background: #374151;
            color: #f9fafb;
          }
        }

        td {
          background: white;

          @at-root .theme--dark & {
            background: #1f2937;
          }
        }

        // Table selection
        .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          pointer-events: none;
        }
      }

      // Images Notion-style
      img.notion-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1em 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.02);
        }
      }

      // Links Notion-style
      a.notion-link {
        color: #3b82f6;
        text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;

        @at-root .theme--dark & {
          color: #60a5fa;
        }

        &:hover {
          border-bottom-color: currentColor;
        }
      }

      // Highlights Notion-style
      mark.notion-highlight {
        background: linear-gradient(180deg, transparent 60%, #fef08a 60%);
        padding: 0.1em 0;
        border-radius: 2px;

        @at-root .theme--dark & {
          background: linear-gradient(180deg, transparent 60%, #ca8a04 60%);
        }
      }

      // Horizontal Rule Notion-style
      hr.notion-divider {
        border: none;
        height: 1px;
        background: #e5e7eb;
        margin: 2em 0;

        @at-root .theme--dark & {
          background: #374151;
        }
      }

      // YouTube Embeds
      .notion-youtube {
        margin: 1.5em 0;
        
        iframe {
          width: 100%;
          max-width: 100%;
          border-radius: 8px;
        }
      }

      // Focus styles
      &:focus {
        outline: none;
      }

      // Selection
      ::selection {
        background: #dbeafe;
        @at-root .theme--dark & {
          background: #1e40af;
        }
      }
    }
  }

  // Slash Menu Styles
  .slash-menu {
    .v-menu__content {
      max-height: 400px;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border-radius: 12px;

      .v-card {
        border-radius: 12px;
      }

      .v-list {
        padding: 8px;

        .v-subheader {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          @at-root .theme--dark & {
            color: #9ca3af;
          }
        }

        .v-list-item {
          border-radius: 8px;
          margin: 2px 0;
          transition: background-color 0.2s;

          &:hover {
            background: #f3f4f6;
            @at-root .theme--dark & {
              background: #374151;
            }
          }

          .v-list-item-avatar {
            min-width: 36px;
            margin: 8px 12px 8px 0;

            .v-icon {
              font-size: 20px;
            }
          }

          .v-list-item-title {
            font-weight: 500;
            font-size: 14px;
          }

          .v-list-item-subtitle {
            font-size: 12px;
            color: #6b7280;
            
            @at-root .theme--dark & {
              color: #9ca3af;
            }
          }
        }
      }
    }
  }

  // Status Bar
  .editor-status-bar {
    .editor-locale {
      font-weight: 600;
    }

    .caption {
      font-size: 11px;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .editor-tiptap-notion {
    .bubble-menu,
    .floating-menu {
      display: none !important;
    }

    .editor-content .notion-editor-content {
      h1 { font-size: 2rem; }
      h2 { font-size: 1.75rem; }
      h3 { font-size: 1.5rem; }
    }
  }
}

// Dark theme adjustments
.theme--dark {
  .editor-tiptap-notion {
    .v-dialog > .v-card {
      background: #2d2d2d;
    }

    .v-menu__content {
      background: #2d2d2d;
    }

    .v-overlay__scrim {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

// Animation for AI loading
@keyframes ai-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ai-loading {
  animation: ai-pulse 1.5s ease-in-out infinite;
}
</style>