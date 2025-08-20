<template lang='pug'>
  .editor-tiptap-notion
    // Toolbar superiore stile Word/Markdown
    .editor-toolbar
      .toolbar-section
        .toolbar-group
          v-btn(icon, small, @click='toggleBold', :color='editor && editor.isActive("bold") ? "primary" : ""')
            v-icon mdi-format-bold
          v-btn(icon, small, @click='toggleItalic', :color='editor && editor.isActive("italic") ? "primary" : ""')
            v-icon mdi-format-italic
          v-btn(icon, small, @click='toggleUnderline', :color='editor && editor.isActive("underline") ? "primary" : ""')
            v-icon mdi-format-underline
          v-btn(icon, small, @click='toggleStrike', :color='editor && editor.isActive("strike") ? "primary" : ""')
            v-icon mdi-format-strikethrough
        
        v-divider(vertical)
        
        .toolbar-group
          v-btn(icon, small, @click='setHeading(1)', :color='editor && editor.isActive("heading", { level: 1 }) ? "primary" : ""')
            v-icon mdi-format-header-1
          v-btn(icon, small, @click='setHeading(2)', :color='editor && editor.isActive("heading", { level: 2 }) ? "primary" : ""')
            v-icon mdi-format-header-2
          v-btn(icon, small, @click='setHeading(3)', :color='editor && editor.isActive("heading", { level: 3 }) ? "primary" : ""')
            v-icon mdi-format-header-3
        
        v-divider(vertical)
        
        .toolbar-group
          v-btn(icon, small, @click='toggleBulletList', :color='editor && editor.isActive("bulletList") ? "primary" : ""')
            v-icon mdi-format-list-bulleted
          v-btn(icon, small, @click='toggleOrderedList', :color='editor && editor.isActive("orderedList") ? "primary" : ""')
            v-icon mdi-format-list-numbered
          v-btn(icon, small, @click='toggleTaskList', :color='editor && editor.isActive("taskList") ? "primary" : ""')
            v-icon mdi-format-list-checkbox
        
        v-divider(vertical)
        
        .toolbar-group
          v-btn(icon, small, @click='toggleBlockquote', :color='editor && editor.isActive("blockquote") ? "primary" : ""')
            v-icon mdi-format-quote-close
          v-btn(icon, small, @click='toggleCodeBlock', :color='editor && editor.isActive("codeBlock") ? "primary" : ""')
            v-icon mdi-code-braces
          v-btn(icon, small, @click='insertHorizontalRule')
            v-icon mdi-minus
        
        v-divider(vertical)
        
        .toolbar-group.ai-group
          v-btn(icon, small, @click='aiImproveText', color='purple', :disabled='!hasSelection')
            v-icon mdi-auto-fix
          v-btn(icon, small, @click='aiContinueWriting', color='purple')
            v-icon mdi-pencil-plus
          v-btn(icon, small, @click='aiSummarize', color='purple', :disabled='!hasSelection')
            v-icon mdi-format-list-text

    // Bubble Menu per formattazione inline (con AI)
    .bubble-menu(
      v-if='editor && showBubbleMenu'
      :style='bubbleMenuStyle'
    )
      .bubble-menu-content
        button.bubble-btn(@click='toggleBold', :class='{ active: editor.isActive("bold") }')
          v-icon(size='16') mdi-format-bold
        button.bubble-btn(@click='toggleItalic', :class='{ active: editor.isActive("italic") }')
          v-icon(size='16') mdi-format-italic
        button.bubble-btn(@click='toggleUnderline', :class='{ active: editor.isActive("underline") }')
          v-icon(size='16') mdi-format-underline
        button.bubble-btn(@click='toggleCode', :class='{ active: editor.isActive("code") }')
          v-icon(size='16') mdi-code-tags
        
        .bubble-divider
        
        button.bubble-btn(@click='setLink')
          v-icon(size='16') mdi-link
        
        .bubble-divider
        
        button.bubble-btn.ai-btn(@click='aiImproveText', title='Improve with AI')
          v-icon(size='16') mdi-auto-fix
        button.bubble-btn.ai-btn(@click='aiSummarize', title='Summarize with AI')
          v-icon(size='16') mdi-format-list-text
        button.bubble-btn.ai-btn(@click='aiTranslate', title='Translate with AI')
          v-icon(size='16') mdi-translate

    // Main Editor Content
    .editor-content-wrapper
      .editor-content-container
        // Block handles on hover con drag & drop
        .block-handles(v-if='!isMobile')
          .block-handle(
            v-for='(block, index) in visibleBlocks'
            :key='`block-${index}`'
            :style='{ top: block.top + "px" }'
            @mouseenter='activeBlock = index'
            @mouseleave='activeBlock = -1'
          )
            .block-drag-handle(
              draggable='true'
              @dragstart='startDrag(index, $event)'
              @dragover.prevent
              @drop='handleDrop(index, $event)'
            )
              .drag-dots
                .dot
                .dot
                .dot
                .dot
                .dot
                .dot
            .block-actions(v-show='activeBlock === index')
              button.block-action-btn(@click='showSlashAtBlock(index)')
                v-icon(size='16') mdi-plus
        
        // Drop zones per drag & drop
        .drop-zone(
          v-for='(zone, index) in dropZones'
          :key='`drop-${index}`'
          :style='{ top: zone.top + "px" }'
          :class='{ active: dragTarget === index }'
          @dragover.prevent='dragTarget = index'
          @dragleave='dragTarget = -1'
          @drop='handleDrop(index, $event)'
        )
        
        // Floating plus button per blocchi vuoti
        .floating-plus(
          v-if='showFloatingPlus && !isMobile'
          :style='floatingPlusStyle'
          @click='showSlashCommands'
        )
          v-icon(size='18') mdi-plus

        // Editor content
        .editor-content(ref='editorElement')

    // Slash Commands Modal
    v-dialog(v-model='slashMenuOpen', max-width='400', :style='slashMenuDialogStyle')
      v-card.slash-menu-card
        v-card-title.slash-menu-header
          span Add blocks
          v-btn(icon, small, @click='slashMenuOpen = false')
            v-icon mdi-close
        
        v-card-text.slash-menu-content
          v-text-field(
            v-model='slashSearchQuery'
            placeholder='Search for blocks...'
            prepend-inner-icon='mdi-magnify'
            dense
            outlined
            hide-details
            @keydown.down.prevent='highlightNext'
            @keydown.up.prevent='highlightPrevious'
            @keydown.enter.prevent='executeHighlighted'
            @keydown.esc='slashMenuOpen = false'
            ref='slashSearch'
          )
          
          v-list(dense, class='mt-3')
            template(v-for='section in filteredSlashSections')
              v-subheader(v-if='section.commands.length > 0') {{ section.title }}
              v-list-item(
                v-for='(command, cmdIndex) in section.commands'
                :key='command.key'
                :class='{ highlighted: highlightedIndex === getGlobalIndex(section, cmdIndex) }'
                @click='executeCommand(command)'
                @mouseenter='highlightedIndex = getGlobalIndex(section, cmdIndex)'
              )
                v-list-item-avatar
                  v-icon(:color='command.color') {{ command.icon }}
                v-list-item-content
                  v-list-item-title {{ command.title }}
                  v-list-item-subtitle {{ command.description }}
                v-list-item-action(v-if='command.shortcut')
                  v-chip(x-small, outlined) {{ command.shortcut }}

    // AI Loading
    v-overlay(:value='aiLoading', z-index='2000')
      .ai-loading
        v-progress-circular(indeterminate, color='purple', size='64')
        .mt-4.text-center
          .subtitle-1 AI is thinking...
          .caption Please wait a moment

    // Status Bar
    v-system-bar.editor-status-bar(dark, status, color='grey darken-3')
      .caption.editor-locale {{locale.toUpperCase()}}
      .caption.px-3 /{{path}}
      template(v-if='$vuetify.breakpoint.mdAndUp')
        v-spacer
        .caption TipTap • Notion-style Editor
        v-spacer
        .caption {{stats.words}} words, {{stats.characters}} chars
        .caption.ml-3(v-if='editor') Blocks: {{stats.blocks}}

    // Link Dialog
    page-selector(mode='select', v-model='insertLinkDialog', :open-handler='insertLinkHandler', :path='path', :locale='locale')
