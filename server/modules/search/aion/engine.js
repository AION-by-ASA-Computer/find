// AION Search Engine Implementation
// File: server/modules/search/aion/engine.js

const axios = require('axios')
const _ = require('lodash')

/* global WIKI */

module.exports = {
  /**
   * ACTIVATE
   */
  async activate() {
    // Test connection to AION service
    try {
      const response = await axios.get(`${this.config.serviceUrl}/health`, {
        timeout: this.config.apiTimeout || 10000
      })

      if (response.data.status !== 'healthy') {
        WIKI.logger.warn(`(SEARCH/AION) Service status: ${response.data.status}`)
        WIKI.logger.warn(`(SEARCH/AION) Service details:`, response.data.services)
      }

      WIKI.logger.info(`(SEARCH/AION) Connected to AION service at ${this.config.serviceUrl}`)
    } catch (err) {
      WIKI.logger.error(`(SEARCH/AION) Failed to connect to AION service: ${err.message}`)
      if (!this.config.fallbackSearch) {
        throw new WIKI.Error.SearchActivationFailed('Cannot connect to AION service and fallback is disabled')
      }
    }
  },

  /**
   * DEACTIVATE
   */
  async deactivate() {
    WIKI.logger.info(`(SEARCH/AION) Search engine deactivated`)
  },

  /**
   * INIT
   */
  async init() {
    WIKI.logger.info(`(SEARCH/AION) Initializing...`)

    // Set default config values
    this.config = _.defaults(this.config, {
      serviceUrl: 'http://localhost:8060',
      indexingTimeout: 30000,
      enableSemanticSearch: true,
      maxResults: 50,
      fallbackSearch: true,
      logIndexingErrors: true,
      retryAttempts: 3,
      apiTimeout: 10000
    })

    WIKI.logger.info(`(SEARCH/AION) Initialization completed`)
  },

  /**
   * QUERY
   * 
   * @param {String} q Query string
   * @param {Object} opts Additional options
   */
  async query(q, opts) {
    try {
      WIKI.logger.info(`(SEARCH/AION) Executing semantic search: ${q}`)

      // Use AION semantic search if enabled
      if (this.config.enableSemanticSearch) {
        return await this._semanticSearch(q, opts)
      } else {
        // Fallback to database search
        return await this._fallbackQuery(q, opts)
      }
    } catch (err) {
      WIKI.logger.warn(`(SEARCH/AION) Search failed: ${err.message}`)
      if (this.config.fallbackSearch) {
        return await this._fallbackQuery(q, opts)
      }
      throw err
    }
  },

  /**
   * CREATE
   * 
   * @param {Object} page Page to create
   */
  async created(page) {
    WIKI.logger.info(`(SEARCH/AION) Indexing new page: ${page.path}`)
    await this._indexDocument(page, 'create')
  },

  /**
   * UPDATE
   * 
   * @param {Object} page Page to update
   */
  async updated(page) {
    WIKI.logger.info(`(SEARCH/AION) Updating indexed page: ${page.path}`)
    await this._indexDocument(page, 'update')
  },

  /**
   * DELETE
   * 
   * @param {Object} page Page to delete
   */
  async deleted(page) {
    WIKI.logger.info(`(SEARCH/AION) Removing page from index: ${page.path}`)
    await this._deleteDocument(page)
  },

  /**
   * RENAME
   * 
   * @param {Object} page Page to rename
   */
  async renamed(page) {
    WIKI.logger.info(`(SEARCH/AION) Renaming indexed page: ${page.path} -> ${page.destinationPath}`)

    // Delete old version using original hash
    await this._deleteDocument({
      ...page,
      hash: page.hash // Use original hash for deletion
    })

    // Index new version with destination data
    const renamedPage = {
      ...page,
      path: page.destinationPath,
      localeCode: page.destinationLocaleCode,
      hash: page.destinationHash
    }
    await this._indexDocument(renamedPage, 'create')
  },

  /**
   * REBUILD INDEX
   */
  async rebuild() {
    WIKI.logger.info(`(SEARCH/AION) Rebuilding search index...`)

    let processed = 0
    let failed = 0

    try {
      // Get all published pages
      const pages = await WIKI.models.pages.query()
        .where('isPublished', true)
        .where('isPrivate', false)
        .withGraphJoined('tags')
        .select('id', 'path', 'localeCode', 'title', 'description', 'content', 'render', 'hash', 'createdAt', 'updatedAt', 'authorName')

      WIKI.logger.info(`(SEARCH/AION) Found ${pages.length} pages to index`)

      // Process pages in batches to avoid overwhelming the service
      const batchSize = 5
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize)
        const batchPromises = batch.map(async (page) => {
          try {
            await this._indexDocument(page, 'rebuild')
            processed++
            if (processed % 10 === 0) {
              WIKI.logger.info(`(SEARCH/AION) Processed ${processed}/${pages.length} pages`)
            }
          } catch (err) {
            failed++
            WIKI.logger.warn(`(SEARCH/AION) Failed to index page ${page.path}: ${err.message}`)
          }
        })

        await Promise.all(batchPromises)

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      WIKI.logger.info(`(SEARCH/AION) Index rebuild completed. Processed: ${processed}, Failed: ${failed}`)
    } catch (err) {
      WIKI.logger.error(`(SEARCH/AION) Index rebuild failed: ${err.message}`)
      throw err
    }
  },

  /**
   * Index a document through AION service
   * 
   * @param {Object} page Page object
   * @param {String} operation Operation type (create, update, rebuild)
   */
  async _indexDocument(page, operation) {
    let attempt = 0
    const maxAttempts = this.config.retryAttempts || 3

    while (attempt < maxAttempts) {
      try {
        attempt++

        // Prepare document for AION service
        const wikiDocument = {
          id: page.hash || page.id?.toString(),
          title: page.title || '',
          content: page.content || page.render || '',
          path: page.path || '',
          locale: page.localeCode || 'en',
          tags: page.tags ? page.tags.map(tag => typeof tag === 'string' ? tag : tag.tag) : [],
          created_at: this._formatDate(page.createdAt),
          updated_at: this._formatDate(page.updatedAt),
          author: page.authorName || 'wiki-system'
        }

        // Validate document data
        if (!wikiDocument.id) {
          throw new Error('Missing document ID')
        }
        if (!wikiDocument.content.trim()) {
          WIKI.logger.warn(`(SEARCH/AION) Skipping empty document: ${page.path}`)
          return true
        }

        // Choose endpoint based on operation
        let endpoint, method
        if (operation === 'update') {
          endpoint = '/update-document'
          method = 'post'
        } else {
          endpoint = '/index-document'
          method = 'post'
        }

        // Call AION indexing service
        const response = await axios({
          method: method,
          url: `${this.config.serviceUrl}${endpoint}`,
          data: wikiDocument,
          timeout: this.config.indexingTimeout || 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.data.status === 'processing') {
          WIKI.logger.info(`(SEARCH/AION) Document ${page.path} queued for ${operation}`)
          return true
        } else if (response.data.status === 'error') {
          throw new Error(`AION service error: ${response.data.error_details || 'Unknown error'}`)
        }

        return true

      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
        WIKI.logger.warn(`(SEARCH/AION) Indexing attempt ${attempt}/${maxAttempts} failed for ${page.path}: ${errorMsg}`)

        if (attempt >= maxAttempts) {
          if (this.config.logIndexingErrors) {
            WIKI.logger.error(`(SEARCH/AION) Failed to index ${page.path} after ${maxAttempts} attempts`)
            WIKI.logger.error(`(SEARCH/AION) Final error: ${errorMsg}`)
          }

          // Don't throw error to prevent breaking Wiki.js operations
          return false
        }

        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  },

  /**
   * Delete a document from AION service
   * 
   * @param {Object} page Page object
   */
  async _deleteDocument(page) {
    let attempt = 0
    const maxAttempts = this.config.retryAttempts || 3

    while (attempt < maxAttempts) {
      try {
        attempt++

        const documentId = page.hash || page.id?.toString()

        if (!documentId) {
          WIKI.logger.warn(`(SEARCH/AION) Cannot delete document without ID: ${page.path}`)
          return false
        }

        // Call AION deletion service
        const response = await axios.delete(
          `${this.config.serviceUrl}/delete-document/${encodeURIComponent(documentId)}`,
          {
            timeout: this.config.apiTimeout || 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.data.status === 'processing') {
          WIKI.logger.info(`(SEARCH/AION) Document ${page.path} queued for deletion`)
          return true
        } else if (response.data.status === 'error') {
          throw new Error(`AION service error: ${response.data.error_details || 'Unknown error'}`)
        }

        return true

      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
        WIKI.logger.warn(`(SEARCH/AION) Deletion attempt ${attempt}/${maxAttempts} failed for ${page.path}: ${errorMsg}`)

        if (attempt >= maxAttempts) {
          if (this.config.logIndexingErrors) {
            WIKI.logger.error(`(SEARCH/AION) Failed to delete ${page.path} after ${maxAttempts} attempts`)
            WIKI.logger.error(`(SEARCH/AION) Final error: ${errorMsg}`)
          }

          return false
        }

        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  },

  /**
   * Format date to ISO string, handling various input types
   * 
   * @param {Date|string|number} date Date input
   * @returns {string} ISO date string
   */
  _formatDate(date) {
    if (!date) {
      return new Date().toISOString()
    }

    if (date instanceof Date) {
      return date.toISOString()
    }

    if (typeof date === 'string') {
      // If already ISO string, return as is
      if (date.includes('T') && date.includes('Z')) {
        return date
      }
      // Try to parse string date
      try {
        return new Date(date).toISOString()
      } catch (e) {
        return new Date().toISOString()
      }
    }

    if (typeof date === 'number') {
      return new Date(date).toISOString()
    }

    return new Date().toISOString()
  },

  /**
   * Semantic search using AION service
   * 
   * @param {String} query Search query
   * @param {Object} opts Search options
   */
  async _semanticSearch(query, opts) {
    let attempt = 0
    const maxAttempts = 2

    while (attempt < maxAttempts) {
      try {
        attempt++

        // Prepare search request
        const searchRequest = {
          query: query,
          locale: opts.locale || 'en',
          limit: opts.limit || this.config.maxResults || 5,
          enable_multi_query: false,
          path_filter: opts.path || null
        }

        WIKI.logger.debug(`(SEARCH/AION) Search request: ${JSON.stringify(searchRequest)}`)

        // Call AION search service
        const response = await axios.post(
          `${this.config.serviceUrl}/search`,
          searchRequest,
          {
            timeout: this.config.apiTimeout || 15000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.status === 200 && response.data) {
          const searchResults = response.data

          WIKI.logger.info(`(SEARCH/AION) Semantic search completed: ${searchResults.total_found} results in ${searchResults.processing_time_ms}ms`)
          WIKI.logger.info(`(SEARCH/AION) Strategy: ${searchResults.search_strategy}`)

          const wikiResults = searchResults.results.map(result => ({
            id: result.id,
            path: result.path,
            title: result.title,
            description: this._extractDescription(result.content_preview),
            locale: result.metadata.locale || opts.locale || 'en',
            offset: result.chunk_info?.start_offset || result.offset || 0  // <- AGGIUNGI QUESTA RIGA
          }))

          return {
            results: wikiResults,
            suggestions: this._generateSuggestions(query, wikiResults),
            totalHits: searchResults.total_found,
            // Mappare ai nomi del schema GraphQL
            aionInfo: {
              strategy: searchResults.search_strategy,
              processingTime: searchResults.processing_time_ms,
              serviceUsed: 'aion_semantic'
            }
          }
        } else {
          throw new Error(`Unexpected response status: ${response.status}`)
        }

      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error'
        WIKI.logger.warn(`(SEARCH/AION) Semantic search attempt ${attempt}/${maxAttempts} failed: ${errorMsg}`)

        if (attempt >= maxAttempts) {
          WIKI.logger.error(`(SEARCH/AION) Semantic search failed after ${maxAttempts} attempts`)
          throw new Error(`AION semantic search failed: ${errorMsg}`)
        }

        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  },

  /**
   * Extract description from content preview
   * 
   * @param {String} content Content preview
   */
  _extractDescription(content) {
    if (!content) return ''

    // Clean markdown and get first sentence
    const cleaned = content
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .trim()

    // Get first sentence up to 150 chars
    const firstSentence = cleaned.split(/[.!?]/)[0] || cleaned
    return firstSentence.length > 150
      ? firstSentence.substring(0, 147) + '...'
      : firstSentence
  },

  /**
   * Generate search suggestions based on results
   * 
   * @param {String} originalQuery Original search query
   * @param {Array} results Search results
   */
  _generateSuggestions(originalQuery, results) {
    const suggestions = []

    // Extract common terms from high-scoring results
    const topResults = results.filter(r => r.score > 0.5).slice(0, 5)
    const commonWords = new Set()

    topResults.forEach(result => {
      const words = result.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !originalQuery.toLowerCase().includes(word))
      words.forEach(word => commonWords.add(word))
    })

    // Generate suggestions from common words
    Array.from(commonWords).slice(0, 3).forEach(word => {
      suggestions.push(`${originalQuery} ${word}`)
    })

    return suggestions
  },
  async _fallbackQuery(q, opts) {
    WIKI.logger.debug(`(SEARCH/AION) Using fallback database search`)

    const results = await WIKI.models.pages.query()
      .column('pages.id', 'title', 'description', 'path', 'localeCode as locale')
      .withGraphJoined('tags')
      .modifyGraph('tags', builder => {
        builder.select('tag')
      })
      .where(builder => {
        builder.where('isPublished', true)
        builder.where('isPrivate', false)
        if (opts.locale) {
          builder.andWhere('localeCode', opts.locale)
        }
        if (opts.path) {
          builder.andWhere('path', 'like', `${opts.path}%`)
        }
        builder.andWhere(builderSub => {
          if (WIKI.config.db.type === 'postgres') {
            builderSub.where('title', 'ILIKE', `%${q}%`)
            builderSub.orWhere('description', 'ILIKE', `%${q}%`)
            builderSub.orWhere('path', 'ILIKE', `%${q.toLowerCase()}%`)
          } else {
            builderSub.where('title', 'LIKE', `%${q}%`)
            builderSub.orWhere('description', 'LIKE', `%${q}%`)
            builderSub.orWhere('path', 'LIKE', `%${q.toLowerCase()}%`)
          }
        })
      })
      .limit(this.config.maxResults || 50)

    return {
      results,
      suggestions: [],
      totalHits: results.length
    }
  }
}