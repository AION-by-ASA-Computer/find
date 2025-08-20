<template lang="pug">
  .editor-tiptap-notion
    // Bubble Menu con design Notion-like
    bubble-menu.bubble-menu(
      v-if="editor",
      :editor="editor",
      :tippy-options="{ duration: 100, placement: 'top' }"
    )
      .bubble-menu-content
        .bubble-menu-group
          .bubble-menu-button(
            :class="{ active: editor.isActive('bold') }",
            @click="editor.chain().focus().toggleBold().run()"
          )
            v-icon(size="14") mdi-format-bold
          
          .bubble-menu-button(
            :class="{ active: editor.isActive('italic') }",
            @click="editor.chain().focus().toggleItalic().run()"
          )
            v-icon(size="14") mdi-format-italic
          
          .bubble-menu-button(
            :class="{ active: editor.isActive('underline') }",
            @click="editor.chain().focus().toggleUnderline().run()"
          )
            v-icon(size="14") mdi-format-underline
          
          .bubble-menu-button(
            :class="{ active: editor.isActive('strike') }",
            @click="editor.chain().focus().toggleStrike().run()"
          )
            v-icon(size="14") mdi-format-strikethrough
          
          .bubble-menu-button(
            :class="{ active: editor.isActive('code') }",
            @click="editor.chain().focus().toggleCode().run()"
          )
            v-icon(size="14") mdi-code-tags
        
        .bubble-menu-divider
        
        .bubble-menu-group
          .bubble-menu-button(
            :class="{ active: editor.isActive('link') }",
            @click="setLinkFromSelection"
          )
            v-icon(size="14") mdi-link
          
          .bubble-menu-button.ai-button(
            @click="aiImproveText"
          )
            v-icon(size="14") mdi-robot
            .ai-sparkle ✨

    // Floating Menu con design Notion-like
    floating-menu.floating-menu(
      v-if="editor",
      :editor="editor",
      :tippy-options="{ duration: 100, placement: 'left' }"
    )
      .floating-menu-content
        .floating-menu-handle
          .floating-menu-dots
            .dot
            .dot
            .dot
            .dot
            .dot
            .dot
        
        .floating-menu-actions
          .floating-action-button(@click="toggleSlashMenu")
            v-icon(size="18") mdi-plus
          
          .floating-action-button.ai-button(@click="aiContinueWriting")
            v-icon(size="18") mdi-robot

    // Area Editor principale con layout Notion
    .editor-container
      .editor-content-area
        // Titolo della pagina (opzionale)
        .page-header(v-if="showPageTitle")
          .page-title(
            contenteditable="true",
            placeholder="Untitled",
            @input="updatePageTitle"
          ) {{ pageTitle }}
        
        // Area editor principale
        .editor-wrapper
          editor-content.notion-editor(:editor="editor")

    // Slash Menu con design moderno
    .slash-menu-overlay(v-if="slashMenuOpen", @click="slashMenuOpen = false")
    .slash-menu(
      v-if="slashMenuOpen",
      :style="{ left: slashMenuPosition.x + 'px', top: slashMenuPosition.y + 'px' }"
    )
      .slash-menu-content
        .slash-menu-search
          v-icon(size="16", color="grey") mdi-magnify
          input.slash-search-input(
            placeholder="Search for blocks, commands...",
            v-model="slashSearchQuery",
            @input="filterSlashCommands"
          )
        
        .slash-menu-sections
          .slash-section(v-for="section in filteredSlashSections", :key="section.title")
            .slash-section-title {{ section.title }}
            .slash-command(
              v-for="command in section.commands",
              :key="command.key",
              @click="executeCommand(command)"
            )
              .command-icon
                v-icon(:color="command.color", size="18") {{ command.icon }}
              .command-content
                .command-title {{ command.title }}
                .command-description {{ command.description }}
              .command-shortcut(v-if="command.shortcut") {{ command.shortcut }}

    // Dialog per link con design Notion
    v-dialog(v-model="insertLinkDialog", max-width="480", content-class="notion-dialog")
      .link-dialog
        .dialog-header
          .dialog-title Add Link
          .dialog-close(@click="insertLinkDialog = false")
            v-icon mdi-close
        
        .dialog-content
          .input-group
            .input-label URL
            .input-field
              v-icon(size="16", color="grey") mdi-link
              input.link-input(
                placeholder="Paste or type a link...",
                v-model="linkUrl",
                @keyup.enter="confirmInsertLink"
              )
          
          .input-group(v-if="linkText")
            .input-label Text
            .input-field
              input.link-input(
                placeholder="Link text",
                v-model="linkText",
                @keyup.enter="confirmInsertLink"
              )
        
        .dialog-actions
          .dialog-button.secondary(@click="insertLinkDialog = false") Cancel
          .dialog-button.primary(@click="confirmInsertLink") Add Link

    // Dialog per immagini con design Notion
    v-dialog(v-model="insertImageDialog", max-width="480", content-class="notion-dialog")
      .image-dialog
        .dialog-header
          .dialog-title Add Image
          .dialog-close(@click="insertImageDialog = false")
            v-icon mdi-close
        
        .dialog-content
          .upload-area
            .upload-zone
              v-icon(size="32", color="grey") mdi-image-plus
              .upload-text Drop an image, or 
                span.upload-link click to browse
          
          .input-divider
            .divider-line
            .divider-text or
            .divider-line
          
          .input-group
            .input-label Image URL
            .input-field
              v-icon(size="16", color="grey") mdi-link
              input.image-input(
                placeholder="Paste the image link...",
                v-model="imageUrl",
                @keyup.enter="confirmInsertImage"
              )
          
          .input-group
            .input-label Alt text (optional)
            .input-field
              input.image-input(
                placeholder="Alternative text for accessibility",
                v-model="imageAlt",
                @keyup.enter="confirmInsertImage"
              )
        
        .dialog-actions
          .dialog-button.secondary(@click="insertImageDialog = false") Cancel
          .dialog-button.primary(@click="confirmInsertImage") Add Image

    // AI Loading overlay con design elegante
    .ai-overlay(v-if="aiLoading")
      .ai-loading-content
        .ai-spinner
          .spinner-ring
          .spinner-ring
          .spinner-ring
        .ai-loading-text
          .ai-text-line AI is thinking...
          .ai-text-subline This may take a few seconds

    // Status bar minimale stile Notion
    .editor-status-bar
      .status-left
        .status-item.locale {{locale.toUpperCase()}}
        .status-divider
        .status-item.path /{{path}}
      
      .status-center(v-if="$vuetify.breakpoint.lgAndUp")
        .status-item.editor-name TipTap • Notion-style
      
      .status-right(v-if="showCharacterCount")
        .status-item.stats {{ stats.words }} words · {{ stats.characters }} chars
        .status-item.ai-indicator(v-if="aiEnabled") 
          v-icon(size="12", color="purple") mdi-robot
          | AI Ready
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
      showPageTitle: false,
      pageTitle: 'Untitled',
      aiEnabled: true,
      
      // Slash Menu
      slashMenuOpen: false,
      slashMenuPosition: { x: 0, y: 0 },
      slashSearchQuery: '',
      
      // Comandi organizzati per sezioni
      slashSections: [
        {
          title: 'Basic blocks',
          commands: [
            {
              key: 'paragraph',
              title: 'Text',
              description: 'Start writing with plain text',
              icon: 'mdi-format-pilcrow',
              color: 'grey darken-1',
              action: () => this.editor.chain().focus().setParagraph().run()
            },
            {
              key: 'heading1',
              title: 'Heading 1',
              description: 'Big section heading',
              icon: 'mdi-format-header-1',
              color: 'blue',
              shortcut: '# ',
              action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run()
            },
            {
              key: 'heading2',
              title: 'Heading 2',
              description: 'Medium section heading',
              icon: 'mdi-format-header-2',
              color: 'blue',
              shortcut: '## ',
              action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run()
            },
            {
              key: 'heading3',
              title: 'Heading 3',
              description: 'Small section heading',
              icon: 'mdi-format-header-3',
              color: 'blue',
              shortcut: '### ',
              action: () => this.editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          ]
        },
        {
          title: 'Lists',
          commands: [
            {
              key: 'bullet-list',
              title: 'Bulleted list',
              description: 'Create a simple bulleted list',
              icon: 'mdi-format-list-bulleted',
              color: 'orange',
              shortcut: '- ',
              action: () => this.editor.chain().focus().toggleBulletList().run()
            },
            {
              key: 'ordered-list',
              title: 'Numbered list',
              description: 'Create a list with numbering',
              icon: 'mdi-format-list-numbered',
              color: 'orange',
              shortcut: '1. ',
              action: () => this.editor.chain().focus().toggleOrderedList().run()
            },
            {
              key: 'task-list',
              title: 'To-do list',
              description: 'Track tasks with a to-do list',
              icon: 'mdi-format-list-checkbox',
              color: 'green',
              shortcut: '[] ',
              action: () => this.editor.chain().focus().toggleTaskList().run()
            }
          ]
        },
        {
          title: 'Media',
          commands: [
            {
              key: 'image',
              title: 'Image',
              description: 'Upload or embed with link',
              icon: 'mdi-image',
              color: 'green',
              action: () => this.insertImage()
            },
            {
              key: 'table',
              title: 'Table',
              description: 'Add a simple table',
              icon: 'mdi-table',
              color: 'blue',
              action: () => this.insertTable()
            },
            {
              key: 'divider',
              title: 'Divider',
              description: 'Visually divide blocks',
              icon: 'mdi-minus',
              color: 'grey',
              shortcut: '--- ',
              action: () => this.editor.chain().focus().setHorizontalRule().run()
            }
          ]
        },
        {
          title: 'Advanced blocks',
          commands: [
            {
              key: 'blockquote',
              title: 'Quote',
              description: 'Capture a quote',
              icon: 'mdi-format-quote-close',
              color: 'indigo',
              shortcut: '> ',
              action: () => this.editor.chain().focus().toggleBlockquote().run()
            },
            {
              key: 'code-block',
              title: 'Code',
              description: 'Capture a code snippet',
              icon: 'mdi-code-braces',
              color: 'red darken-1',
              shortcut: '``` ',
              action: () => this.editor.chain().focus().toggleCodeBlock().run()
            }
          ]
        },
        {
          title: 'AI Actions',
          commands: [
            {
              key: 'ai-improve',
              title: 'Improve writing',
              description: 'Improve selected text with AI',
              icon: 'mdi-robot',
              color: 'purple',
              action: () => this.aiImproveText()
            },
            {
              key: 'ai-continue',
              title: 'Continue writing',
              description: 'Generate content from context',
              icon: 'mdi-pencil-plus',
              color: 'purple',
              action: () => this.aiContinueWriting()
            },
            {
              key: 'ai-summarize',
              title: 'Summarize',
              description: 'Create a summary of content',
              icon: 'mdi-format-list-text',
              color: 'purple',
              action: () => this.aiSummarize()
            }
          ]
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
    
    filteredSlashSections() {
      if (!this.slashSearchQuery) return this.slashSections
      
      const query = this.slashSearchQuery.toLowerCase()
      return this.slashSections.map(section => ({
        ...section,
        commands: section.commands.filter(cmd => 
          cmd.title.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query)
        )
      })).filter(section => section.commands.length > 0)
    }
  },
  
  watch: {
    '$store.state.editor.content'(newVal) {
      if (this.editor && newVal !== this.editor.getHTML()) {
        this.editor.commands.setContent(newVal, false)
      }
    }
  },
  
  methods: {
    updateContent() {
      if (this.editor) {
        const html = this.editor.getHTML()
        if (this.$store.set) {
          this.$store.set('editor/content', html)
        } else if (this.$store.commit) {
          this.$store.commit('editor/SET_CONTENT', html)
        }
      }
    },
    
    updateStats() {
      if (this.editor && this.showCharacterCount) {
        const characterCount = this.editor.storage.characterCount
        if (characterCount) {
          this.stats = {
            characters: characterCount.characters(),
            words: characterCount.words()
          }
        }
      }
    },
    
    updatePageTitle(event) {
      this.pageTitle = event.target.textContent
    },
    
    // Slash Menu
    shouldShowSlashMenu() {
      if (!this.editor) return false
      const { selection } = this.editor.state
      const { from } = selection
      const text = this.editor.state.doc.textBetween(from - 1, from)
      return text === '/'
    },
    
    showSlashMenu() {
      if (!this.editor) return
      const { selection } = this.editor.state
      const { from } = selection
      
      const start = this.editor.view.coordsAtPos(from)
      this.slashMenuPosition = {
        x: start.left,
        y: start.bottom + 8
      }
      this.slashMenuOpen = true
      this.slashSearchQuery = ''
      
      // Focus search input
      this.$nextTick(() => {
        const searchInput = document.querySelector('.slash-search-input')
        if (searchInput) searchInput.focus()
      })
    },
    
    toggleSlashMenu() {
      if (this.slashMenuOpen) {
        this.slashMenuOpen = false
      } else {
        this.showSlashMenu()
      }
    },
    
    filterSlashCommands() {
      // Il filtro viene gestito automaticamente dalla computed property
    },
    
    executeCommand(command) {
      this.slashMenuOpen = false
      // Rimuovi il carattere "/" se presente
      if (this.editor) {
        const { selection } = this.editor.state
        const { from } = selection
        const text = this.editor.state.doc.textBetween(from - 1, from)
        if (text === '/') {
          this.editor.chain().focus().deleteRange({ from: from - 1, to: from }).run()
        }
        
        command.action()
      }
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
    
    // Link management
    setLinkFromSelection() {
      if (!this.editor) return
      
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
          message: 'Select text to improve with AI',
          icon: 'robot'
        })
        return
      }
      
      this.aiLoading = true
      
      // Simulazione chiamata AI
      setTimeout(() => {
        this.aiLoading = false
        this.$store.commit('showNotification', {
          style: 'info',
          message: 'AI text improvement: Feature in development!',
          icon: 'robot'
        })
      }, 2000)
    },
    
    async aiContinueWriting() {
      this.aiLoading = true
      
      setTimeout(() => {
        this.aiLoading = false
        this.$store.commit('showNotification', {
          style: 'info',
          message: 'AI continue writing: Coming soon!',
          icon: 'robot'
        })
      }, 2000)
    },
    
    async aiSummarize() {
      this.aiLoading = true
      
      setTimeout(() => {
        this.aiLoading = false
        this.$store.commit('showNotification', {
          style: 'info',
          message: 'AI summarize: Feature in development!',
          icon: 'robot'
        })
      }, 2000)
    }
  },
  
  mounted() {
    if (this.$store.set) {
      this.$store.set('editor/editorKey', 'tiptap')
    }
    
    this.editor = new Editor({
      content: this.$store.get('editor/content') || '',
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
              return `Heading ${node.attrs.level}`
            }
            return 'Type \'/\' for commands, or just start writing...'
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
      ],
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
      onUpdate: () => {
        this.updateContent()
        this.updateStats()
      },
      onSelectionUpdate: () => {
        this.updateStats()
      },
      onCreate: () => {
        this.updateStats()
        console.log('TipTap Notion-like Editor initialized successfully')
      }
    })
    
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
// Variabili Notion-like
$notion-text: #37352f;
$notion-text-light: #787774;
$notion-bg: #ffffff;
$notion-bg-hover: #f7f6f3;
$notion-border: #e9e9e7;
$notion-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
$notion-radius: 6px;
$notion-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';

