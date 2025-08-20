<template lang='pug'>
  .editor-tiptap
    .editor-tiptap-toolbar(ref='toolbar')
      .toolbar-group(v-if='toolbar.includes("bold") || toolbar.includes("italic") || toolbar.includes("underline")')
        button.toolbar-btn(
          :class='{ active: editor?.isActive("bold") }'
          @click='editor?.chain().focus().toggleBold().run()'
          v-if='toolbar.includes("bold")'
          title='Bold'
        )
          v-icon mdi-format-bold
        button.toolbar-btn(
          :class='{ active: editor?.isActive("italic") }'
          @click='editor?.chain().focus().toggleItalic().run()'
          v-if='toolbar.includes("italic")'
          title='Italic'
        )
          v-icon mdi-format-italic
        button.toolbar-btn(
          :class='{ active: editor?.isActive("underline") }'
          @click='editor?.chain().focus().toggleUnderline().run()'
          v-if='toolbar.includes("underline")'
          title='Underline'
        )
          v-icon mdi-format-underline
        button.toolbar-btn(
          :class='{ active: editor?.isActive("strike") }'
          @click='editor?.chain().focus().toggleStrike().run()'
          v-if='toolbar.includes("strike")'
          title='Strikethrough'
        )
          v-icon mdi-format-strikethrough

      .toolbar-divider(v-if='hasTextFormats && hasHeadings')

      .toolbar-group(v-if='toolbar.includes("heading")')
        select.toolbar-select(
          @change='onHeadingChange'
          :value='getActiveHeading()'
        )
          option(value='paragraph') Paragraph
          option(value='heading1') Heading 1
          option(value='heading2') Heading 2
          option(value='heading3') Heading 3
          option(value='heading4') Heading 4
          option(value='heading5') Heading 5
          option(value='heading6') Heading 6

      .toolbar-divider(v-if='hasHeadings && hasLists')

      .toolbar-group(v-if='toolbar.includes("bulletList") || toolbar.includes("orderedList")')
        button.toolbar-btn(
          :class='{ active: editor?.isActive("bulletList") }'
          @click='editor?.chain().focus().toggleBulletList().run()'
          v-if='toolbar.includes("bulletList")'
          title='Bullet List'
        )
          v-icon mdi-format-list-bulleted
        button.toolbar-btn(
          :class='{ active: editor?.isActive("orderedList") }'
          @click='editor?.chain().focus().toggleOrderedList().run()'
          v-if='toolbar.includes("orderedList")'
          title='Numbered List'
        )
          v-icon mdi-format-list-numbered

      .toolbar-divider(v-if='hasLists && hasBlocks')

      .toolbar-group(v-if='toolbar.includes("blockquote") || toolbar.includes("codeBlock")')
        button.toolbar-btn(
          :class='{ active: editor?.isActive("blockquote") }'
          @click='editor?.chain().focus().toggleBlockquote().run()'
          v-if='toolbar.includes("blockquote")'
          title='Blockquote'
        )
          v-icon mdi-format-quote-close
        button.toolbar-btn(
          :class='{ active: editor?.isActive("codeBlock") }'
          @click='editor?.chain().focus().toggleCodeBlock().run()'
          v-if='toolbar.includes("codeBlock")'
          title='Code Block'
        )
          v-icon mdi-code-braces

      .toolbar-divider(v-if='hasBlocks && hasMedia')

      .toolbar-group(v-if='toolbar.includes("image") || toolbar.includes("link")')
        button.toolbar-btn(
          @click='insertImage'
          v-if='toolbar.includes("image")'
          title='Insert Image'
        )
          v-icon mdi-image
        button.toolbar-btn(
          @click='insertLink'
          v-if='toolbar.includes("link")'
          title='Insert Link'
        )
          v-icon mdi-link

      .toolbar-divider(v-if='hasMedia && hasTable')

      .toolbar-group(v-if='toolbar.includes("table")')
        button.toolbar-btn(
          @click='insertTable'
          title='Insert Table'
        )
          v-icon mdi-table

      .toolbar-divider(v-if='hasTable && hasAlign')

      .toolbar-group(v-if='toolbar.includes("textAlign")')
        button.toolbar-btn(
          :class='{ active: editor?.isActive({ textAlign: "left" }) }'
          @click='editor?.chain().focus().setTextAlign("left").run()'
          title='Align Left'
        )
          v-icon mdi-format-align-left
        button.toolbar-btn(
          :class='{ active: editor?.isActive({ textAlign: "center" }) }'
          @click='editor?.chain().focus().setTextAlign("center").run()'
          title='Align Center'
        )
          v-icon mdi-format-align-center
        button.toolbar-btn(
          :class='{ active: editor?.isActive({ textAlign: "right" }) }'
          @click='editor?.chain().focus().setTextAlign("right").run()'
          title='Align Right'
        )
          v-icon mdi-format-align-right

      .toolbar-divider(v-if='hasAlign && hasHighlight')

      .toolbar-group(v-if='toolbar.includes("highlight")')
        button.toolbar-btn(
          :class='{ active: editor?.isActive("highlight") }'
          @click='editor?.chain().focus().toggleHighlight().run()'
          title='Highlight'
        )
          v-icon mdi-marker

      v-spacer

      .toolbar-group(v-if='toolbar.includes("undo") || toolbar.includes("redo")')
        button.toolbar-btn(
          @click='editor?.chain().focus().undo().run()'
          :disabled='!editor?.can().undo()'
          v-if='toolbar.includes("undo")'
          title='Undo'
        )
          v-icon mdi-undo
        button.toolbar-btn(
          @click='editor?.chain().focus().redo().run()'
          :disabled='!editor?.can().redo()'
          v-if='toolbar.includes("redo")'
          title='Redo'
        )
          v-icon mdi-redo

    .editor-tiptap-content(ref='editor')

    v-system-bar.editor-tiptap-sysbar(dark, status, color='grey darken-3')
      .caption.editor-tiptap-sysbar-locale {{locale.toUpperCase()}}
      .caption.px-3 /{{path}}
      template(v-if='$vuetify.breakpoint.mdAndUp')
        v-spacer
        .caption TipTap Editor
        v-spacer
        .caption(v-if='showCharacterCount') {{stats.words}} words, {{stats.characters}} chars

    editor-conflict(v-model='isConflict', v-if='isConflict')
    page-selector(mode='select', v-model='insertLinkDialog', :open-handler='insertLinkHandler', :path='path', :locale='locale')