</template>

<script>
import _ from 'lodash'
import { get, sync } from 'vuex-pathify'
import { Editor, EditorContent } from '@tiptap/vue-2'
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
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'

/* global siteLangs */

export default {
  components: {
    EditorContent
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
      slashSearchQuery: '',
      highlightedIndex: 0,
      aiLoading: false,
      
      // Selection and menu states
      showBubbleMenu: false,
      showFloatingPlus: false,
      bubbleMenuStyle: {},
      floatingPlusStyle: {},
      
      // Block handles
      visibleBlocks: [],
      activeBlock: -1,
      draggedBlock: null,
      dropZones: [],
      dragTarget: -1,
      
      // Selection state
      hasSelection: false,
      
      // Commands data
      slashSections: [
        {
          title: 'AI',
          commands: [
            {
              key: 'ai-improve',
              title: 'Improve Text',
              description: 'AI migliora il testo selezionato',
              icon: 'mdi-auto-fix',
              color: 'purple',
              action: () => this.aiImproveText()
            },
            {
              key: 'ai-continue',
              title: 'Continue Writing',
              description: 'AI continua dal cursore',
              icon: 'mdi-pencil-plus',
              color: 'purple',
              action: () => this.aiContinueWriting()
            },
            {
              key: 'ai-summarize',
              title: 'Summarize',
              description: 'AI crea riassunto',
              icon: 'mdi-format-list-text',
              color: 'purple',
              action: () => this.aiSummarize()
            }
          ]
        },
        {
          title: 'Blocchi di Testo',
          commands: [
            {
              key: 'paragraph',
              title: 'Testo',
              description: 'Paragrafo normale',
              icon: 'mdi-format-paragraph',
              color: 'grey',
              action: () => this.editor.chain().focus().setParagraph().run()
            },
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
              key: 'taskList',
              title: 'Lista Todo',
              description: 'Lista con checkbox',
              icon: 'mdi-format-list-checkbox',
              color: 'green',
              shortcut: '[] + spazio',
              action: () => this.editor.chain().focus().toggleTaskList().run()
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
          ]
        },
        {
          title: 'Contenuti Media',
          commands: [
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
              shortcut: '--- + spazio',
              action: () => this.editor.chain().focus().setHorizontalRule().run()
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
    activeModal: sync('editor/activeModal'),
    
    slashMenuDialogStyle() {
      return {
        position: 'fixed',
        left: `${this.slashMenuPosition.x}px`,
        top: `${this.slashMenuPosition.y}px`,
        zIndex: 9999
      }
    },
    
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
    },
    
    allCommands() {
      return this.filteredSlashSections.reduce((all, section) => all.concat(section.commands), [])
    }
  },
  
  methods: {
    initializeEditor() {
      this.editor = new Editor({
        element: this.$refs.editorElement,
        extensions: [
          StarterKit.configure({
            horizontalRule: false, // Disabilita dal StarterKit per usare la nostra configurazione
            blockquote: {
              HTMLAttributes: { class: 'notion-blockquote' }
            },
            codeBlock: {
              HTMLAttributes: { class: 'notion-code-block' }
            }
          }),
          Underline,
          Image.configure({
            HTMLAttributes: { class: 'notion-image' }
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: { class: 'notion-link' }
          }),
          Table.configure({
            resizable: true,
            HTMLAttributes: { class: 'notion-table' }
          }),
          TableRow,
          TableHeader,
          TableCell,
          TextAlign.configure({
            types: ['heading', 'paragraph']
          }),
          Highlight.configure({
            HTMLAttributes: { class: 'notion-highlight' }
          }),
          CharacterCount,
          Placeholder.configure({
            placeholder: ({ node }) => {
              if (node.type.name === 'heading') {
                return `Titolo ${node.attrs.level}`
              }
              return 'Digita "/" per i comandi o inizia a scrivere...'
            }
          }),
          TaskList.configure({
            HTMLAttributes: { class: 'notion-task-list' }
          }),
          TaskItem.configure({
            HTMLAttributes: { class: 'notion-task-item' },
            nested: true
          }),
          HorizontalRule.configure({
            HTMLAttributes: { class: 'notion-divider' }
          })
        ],
        content: this.$store.get('editor/content') || '',
        editorProps: {
          attributes: {
            class: 'notion-editor-content'
          },
          handleKeyDown: (view, event) => {
            // Slash command
            if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
              setTimeout(() => this.checkSlashCommand(), 10)
            }
            // Navigation in slash menu
            if (this.slashMenuOpen) {
              if (event.key === 'Escape') {
                this.slashMenuOpen = false
                return true
              }
            }
            return false
          }
        },
        onUpdate: _.debounce(({ editor }) => {
          const html = editor.getHTML()
          this.$store.set('editor/content', html)
          this.updateStats()
          this.updateBlockHandles()
          // Save only on significant changes, not every keystroke
          if (this.shouldSave(html)) {
            this.save()
          }
        }, 2000), // 2 second debounce
        onSelectionUpdate: ({ editor }) => {
          this.updateMenuVisibility()
        },
        onCreate: ({ editor }) => {
          this.updateStats()
          this.updateBlockHandles()
          console.log('TipTap Notion-like Editor initialized')
        }
      })
    },

    shouldSave(newContent) {
      // Only save if content has meaningfully changed
      const currentContent = this.$store.get('editor/content') || ''
      const contentDiff = Math.abs(newContent.length - currentContent.length)
      return contentDiff > 10 // Save only if significant change
    },

    updateMenuVisibility() {
      if (!this.editor) return
      
      const { selection } = this.editor.state
      const { from, to, empty } = selection
      
      // Update selection state for toolbar
      this.hasSelection = !empty
      
      // Bubble menu visibility
      this.showBubbleMenu = !empty && !this.isMobile
      if (this.showBubbleMenu) {
        const coords = this.editor.view.coordsAtPos(from)
        this.bubbleMenuStyle = {
          position: 'fixed',
          left: `${coords.left}px`,
          top: `${coords.top - 60}px`,
          zIndex: 1000
        }
      }
      
      // Floating plus visibility
      const { $anchor } = selection
      const isRootDepth = $anchor.depth === 1
      const isEmptyTextBlock = $anchor.parent.isTextblock && !$anchor.parent.textContent
      
      this.showFloatingPlus = empty && isRootDepth && isEmptyTextBlock && !this.isMobile
      if (this.showFloatingPlus) {
        const coords = this.editor.view.coordsAtPos(from)
        this.floatingPlusStyle = {
          position: 'fixed',
          left: `${coords.left - 30}px`,
          top: `${coords.top}px`,
          zIndex: 1000
        }
      }
    },

    updateStats() {
      if (!this.editor) return
      
      const characterCount = this.editor.storage.characterCount
      this.stats = {
        characters: characterCount ? characterCount.characters() : 0,
        words: characterCount ? characterCount.words() : 0,
        blocks: this.countBlocks()
      }
    },

    countBlocks() {
      if (!this.editor) return 0
      
      let blockCount = 0
      this.editor.state.doc.descendants((node) => {
        if (node.isBlock && node.type.name !== 'doc') {
          blockCount++
        }
      })
      return blockCount
    },

    updateBlockHandles() {
      if (!this.editor || this.isMobile) return
      
      this.$nextTick(() => {
        const editorElement = document.querySelector('.notion-editor-content')
        if (!editorElement) return
        
        const blocks = editorElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table, hr')
        
        this.visibleBlocks = Array.from(blocks).map((block, index) => {
          const rect = block.getBoundingClientRect()
          const editorRect = editorElement.getBoundingClientRect()
          
          return {
            index,
            element: block,
            top: rect.top - editorRect.top + editorElement.scrollTop
          }
        })
        
        // Create drop zones between blocks
        this.dropZones = this.visibleBlocks.map((block, index) => ({
          index,
          top: index === 0 ? block.top - 10 : (this.visibleBlocks[index - 1].top + block.top) / 2
        }))
      })
    },

    // Toolbar actions
    setHeading(level) {
      this.editor.chain().focus().toggleHeading({ level }).run()
    },

    toggleBulletList() {
      this.editor.chain().focus().toggleBulletList().run()
    },

    toggleOrderedList() {
      this.editor.chain().focus().toggleOrderedList().run()
    },

    toggleTaskList() {
      this.editor.chain().focus().toggleTaskList().run()
    },

    toggleBlockquote() {
      this.editor.chain().focus().toggleBlockquote().run()
    },

    toggleCodeBlock() {
      this.editor.chain().focus().toggleCodeBlock().run()
    },

    insertHorizontalRule() {
      this.editor.chain().focus().setHorizontalRule().run()
    },

    // Formatting actions
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

    // Slash commands
    checkSlashCommand() {
      const { selection } = this.editor.state
      const { from } = selection
      const textBefore = this.editor.state.doc.textBetween(Math.max(0, from - 10), from)
      
      if (textBefore.endsWith('/')) {
        this.showSlashCommands()
      }
    },

    showSlashCommands() {
      const { selection } = this.editor.state
      const coords = this.editor.view.coordsAtPos(selection.from)
      
      this.slashMenuPosition = {
        x: coords.left,
        y: coords.bottom + 10
      }
      this.slashMenuOpen = true
      this.slashSearchQuery = ''
      this.highlightedIndex = 0
      
      this.$nextTick(() => {
        if (this.$refs.slashSearch) {
          this.$refs.slashSearch.focus()
        }
      })
    },

    showSlashAtBlock(index) {
      // Position slash menu at specific block
      const block = this.visibleBlocks[index]
      if (block) {
        this.slashMenuPosition = {
          x: 100,
          y: block.top + 30
        }
        this.slashMenuOpen = true
        this.slashSearchQuery = ''
        this.highlightedIndex = 0
      }
    },

    getGlobalIndex(section, commandIndex) {
      let globalIndex = 0
      for (const sect of this.filteredSlashSections) {
        if (sect === section) {
          return globalIndex + commandIndex
        }
        globalIndex += sect.commands.length
      }
      return globalIndex
    },

    highlightNext() {
      if (this.allCommands.length > 0) {
        this.highlightedIndex = (this.highlightedIndex + 1) % this.allCommands.length
      }
    },

    highlightPrevious() {
      if (this.allCommands.length > 0) {
        this.highlightedIndex = this.highlightedIndex === 0 
          ? this.allCommands.length - 1 
          : this.highlightedIndex - 1
      }
    },

    executeHighlighted() {
      const command = this.allCommands[this.highlightedIndex]
      if (command) {
        this.executeCommand(command)
      }
    },

    executeCommand(command) {
      this.slashMenuOpen = false
      
      // Remove "/" if present
      const { from } = this.editor.state.selection
      const textBefore = this.editor.state.doc.textBetween(Math.max(0, from - 1), from)
      
      if (textBefore === '/') {
        this.editor.chain().deleteRange({ from: from - 1, to: from }).run()
      }
      
      command.action()
      this.updateBlockHandles()
    },

    // Block drag & drop
    startDrag(index, event) {
      this.draggedBlock = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', this.visibleBlocks[index].element.outerHTML)
      event.dataTransfer.setData('text/plain', index.toString())
      
      // Add visual feedback
      event.target.style.opacity = '0.5'
    },

    handleDrop(targetIndex, event) {
      event.preventDefault()
      const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'))
      
      if (sourceIndex !== targetIndex && sourceIndex !== -1) {
        this.moveBlock(sourceIndex, targetIndex)
      }
      
      // Reset visual state
      this.draggedBlock = null
      this.dragTarget = -1
      
      // Reset opacity
      const draggedElement = document.querySelector('.block-drag-handle[draggable="true"]')
      if (draggedElement) {
        draggedElement.style.opacity = '1'
      }
    },

    moveBlock(fromIndex, toIndex) {
      if (!this.editor) return
      
      const { state, dispatch } = this.editor.view
      const { tr } = state
      
      // Find the actual positions in the document
      const fromBlock = this.visibleBlocks[fromIndex]
      const toBlock = this.visibleBlocks[toIndex]
      
      if (!fromBlock || !toBlock) return
      
      // Get the content to move
      const fromPos = this.getBlockPosition(fromBlock.element)
      const toPos = this.getBlockPosition(toBlock.element)
      
      if (fromPos && toPos) {
        // Create transaction to move the block
        const slice = tr.doc.slice(fromPos.start, fromPos.end)
        tr.delete(fromPos.start, fromPos.end)
        
        // Adjust target position if moving up
        const adjustedToPos = fromIndex < toIndex ? toPos.start - (fromPos.end - fromPos.start) : toPos.start
        tr.insert(adjustedToPos, slice.content)
        
        dispatch(tr)
        this.updateBlockHandles()
      }
    },

    getBlockPosition(element) {
      if (!this.editor) return null
      
      // Find the position of the element in the editor
      const editorElement = document.querySelector('.notion-editor-content')
      if (!editorElement) return null
      
      const walker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_ELEMENT,
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
      )
      
      let pos = 0
      let node
      
      while (node = walker.nextNode()) {
        if (node === element) {
          // Found the element, now find its position in the document
          const domNode = this.editor.view.domAtPos(pos)
          return {
            start: pos,
            end: pos + (element.textContent?.length || 0) + 1
          }
        }
        pos += node.textContent?.length || 0
      }
      
      return null
    },

    // Media actions
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

    // AI actions with selection support
    aiImproveText() {
      const { from, to } = this.editor.state.selection
      const selectedText = this.editor.state.doc.textBetween(from, to)
      
      if (!selectedText && this.hasSelection) {
        this.$store.commit('showNotification', {
          style: 'warning',
          message: 'Select text to improve with AI',
          icon: 'robot'
        })
        return
      }
      
      this.aiLoading = true
      setTimeout(() => {
        this.aiLoading = false
        // Simulate AI improvement
        if (selectedText) {
          const improvedText = `${selectedText} [AI Enhanced]`
          this.editor.chain().focus().deleteSelection().insertContent(improvedText).run()
        }
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'Text improved with AI!',
          icon: 'robot'
        })
      }, 1500)
    },

    aiTranslate() {
      const { from, to } = this.editor.state.selection
      const selectedText = this.editor.state.doc.textBetween(from, to)
      
      if (!selectedText) {
        this.$store.commit('showNotification', {
          style: 'warning',
          message: 'Select text to translate',
          icon: 'robot'
        })
        return
      }
      
      this.aiLoading = true
      setTimeout(() => {
        this.aiLoading = false
        // Simulate AI translation
        const translatedText = `${selectedText} [AI Translated]`
        this.editor.chain().focus().deleteSelection().insertContent(translatedText).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'Text translated with AI!',
          icon: 'robot'
        })
      }, 1500)
    },

    aiContinueWriting() {
      this.aiLoading = true
      setTimeout(() => {
        this.aiLoading = false
        // Simulate AI continuation
        const continuedText = '\n\nThis is AI-generated content that continues naturally from your writing...'
        this.editor.chain().focus().insertContent(continuedText).run()
        
        this.$store.commit('showNotification', {
          style: 'success',
          message: 'AI continued your writing!',
          icon: 'robot'
        })
      }, 1500)
    },

    aiSummarize() {
      const { from, to } = this.editor.state.selection
      const selectedText = this.editor.state.doc.textBetween(from, to)
      
      if (!selectedText) {
        // If no selection, use entire document
        const fullText = this.editor.getText()
        if (!fullText) return
      }
      
      this.aiLoading = true
      setTimeout(() => {
        this.aiLoading = false
        this.$store.commit('showNotification', {
          style: 'info',
          message: 'AI summarization feature in development!',
          icon: 'robot'
        })
      }, 1500)
    }
  },

  async mounted() {
    this.$store.set('editor/editorKey', 'tiptap')
    
    this.$nextTick(() => {
      this.initializeEditor()
    })

    // Event handlers
    this.$root.$on('editorInsert', opts => {
      switch (opts.kind) {
        case 'IMAGE':
          this.editor.chain().focus().setImage({ src: opts.path, alt: opts.text || '' }).run()
          break
        case 'BINARY':
          this.editor.chain().focus().setLink({ href: opts.path }).insertContent(opts.text || opts.path).run()
          break
      }
      this.updateBlockHandles()
    })

    this.$root.$on('editorLinkToPage', opts => {
      this.insertLinkDialog = true
    })

    this.$root.$on('overwriteEditorContent', () => {
      if (this.editor) {
        this.editor.commands.setContent(this.$store.get('editor/content'))
        this.updateStats()
        this.updateBlockHandles()
      }
    })

    // Window resize handler
    window.addEventListener('resize', this.updateBlockHandles)
  },

  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy()
      this.editor = null
    }
    
    this.$root.$off('editorInsert')
    this.$root.$off('editorLinkToPage')
    this.$root.$off('overwriteEditorContent')
    
    window.removeEventListener('resize', this.updateBlockHandles)
  }
}
</script>

