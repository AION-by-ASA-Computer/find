<!-- 
  QUESTO È IL COMPONENTE COMPLETO CON GRAPHQL
  Da usare quando il resolver GraphQL sarà implementato
-->

<template lang='pug'>
  v-container(fluid, grid-list-lg)
    v-layout(row, wrap)
      v-flex(xs12)
        .admin-header
          img.animated.fadeInUp(src='/_assets/svg/icon-web-design.svg', alt='Editor', style='width: 80px;')
          .admin-header-title
            .headline.primary--text.animated.fadeInLeft {{ $t('admin:editor.title') }}
            .subtitle-1.grey--text.animated.fadeInLeft.wait-p4s Configure content editors
          v-spacer
          v-btn.animated.fadeInDown.wait-p3s(icon, outlined, color='grey', href='https://docs.requarks.io/editors', target='_blank')
            v-icon mdi-help-circle
          v-btn.mx-3.animated.fadeInDown.wait-p2s(icon, outlined, color='grey', @click='refresh')
            v-icon mdi-refresh
          v-btn.animated.fadeInDown(color='success', @click='save', depressed, large, :loading='loading')
            v-icon(left) mdi-check
            span {{$t('common:actions.apply')}}

        v-card.mt-3.animated.fadeInUp
          v-tabs(color='grey darken-2', fixed-tabs, slider-color='white', show-arrows, dark)
            v-tab(key='settings')
              v-icon mdi-cog
              span.ml-2 Settings
            v-tab(
              v-for='editor in enabledEditors'
              :key='editor.key'
              v-if='editor.config && editor.config.length > 0'
            ) {{ editor.title }}

            v-tab-item(key='settings', :transition='false', :reverse-transition='false')
              v-card.pa-3(flat, tile)
                .body-2.grey--text.text--darken-1.mb-3 Select which editors to enable:
                .caption.grey--text.pb-2 Editors marked as enabled will be available when creating or editing pages.
                
                v-list
                  v-list-item(v-for='editor in editors', :key='editor.key')
                    v-list-item-avatar
                      v-icon(:color='getEditorColor(editor.contentType)') {{ getEditorIcon(editor.key) }}
                    v-list-item-content
                      v-list-item-title {{ editor.title }}
                      v-list-item-subtitle {{ editor.description }}
                      .mt-1
                        v-chip(x-small, :color='getChipColor(editor.contentType)', text-color='white') {{ editor.contentType }}
                        v-chip.ml-1(v-if='editor.key === "tiptap"', x-small, color='green', text-color='white') NEW
                    v-list-item-action
                      v-switch(
                        v-model='editor.isEnabled'
                        color='primary'
                        :disabled='editor.key === "markdown"'
                      )

            v-tab-item(
              v-for='editor in enabledEditors'
              :key='editor.key'
              v-if='editor.config && editor.config.length > 0'
              :transition='false'
              :reverse-transition='false'
            )
              v-card.wiki-form.pa-3(flat, tile)
                v-form
                  v-subheader {{ editor.title }} Configuration
                  .caption.grey--text.mb-4 Configure {{ editor.title }} specific settings
                  
                  template(v-for='(configItem, idx) in getEditorConfig(editor)')
                    // Detect configuration type and render appropriate input
                    
                    // Array/Multi-select (like TipTap extensions/toolbar)
                    v-select(
                      v-if='isArrayConfig(configItem)'
                      :key='`${editor.key}-${idx}`'
                      :items='getConfigOptions(configItem.key)'
                      outlined
                      multiple
                      chips
                      deletable-chips
                      :label='formatConfigLabel(configItem.key)'
                      :hint='getConfigHint(configItem.key)'
                      persistent-hint
                      v-model='configItem.parsedValue'
                    )
                    
                    // Boolean toggle
                    v-switch(
                      v-else-if='isBooleanConfig(configItem)'
                      :key='`${editor.key}-${idx}`'
                      :label='formatConfigLabel(configItem.key)'
                      :hint='getConfigHint(configItem.key)'
                      persistent-hint
                      color='primary'
                      v-model='configItem.parsedValue'
                    )
                    
                    // String input  
                    v-text-field(
                      v-else
                      :key='`${editor.key}-${idx}`'
                      outlined
                      :label='formatConfigLabel(configItem.key)'
                      :hint='getConfigHint(configItem.key)'
                      persistent-hint
                      v-model='configItem.parsedValue'
                    )

        v-snackbar(v-model='showSuccess', timeout='3000', color='success')
          v-icon(left) mdi-check
          | Configuration saved successfully!

</template>

<script>
import _ from 'lodash'
import gql from 'graphql-tag'