</template>

<script>
import _ from 'lodash'
import { get, sync } from 'vuex-pathify'
import { Editor } from '@tiptap/core'
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
import EditorConflict from './ckeditor/conflict.vue'

/* global siteLangs */

export default {
  components: {
    EditorConflict
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
      content: '',
      isConflict: false,
      insertLinkDialog: false,
      config: {
        extensions: ['StarterKit', 'Image', 'Link', 'Table', 'TextAlign', 'Highlight'],
        placeholder: 'Start typing your content here...',
        showCharacterCount: true,
        toolbar: ['bold', 'italic', 'underline', 'strike', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'image', 'link', 'table', 'textAlign', 'highlight', 'undo', 'redo']
      }
    }
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown
    },
    locale: get('page/locale'),
    path: get('page/path'),
    activeModal: sync('editor/activeModal'),
    
    toolbar() {
      return this.config.toolbar || []
    },
    
    showCharacterCount() {
      return this.config.showCharacterCount
    },
    
    hasTextFormats() {
      return this.toolbar.some(item => ['bold', 'italic', 'underline', 'strike'].includes(item))
    },
    
    hasHeadings() {
      return this.toolbar.includes('heading')
    },
    
    hasLists() {
      return this.toolbar.some(item => ['bulletList', 'orderedList'].includes(item))
    },
    
    hasBlocks() {
      return this.toolbar.some(item => ['blockquote', 'codeBlock'].includes(item))
    },
    
    hasMedia() {
      return this.toolbar.some(item => ['image', 'link'].includes(item))
    },
    
    hasTable() {
      return this.toolbar.includes('table')
    },
    
    hasAlign() {
      return this.toolbar.includes('textAlign')
    },
    
    hasHighlight() {
      return this.toolbar.includes('highlight')
    }
  },
  methods: {
    getActiveHeading() {
      for (let i = 1; i <= 6; i++) {
        if (this.editor?.isActive('heading', { level: i })) {
          return `heading${i}`
        }
      }
      return 'paragraph'
    },
    
    onHeadingChange(event) {
      const value = event.target.value
      if (value === 'paragraph') {
        this.editor?.chain().focus().setParagraph().run()
      } else {
        const level = parseInt(value.replace('heading', ''))
        this.editor?.chain().focus().toggleHeading({ level }).run()
      }
    },
    
    insertImage() {
      this.$root.$emit('editorModal', {
        modal: 'editorModalMedia',
        mode: 'image'
      })
    },
    
    insertLink() {
      this.insertLinkDialog = true
    },
    
    insertLinkHandler({ locale, path }) {
      const url = siteLangs.length > 0 ? `/${locale}/${path}` : `/${path}`
      this.editor?.chain().focus().setLink({ href: url }).run()
    },
    
    insertTable() {
      this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
    
    initializeExtensions() {
      const extensions = [
        StarterKit,
        Underline,
        Image.configure({
          HTMLAttributes: {
            class: 'editor-image',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'editor-link',
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
      ]
      
      if (this.showCharacterCount) {
        extensions.push(
          CharacterCount.configure({
            limit: null,
          })
        )
      }
      
      return extensions
    }
  },
  async mounted() {
    this.$store.set('editor/editorKey', 'tiptap')
    
    // Get editor configuration
    const editorConfig = this.$store.get('editor/config') || {}
    this.config = { ...this.config, ...editorConfig }
    
    this.editor = new Editor({
      element: this.$refs.editor,
      extensions: this.initializeExtensions(),
      content: this.$store.get('editor/content') || '',
      editorProps: {
        attributes: {
          class: 'tiptap-editor-content',
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        this.$store.set('editor/content', html)
        
        if (this.showCharacterCount && editor.extensionManager.extensions.find(ext => ext.name === 'characterCount')) {
          const characterCount = editor.storage.characterCount
          this.stats = {
            characters: characterCount.characters(),
            words: characterCount.words()
          }
        }
      },
      onSelectionUpdate: ({ editor }) => {
        // Update toolbar states
        this.$forceUpdate()
      },
    })
    
    // Handle editor events from other components
    this.$root.$on('editorInsert', opts => {
      switch (opts.kind) {
        case 'IMAGE':
          this.editor?.chain().focus().setImage({ src: opts.path, alt: opts.text || '' }).run()
          break
        case 'BINARY':
          this.editor?.chain().focus().setLink({ href: opts.path }).insertContent(opts.text || opts.path).run()
          break
        case 'DIAGRAM':
          this.editor?.chain().focus().setImage({ src: `data:image/svg+xml;base64,${opts.text}` }).run()
          break
      }
    })
    
    this.$root.$on('editorLinkToPage', opts => {
      this.insertLink()
    })
    
    // Handle save conflict
    this.$root.$on('saveConflict', () => {
      this.isConflict = true
    })
    
    this.$root.$on('overwriteEditorContent', () => {
      this.editor?.commands.setContent(this.$store.get('editor/content'))
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
$editor-height: calc(100vh - 64px - 24px);
$editor-height-mobile: calc(100vh - 56px - 16px);

.editor-tiptap {
  background-color: mc('grey', '200');
  flex: 1 1 50%;
  display: flex;
  flex-flow: column nowrap;
  height: $editor-height;
  max-height: $editor-height;
  position: relative;

  @at-root .theme--dark & {
    background-color: mc('grey', '900');
  }

  @include until($tablet) {
    height: $editor-height-mobile;
    max-height: $editor-height-mobile;
  }

  &-toolbar {
    background-color: mc('grey', '300');
    border-bottom: 1px solid mc('grey', '400');
    display: flex;
    align-items: center;
    padding: 8px 16px;
    min-height: 56px;
    flex-wrap: wrap;
    gap: 8px;

    @at-root .theme--dark & {
      background-color: mc('grey', '800');
      border-bottom-color: mc('grey', '700');
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background-color: mc('grey', '400');
      margin: 0 4px;

      @at-root .theme--dark & {
        background-color: mc('grey', '600');
      }
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: mc('grey', '700');
      cursor: pointer;
      transition: all 0.2s;

      @at-root .theme--dark & {
        color: mc('grey', '300');
      }

      &:hover {
        background-color: mc('grey', '400');
        
        @at-root .theme--dark & {
          background-color: mc('grey', '700');
        }
      }

      &.active {
        background-color: mc('blue', '500');
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .v-icon {
        font-size: 18px;
      }
    }

    .toolbar-select {
      padding: 6px 8px;
      border: 1px solid mc('grey', '400');
      border-radius: 4px;
      background: white;
      color: mc('grey', '800');
      font-size: 14px;
      min-width: 120px;

      @at-root .theme--dark & {
        background: mc('grey', '700');
        color: mc('grey', '100');
        border-color: mc('grey', '600');
      }
    }
  }

  &-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    
    .tiptap-editor-content {
      background-color: white;
      border-radius: 8px;
      padding: 32px;
      min-height: 500px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin: 0 auto;
      max-width: 800px;
      outline: none;

      @at-root .theme--dark & {
        background-color: mc('grey', '800');
        color: mc('grey', '100');
      }

      h1, h2, h3, h4, h5, h6 {
        margin: 1.5em 0 0.5em 0;
        font-weight: 600;
        line-height: 1.2;
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.75em; }
      h3 { font-size: 1.5em; }
      h4 { font-size: 1.25em; }
      h5 { font-size: 1.1em; }
      h6 { font-size: 1em; }

      p {
        margin: 1em 0;
        line-height: 1.6;
      }

      ul, ol {
        padding-left: 2em;
        margin: 1em 0;
      }

      blockquote {
        border-left: 4px solid mc('blue', '500');
        padding-left: 1em;
        margin: 1em 0;
        font-style: italic;
        color: mc('grey', '600');

        @at-root .theme--dark & {
          color: mc('grey', '400');
        }
      }

      code {
        background-color: mc('grey', '100');
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;

        @at-root .theme--dark & {
          background-color: mc('grey', '700');
        }
      }

      pre {
        background-color: mc('grey', '100');
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;

        @at-root .theme--dark & {
          background-color: mc('grey', '700');
        }

        code {
          background: none;
          padding: 0;
        }
      }

      .editor-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1em 0;
      }

      .editor-link {
        color: mc('blue', '600');
        text-decoration: underline;

        @at-root .theme--dark & {
          color: mc('blue', '400');
        }
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;

        th, td {
          border: 1px solid mc('grey', '300');
          padding: 8px 12px;
          text-align: left;

          @at-root .theme--dark & {
            border-color: mc('grey', '600');
          }
        }

        th {
          background-color: mc('grey', '100');
          font-weight: 600;

          @at-root .theme--dark & {
            background-color: mc('grey', '700');
          }
        }
      }

      mark {
        background-color: mc('yellow', '200');
        padding: 1px 2px;
        border-radius: 2px;

        @at-root .theme--dark & {
          background-color: mc('yellow', '700');
          color: mc('grey', '100');
        }
      }
    }
  }

  &-sysbar {
    padding-left: 0;

    &-locale {
      background-color: rgba(255,255,255,.25);
      display: inline-flex;
      padding: 0 12px;
      height: 24px;
      width: 63px;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>