<style lang="scss">
$notion-text: #37352f;
$notion-text-light: #787774;
$notion-bg: #ffffff;
$notion-bg-hover: #f7f6f3;
$notion-border: #e9e9e7;
$notion-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
$notion-radius: 6px;

.editor-tiptap-notion {
  position: relative;
  height: calc(100vh - 64px - 24px);
  background: $notion-bg;

  @at-root .theme--dark & {
    background: #1e1e1e;
  }

  // Toolbar superiore
  .editor-toolbar {
    background: white;
    border-bottom: 1px solid $notion-border;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    min-height: 56px;
    position: sticky;
    top: 0;
    z-index: 100;

    @at-root .theme--dark & {
      background: #2d2d2d;
      border-bottom-color: #404040;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 8px;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 2px;

      &.ai-group {
        margin-left: auto;
        
        .v-btn {
          &:not(.v-btn--disabled) {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
          }
        }
      }
    }

    .v-btn {
      min-width: 36px !important;
      width: 36px;
      height: 36px;
    }
  }

  // Bubble Menu
  .bubble-menu {
    z-index: 1000;
    
    .bubble-menu-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid $notion-border;
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
        color: $notion-text-light;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: $notion-bg-hover;
          color: $notion-text;
        }

        &.active {
          background: #e3f2fd;
          color: #1976d2;
        }

        &.ai-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-left: 2px;

          &:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
        }
      }

      .bubble-divider {
        width: 1px;
        height: 20px;
        background: $notion-border;
        margin: 0 6px;

        @at-root .theme--dark & {
          background: #404040;
        }
      }
    }
  }

  // Floating Plus
  .floating-plus {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid $notion-border;
    background: white;
    color: $notion-text-light;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    opacity: 0.6;

    &:hover {
      opacity: 1;
      background: $notion-bg-hover;
      transform: scale(1.1);
    }

    @at-root .theme--dark & {
      background: #2d2d2d;
      border-color: #404040;
    }
  }

  // Editor Content
  .editor-content-wrapper {
    height: calc(100% - 24px);
    overflow-y: auto;
    padding: 40px;
    position: relative;

    .editor-content-container {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }
  }

  // Block Handles
  .block-handles {
    position: absolute;
    top: 0;
    left: -60px;
    width: 50px;
    z-index: 100;
    pointer-events: none;

    .block-handle {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: auto;

      &:hover {
        opacity: 1;
      }

      .block-drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        cursor: grab;
        border-radius: 2px;
        transition: all 0.15s;

        &:hover {
          background: $notion-bg-hover;
        }

        .drag-dots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          
          .dot {
            width: 2px;
            height: 2px;
            background: $notion-text-light;
            border-radius: 50%;
          }
        }
      }

      .block-actions {
        display: flex;
        gap: 2px;
        
        .block-action-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid $notion-border;
          background: white;
          color: $notion-text-light;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;

          &:hover {
            background: $notion-bg-hover;
            color: $notion-text;
          }

          @at-root .theme--dark & {
            background: #2d2d2d;
            border-color: #404040;
          }
        }
      }
    }
  }

  // Show block handles on hover
  .editor-content-container:hover .block-handle {
    opacity: 1;
  }

  // Drop zones per drag & drop
  .drop-zone {
    position: absolute;
    left: 0;
    right: 0;
    height: 4px;
    background: transparent;
    border-radius: 2px;
    transition: all 0.2s ease;
    z-index: 50;

    &.active {
      background: #2eaadc;
      height: 6px;
      box-shadow: 0 0 8px rgba(46, 170, 220, 0.3);
    }
  }

  // Slash Menu Card
  .slash-menu-card {
    border-radius: 12px !important;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12) !important;

    .slash-menu-header {
      padding: 16px 20px 12px !important;
      border-bottom: 1px solid $notion-border;

      @at-root .theme--dark & {
        border-bottom-color: #404040;
      }
    }

    .slash-menu-content {
      padding: 16px 20px 20px !important;
    }

    .v-list-item {
      min-height: 48px;
      border-radius: 8px;
      margin: 2px 0;
      transition: background-color 0.15s;

      &:hover,
      &.highlighted {
        background: rgba(25, 118, 210, 0.04) !important;
      }
    }

    .v-subheader {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: $notion-text-light;
      padding-left: 0;
      height: 32px;
    }
  }

  // AI Loading
  .ai-loading {
    text-align: center;
    color: white;
  }

  // Notion-style Editor Content
  .notion-editor-content {
    outline: none;
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: $notion-text;

    @at-root .theme--dark & {
      color: #e6e6e6;
    }

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

    h4, h5, h6 {
      font-size: 1.25em;
      margin-bottom: 0.4em;
    }

    // Paragraphs
    p {
      margin: 1em 0;
      
      &.is-editor-empty:first-child::before {
        color: $notion-text-light;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;

        @at-root .theme--dark & {
          color: #9b9b9b;
        }
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

    // Task Lists
    .notion-task-list {
      list-style: none;
      margin: 1em 0;
      padding-left: 0;

      .notion-task-item {
        display: flex;
        align-items: flex-start;
        margin: 0.25em 0;

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
    .notion-blockquote {
      border-left: 4px solid $notion-border;
      padding-left: 1.5em;
      margin: 2em 0;
      font-style: italic;
      color: $notion-text-light;

      @at-root .theme--dark & {
        border-left-color: #404040;
        color: #9b9b9b;
      }
    }

    // Code
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

    .notion-code-block {
      background: #f8f8f8;
      border: 1px solid $notion-border;
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
        font-size: 14px;
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
      color: #2eaadc;
      text-decoration: underline;
      text-decoration-color: rgba(46, 170, 220, 0.4);
      text-underline-offset: 2px;
      transition: all 0.15s;

      &:hover {
        text-decoration-color: rgba(46, 170, 220, 0.8);
      }

      @at-root .theme--dark & {
        color: #58a6ff;
      }
    }

    // Highlights
    .notion-highlight {
      background: linear-gradient(104deg, rgba(130, 255, 173, 0) 0.9%, rgba(130, 255, 173, 1.25) 2.4%, rgba(130, 255, 173, 0.5) 5.8%, rgba(130, 255, 173, 0.1) 93%, rgba(130, 255, 173, 0.7) 96%, rgba(130, 255, 173, 0) 98%);
      padding: 2px 0;
    }

    // Tables
    .notion-table {
      border-collapse: collapse;
      width: 100%;
      margin: 2em 0;
      border: 1px solid $notion-border;
      border-radius: 8px;
      overflow: hidden;

      @at-root .theme--dark & {
        border-color: #404040;
      }
      
      th, td {
        border: 1px solid $notion-border;
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
    .notion-divider {
      border: none;
      height: 1px;
      background: $notion-border;
      margin: 3em 0;

      @at-root .theme--dark & {
        background: #404040;
      }
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

    .block-handles {
      display: none !important;
    }

    .bubble-menu,
    .floating-plus {
      display: none !important;
    }
  }
}

// Scrollbar styling
.editor-tiptap-notion {
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(135, 131, 120, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(135, 131, 120, 0.5);
    }
  }

  @at-root .theme--dark & {
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}
</style>