export default {
  data() {
    return {
      editors: [],
      loading: false,
      showSuccess: false
    }
  },
  computed: {
    enabledEditors() {
      return this.editors.filter(editor => editor.isEnabled)
    }
  },
  methods: {
    getEditorIcon(key) {
      const icons = {
        'markdown': 'mdi-language-markdown',
        'ckeditor': 'mdi-format-font',
        'tiptap': 'mdi-pencil-box-outline',
        'code': 'mdi-code-brackets',
        'asciidoc': 'mdi-file-document-outline'
      }
      return icons[key] || 'mdi-pencil'
    },
    getEditorColor(contentType) {
      const colors = {
        'markdown': 'green',
        'html': 'blue',
        'code': 'purple',
        'asciidoc': 'orange'
      }
      return colors[contentType] || 'grey'
    },
    getChipColor(contentType) {
      return this.getEditorColor(contentType)
    },
    getEditorConfig(editor) {
      if (!editor.config) return []
      
      return editor.config.map(config => {
        try {
          return {
            ...config,
            parsedValue: JSON.parse(config.value)
          }
        } catch (e) {
          return {
            ...config,
            parsedValue: config.value
          }
        }
      })
    },
    isArrayConfig(configItem) {
      return Array.isArray(configItem.parsedValue)
    },
    isBooleanConfig(configItem) {
      return typeof configItem.parsedValue === 'boolean'
    },
    formatConfigLabel(key) {
      const labels = {
        'extensions': 'Extensions',
        'toolbar': 'Toolbar Items',
        'placeholder': 'Placeholder Text',
        'showCharacterCount': 'Show Character Count'
      }
      return labels[key] || _.startCase(key)
    },
    getConfigHint(key) {
      const hints = {
        'extensions': 'TipTap extensions to enable',
        'toolbar': 'Toolbar buttons to display',
        'placeholder': 'Text shown when editor is empty',
        'showCharacterCount': 'Display word and character count'
      }
      return hints[key] || ''
    },
    getConfigOptions(key) {
      if (key === 'extensions') {
        return [
          'StarterKit', 'Image', 'Link', 'Table', 'TextAlign',
          'Highlight', 'Underline', 'CharacterCount', 'CodeBlock',
          'Blockquote', 'BulletList', 'OrderedList'
        ]
      }
      
      if (key === 'toolbar') {
        return [
          'bold', 'italic', 'underline', 'strike', 'code',
          'heading', 'bulletList', 'orderedList', 'blockquote',
          'codeBlock', 'image', 'link', 'table', 'textAlign',
          'highlight', 'undo', 'redo'
        ]
      }
      
      return []
    },
    async save() {
      this.loading = true
      try {
        // Prepare editor configs for saving
        const editorsToUpdate = this.editors.map(editor => ({
          key: editor.key,
          isEnabled: editor.isEnabled,
          config: this.prepareEditorConfig(editor)
        }))

        await this.$apollo.mutate({
          mutation: gql`
            mutation ($editors: [EditorInput]!) {
              editors {
                updateEditors(editors: $editors) {
                  responseResult {
                    succeeded
                    errorCode
                    slug
                    message
                  }
                }
              }
            }
          `,
          variables: {
            editors: editorsToUpdate
          }
        })

        this.$store.commit('showNotification', {
          style: 'success',
          message: 'Editor configuration saved successfully.',
          icon: 'check'
        })
        
        this.showSuccess = true
      } catch (err) {
        this.$store.commit('pushGraphError', err)
      }
      this.loading = false
    },

    prepareEditorConfig(editor) {
      if (!editor.config) return []
      
      return this.getEditorConfig(editor).map(config => ({
        key: config.key,
        value: JSON.stringify(config.parsedValue)
      }))
    },

    async refresh() {
      await this.$apollo.queries.editors.refetch()
      this.$store.commit('showNotification', {
        message: 'Editors have been refreshed from disk.',
        style: 'success',
        icon: 'refresh'
      })
    }
  },

  apollo: {
    editors: {
      query: gql`
        {
          editors {
            list {
              key
              title
              description
              contentType
              author
              website
              isEnabled
              config {
                key
                value
              }
            }
          }
        }
      `,
      fetchPolicy: 'network-only',
      update: (data) => _.cloneDeep(data.editors.list),
      watchLoading (isLoading) {
        this.$store.commit(`loading${isLoading ? 'Start' : 'Stop'}`, 'admin-editors-refresh')
      }
    }
  }
}
</script>

<style lang='scss'>
.admin-editors {
  .v-input--checkbox {
    .v-messages {
      min-height: 18px;
    }
  }
}
</style>