// Reset e base
.editor-tiptap-notion {
  position: relative;
  height: 100vh;
  background: $notion-bg;
  font-family: $notion-font;
  overflow: hidden;

  @at-root .theme--dark & {
    background: #1f1f1f;
    --notion-text: #e6e6e6;
    --notion-text-light: #9b9b9b;
    --notion-bg: #1f1f1f;
    --notion-bg-hover: #2a2a2a;
    --notion-border: #333333;
  }

  // Bubble Menu stile Notion
  .bubble-menu {
    z-index: 1000;
    
    .bubble-menu-content {
      background: white;
      border: 1px solid $notion-border;
      border-radius: $notion-radius;
      box-shadow: $notion-shadow, 0 8px 24px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      padding: 2px;
      gap: 1px;

      @at-root .theme--dark & {
        background: #2d2d2d;
        border-color: #404040;
      }

      .bubble-menu-group {
        display: flex;
        align-items: center;
        gap: 1px;
      }

      .bubble-menu-divider {
        width: 1px;
        height: 20px;
        background: $notion-border;
        margin: 0 4px;

        @at-root .theme--dark & {
          background: #404040;
        }
      }

      .bubble-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: $notion-text-light;
        position: relative;

        &:hover {
          background: $notion-bg-hover;
          color: $notion-text;

          @at-root .theme--dark & {
            background: var(--notion-bg-hover);
            color: var(--notion-text);
          }
        }

        &.active {
          background: #2383e2;
          color: white;
        }

        &.ai-button {
          .ai-sparkle {
            position: absolute;
            top: -2px;
            right: -2px;
            font-size: 8px;
            line-height: 1;
          }

          &:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
        }
      }
    }
  }

  // Floating Menu stile Notion
  .floating-menu {
    z-index: 999;
    
    .floating-menu-content {
      display: flex;
      align-items: center;
      gap: 4px;

      .floating-menu-handle {
        opacity: 0;
        transition: opacity 0.15s ease;
        cursor: grab;

        &:hover {
          opacity: 1;
        }

        .floating-menu-dots {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 1px;
          width: 8px;
          height: 12px;

          .dot {
            width: 2px;
            height: 2px;
            background: #d1d5db;
            border-radius: 50%;

            @at-root .theme--dark & {
              background: #6b7280;
            }
          }
        }
      }

      .floating-menu-actions {
        display: flex;
        gap: 2px;
      }

      .floating-action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: white;
        border: 1px solid $notion-border;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: $notion-shadow;

        @at-root .theme--dark & {
          background: #2d2d2d;
          border-color: #404040;
        }

        &:hover {
          background: $notion-bg-hover;
          transform: scale(1.05);

          @at-root .theme--dark & {
            background: var(--notion-bg-hover);
          }
        }

        &.ai-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;

          &:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
          }
        }
      }
    }
  }

  // Container principale
  .editor-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .editor-content-area {
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  // Header della pagina (opzionale)
  .page-header {
    padding: 96px 96px 0;

    @media (max-width: 1024px) {
      padding: 60px 60px 0;
    }

    @media (max-width: 768px) {
      padding: 40px 24px 0;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      color: $notion-text;
      border: none;
      outline: none;
      margin-bottom: 2rem;
      min-height: 1em;

      @at-root .theme--dark & {
        color: var(--notion-text);
      }

      &:empty::before {
        content: attr(placeholder);
        color: $notion-text-light;
        @at-root .theme--dark & {
          color: var(--notion-text-light);
        }
      }

      &:focus {
        outline: none;
      }
    }
  }

  // Wrapper editor
  .editor-wrapper {
    position: relative;
  }

  // Contenuto editor principale
  .notion-editor {
    .notion-editor-content {
      max-width: 100%;
      margin: 0 auto;
      padding: 96px 96px 200px;
      min-height: calc(100vh - 96px);
      outline: none;
      font-size: 16px;
      line-height: 1.5;
      color: $notion-text;

      @at-root .theme--dark & {
        color: var(--notion-text);
      }

      @media (max-width: 1024px) {
        padding: 60px 60px 200px;
      }

      @media (max-width: 768px) {
        padding: 40px 24px 200px;
      }

      // Tipografia stile Notion
      h1, h2, h3, h4, h5, h6 {
        font-family: $notion-font;
        font-weight: 600;
        line-height: 1.2;
        margin: 2em 0 0.5em 0;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }

        &:first-child {
          margin-top: 0;
        }
      }

      h1 {
        font-size: 1.875rem;
        font-weight: 600;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
      }

      h4, h5, h6 {
        font-size: 1rem;
        font-weight: 600;
      }

      p {
        margin: 1px 0;
        line-height: 1.5;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }

        &.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: $notion-text-light;
          pointer-events: none;
          height: 0;

          @at-root .theme--dark & {
            color: var(--notion-text-light);
          }
        }
      }

      // Liste stile Notion
      ul, ol {
        margin: 1px 0;
        padding-left: 1.5em;

        li {
          margin: 1px 0;
          line-height: 1.5;

          p {
            margin: 0;
          }
        }
      }

      // Task Lists
      ul.notion-task-list {
        list-style: none;
        padding-left: 0;

        li.notion-task-item {
          display: flex;
          align-items: flex-start;
          margin: 1px 0;

          > label {
            display: flex;
            align-items: center;
            margin-right: 8px;
            margin-top: 1px;
            user-select: none;
            cursor: pointer;

            input[type="checkbox"] {
              width: 16px;
              height: 16px;
              margin: 0;
              cursor: pointer;
              border-radius: 3px;
            }
          }

          > div {
            flex: 1;
          }
        }
      }

      // Blockquotes
      blockquote.notion-blockquote {
        margin: 4px 0;
        padding: 3px 14px;
        border-left: 3px solid currentColor;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }
      }

      // Code blocks
      pre.notion-code-block {
        background: #f7f6f3;
        border: 1px solid $notion-border;
        border-radius: $notion-radius;
        padding: 16px;
        margin: 4px 0;
        overflow-x: auto;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        font-size: 14px;
        line-height: 1.4;

        @at-root .theme--dark & {
          background: #2d2d2d;
          border-color: #404040;
        }

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: inherit;
        }
      }

      // Inline code
      code {
        background: rgba(135, 131, 120, 0.15);
        color: #eb5757;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        font-size: 85%;

        @at-root .theme--dark & {
          background: rgba(255, 255, 255, 0.1);
          color: #ff6b6b;
        }
      }

      // Tabelle stile Notion
      table.notion-table {
        width: 100%;
        margin: 8px 0;
        border-collapse: collapse;
        border: 1px solid $notion-border;
        border-radius: $notion-radius;
        overflow: hidden;

        @at-root .theme--dark & {
          border-color: #404040;
        }

        th, td {
          border: 1px solid $notion-border;
          padding: 8px 9px;
          text-align: left;
          vertical-align: top;
          min-width: 100px;

          @at-root .theme--dark & {
            border-color: #404040;
          }
        }

        th {
          background: #f7f6f3;
          font-weight: 500;

          @at-root .theme--dark & {
            background: #2d2d2d;
          }
        }

        td {
          background: white;

          @at-root .theme--dark & {
            background: #1f1f1f;
          }
        }
      }

      // Immagini
      img.notion-image {
        max-width: 100%;
        height: auto;
        border-radius: $notion-radius;
        margin: 4px 0;
      }

      // Link
      a.notion-link {
        color: #2383e2;
        text-decoration: underline;
        text-decoration-color: rgba(35, 131, 226, 0.4);
        text-underline-offset: 2px;

        &:hover {
          text-decoration-color: currentColor;
        }

        @at-root .theme--dark & {
          color: #58a6ff;
        }
      }

      // Highlight
      mark.notion-highlight {
        background: linear-gradient(180deg, transparent 50%, #ffeb3b 50%);
        padding: 0.1em 0;

        @at-root .theme--dark & {
          background: linear-gradient(180deg, transparent 50%, #ffa726 50%);
        }
      }

      // Separatori
      hr.notion-divider {
        border: none;
        height: 1px;
        background: $notion-border;
        margin: 16px 0;

        @at-root .theme--dark & {
          background: #404040;
        }
      }

      // Focus
      &:focus {
        outline: none;
      }
    }
  }

  // Slash Menu con design Notion
  .slash-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 998;
  }

  .slash-menu {
    position: fixed;
    z-index: 999;
    width: 320px;
    max-height: 400px;
    background: white;
    border: 1px solid $notion-border;
    border-radius: $notion-radius;
    box-shadow: $notion-shadow, 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;

    @at-root .theme--dark & {
      background: #2d2d2d;
      border-color: #404040;
    }

    .slash-menu-content {
      display: flex;
      flex-direction: column;
      max-height: 400px;
    }

    .slash-menu-search {
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid $notion-border;
      gap: 8px;

      @at-root .theme--dark & {
        border-bottom-color: #404040;
      }

      .slash-search-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        background: transparent;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }

        &::placeholder {
          color: $notion-text-light;

          @at-root .theme--dark & {
            color: var(--notion-text-light);
          }
        }
      }
    }

    .slash-menu-sections {
      overflow-y: auto;
      max-height: 300px;
    }

    .slash-section {
      .slash-section-title {
        padding: 8px 12px 4px;
        font-size: 11px;
        font-weight: 500;
        color: $notion-text-light;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        @at-root .theme--dark & {
          color: var(--notion-text-light);
        }
      }
    }

    .slash-command {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      gap: 10px;

      &:hover {
        background: $notion-bg-hover;

        @at-root .theme--dark & {
          background: var(--notion-bg-hover);
        }
      }

      .command-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
      }

      .command-content {
        flex: 1;
        min-width: 0;

        .command-title {
          font-size: 14px;
          font-weight: 400;
          color: $notion-text;
          line-height: 1.3;

          @at-root .theme--dark & {
            color: var(--notion-text);
          }
        }

        .command-description {
          font-size: 12px;
          color: $notion-text-light;
          line-height: 1.2;

          @at-root .theme--dark & {
            color: var(--notion-text-light);
          }
        }
      }

      .command-shortcut {
        font-size: 11px;
        color: $notion-text-light;
        background: rgba(135, 131, 120, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, monospace;

        @at-root .theme--dark & {
          color: var(--notion-text-light);
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  // Dialog stile Notion
  .notion-dialog {
    .v-dialog {
      box-shadow: none !important;
    }
  }

  .link-dialog,
  .image-dialog {
    background: white;
    border-radius: $notion-radius;
    box-shadow: $notion-shadow, 0 16px 32px rgba(0, 0, 0, 0.15);
    overflow: hidden;

    @at-root .theme--dark & {
      background: #2d2d2d;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid $notion-border;

      @at-root .theme--dark & {
        border-bottom-color: #404040;
      }

      .dialog-title {
        font-size: 16px;
        font-weight: 600;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }
      }

      .dialog-close {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: $notion-text-light;

        &:hover {
          background: $notion-bg-hover;
          color: $notion-text;

          @at-root .theme--dark & {
            background: var(--notion-bg-hover);
            color: var(--notion-text);
          }
        }
      }
    }

    .dialog-content {
      padding: 20px;
    }

    .input-group {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .input-label {
        font-size: 14px;
        font-weight: 500;
        color: $notion-text;
        margin-bottom: 6px;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }
      }

      .input-field {
        display: flex;
        align-items: center;
        background: $notion-bg;
        border: 1px solid $notion-border;
        border-radius: $notion-radius;
        padding: 8px 12px;
        gap: 8px;

        @at-root .theme--dark & {
          background: #1f1f1f;
          border-color: #404040;
        }

        &:focus-within {
          border-color: #2383e2;
          box-shadow: 0 0 0 1px #2383e2;
        }

        .link-input,
        .image-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          color: $notion-text;

          @at-root .theme--dark & {
            color: var(--notion-text);
          }

          &::placeholder {
            color: $notion-text-light;

            @at-root .theme--dark & {
              color: var(--notion-text-light);
            }
          }
        }
      }
    }

    .upload-area {
      margin-bottom: 16px;

      .upload-zone {
        border: 2px dashed $notion-border;
        border-radius: $notion-radius;
        padding: 32px;
        text-align: center;
        cursor: pointer;
        transition: all 0.15s ease;

        @at-root .theme--dark & {
          border-color: #404040;
        }

        &:hover {
          border-color: #2383e2;
          background: rgba(35, 131, 226, 0.05);
        }

        .upload-text {
          font-size: 14px;
          color: $notion-text-light;
          margin-top: 8px;

          @at-root .theme--dark & {
            color: var(--notion-text-light);
          }

          .upload-link {
            color: #2383e2;
            cursor: pointer;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .input-divider {
      display: flex;
      align-items: center;
      margin: 16px 0;
      gap: 12px;

      .divider-line {
        flex: 1;
        height: 1px;
        background: $notion-border;

        @at-root .theme--dark & {
          background: #404040;
        }
      }

      .divider-text {
        font-size: 12px;
        color: $notion-text-light;

        @at-root .theme--dark & {
          color: var(--notion-text-light);
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid $notion-border;

      @at-root .theme--dark & {
        border-top-color: #404040;
      }

      .dialog-button {
        padding: 8px 16px;
        border-radius: $notion-radius;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
        outline: none;

        &.secondary {
          background: transparent;
          color: $notion-text-light;

          &:hover {
            background: $notion-bg-hover;
            color: $notion-text;

            @at-root .theme--dark & {
              background: var(--notion-bg-hover);
              color: var(--notion-text);
            }
          }
        }

        &.primary {
          background: #2383e2;
          color: white;

          &:hover {
            background: #1a73d1;
          }
        }
      }
    }
  }

  // AI Loading overlay
  .ai-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(2px);

    .ai-loading-content {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: $notion-shadow, 0 20px 40px rgba(0, 0, 0, 0.2);
      text-align: center;
      max-width: 280px;

      @at-root .theme--dark & {
        background: #2d2d2d;
      }

      .ai-spinner {
        position: relative;
        width: 40px;
        height: 40px;
        margin: 0 auto 16px;

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-top-color: #2383e2;
          border-radius: 50%;
          animation: spin 1s linear infinite;

          &:nth-child(2) {
            animation-delay: -0.33s;
            border-top-color: #9333ea;
          }

          &:nth-child(3) {
            animation-delay: -0.66s;
            border-top-color: #06b6d4;
          }
        }
      }

      .ai-loading-text {
        .ai-text-line {
          font-size: 16px;
          font-weight: 500;
          color: $notion-text;
          margin-bottom: 4px;

          @at-root .theme--dark & {
            color: var(--notion-text);
          }
        }

        .ai-text-subline {
          font-size: 14px;
          color: $notion-text-light;

          @at-root .theme--dark & {
            color: var(--notion-text-light);
          }
        }
      }
    }
  }

  // Status bar minimale
  .editor-status-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: white;
    border-top: 1px solid $notion-border;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-size: 12px;
    color: $notion-text-light;
    z-index: 100;

    @at-root .theme--dark & {
      background: #1f1f1f;
      border-top-color: #404040;
      color: var(--notion-text-light);
    }

    .status-left,
    .status-center,
    .status-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-divider {
      width: 1px;
      height: 12px;
      background: $notion-border;

      @at-root .theme--dark & {
        background: #404040;
      }
    }

    .status-item {
      &.locale {
        font-weight: 500;
      }

      &.editor-name {
        font-weight: 500;
        color: $notion-text;

        @at-root .theme--dark & {
          color: var(--notion-text);
        }
      }

      &.ai-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #9333ea;
      }
    }
  }
}

// Animazioni
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 768px) {
  .editor-tiptap-notion {
    .bubble-menu,
    .floating-menu {
      display: none !important;
    }

    .slash-menu {
      width: calc(100vw - 32px);
      left: 16px !important;
      right: 16px;
    }

    .editor-status-bar {
      .status-center {
        display: none;
      }
    }
  }
}

// Scrollbar personalizzata
.editor-tiptap-notion ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.editor-tiptap-notion ::-webkit-scrollbar-track {
  background: transparent;
}

.editor-tiptap-notion ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

@at-root .theme--dark {
  .editor-tiptap-notion ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}
</style>