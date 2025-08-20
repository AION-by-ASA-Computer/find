// server/graph/resolvers/editors.js

const _ = require('lodash')
const graphHelper = require('../../helpers/graph')

/* global WIKI */

module.exports = {
  Query: {
    async editors() { return {} }
  },
  Mutation: {
    async editors() { return {} }
  },
  EditorsQuery: {
    async list(obj, args, context, info) {
      let editors = await WIKI.models.editors.getEditors()
      
      // Merge with editor definitions from disk
      editors = editors.map(editor => {
        const editorInfo = _.find(WIKI.data.editors, ['key', editor.key]) || {}
        
        // Convert config to KeyValuePair format
        const configPairs = []
        if (editor.config && typeof editor.config === 'object') {
          Object.keys(editor.config).forEach(key => {
            configPairs.push({
              key: key,
              value: JSON.stringify(editor.config[key])
            })
          })
        }

        return {
          key: editor.key,
          title: editorInfo.title || editor.key,
          description: editorInfo.description || '',
          contentType: editorInfo.contentType || 'html',
          author: editorInfo.author || '',
          website: editorInfo.website || '',
          isEnabled: editor.isEnabled,
          config: configPairs
        }
      })

      // Filter out editors that don't exist on disk
      editors = editors.filter(editor => _.find(WIKI.data.editors, ['key', editor.key]))

      if (args.filter) { 
        editors = graphHelper.filter(editors, args.filter) 
      }
      if (args.orderBy) { 
        editors = _.sortBy(editors, [args.orderBy]) 
      }
      
      return editors
    }
  },
  EditorsMutation: {
    async updateEditors(obj, args, context) {
      try {
        for (let editor of args.editors) {
          // Validate editor exists
          const editorInfo = _.find(WIKI.data.editors, ['key', editor.key])
          if (!editorInfo) {
            throw new Error(`Editor ${editor.key} not found`)
          }

          // Process configuration from KeyValuePair format
          let config = {}
          if (editor.config && Array.isArray(editor.config)) {
            editor.config.forEach(pair => {
              try {
                config[pair.key] = JSON.parse(pair.value)
              } catch (err) {
                // If parsing fails, use raw value
                config[pair.key] = pair.value
              }
            })
          }

          // Validate configuration against editor props
          if (editorInfo.props) {
            config = _.pick(config, Object.keys(editorInfo.props))
            
            // Apply validation for specific editors
            if (editor.key === 'tiptap') {
              config = WIKI.models.editors.validateTipTapConfig ? 
                WIKI.models.editors.validateTipTapConfig(config) : config
            }
          }

          // Update editor in database
          await WIKI.models.editors.query()
            .patch({
              isEnabled: editor.isEnabled,
              config: config
            })
            .where('key', editor.key)
        }

        // Reload editors from disk to pick up any new ones
        await WIKI.models.editors.refreshEditorsFromDisk()

        return {
          responseResult: graphHelper.generateSuccess('Editors updated successfully')
        }
      } catch (err) {
        return graphHelper.generateError(err)
      }
    },

    async refreshEditors(obj, args, context) {
      try {
        await WIKI.models.editors.refreshEditorsFromDisk()
        
        return {
          responseResult: graphHelper.generateSuccess('Editors refreshed successfully')
        }
      } catch (err) {
        return graphHelper.generateError(err)
      }
    }
  }
}