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
      WIKI.logger.info(`(SEARCH/AION) Executing search query: ${q}`)
      
      // For now, fallback to database search
      // TODO: Implement semantic search via AION service
      if (this.config.fallbackSearch) {
        return await this._fallbackQuery(q, opts)
      } else {
        return {
          results: [],
          suggestions: [],
          totalHits: 0
        }
      }
    } catch (err) {
      WIKI.logger.warn(`(SEARCH/AION) Query failed: ${err.message}`)
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
    await this._indexDocument(page, 'created')
  },

  /**
   * UPDATE
   * 
   * @param {Object} page Page to update
   */
  async updated(page) {
    WIKI.logger.info(`(SEARCH/AION) Updating indexed page: ${page.path}`)
    await this._indexDocument(page, 'updated')

    //TODO: Handle content updates, delete old content if necessary
    // For now, just re-index the entire page
  },

  /**
   * DELETE
   * 
   * @param {Object} page Page to delete
   */
  async deleted(page) {
    WIKI.logger.info(`(SEARCH/AION) Removing page from index: ${page.path}`)
    // TODO: Implement deletion in AION service
    // For now, just log the action
  },

  /**
   * RENAME
   * 
   * @param {Object} page Page to rename
   */
  async renamed(page) {
    WIKI.logger.info(`(SEARCH/AION) Renaming indexed page: ${page.path} -> ${page.destinationPath}`)
    
    // Delete old version
    await this.deleted(page)
    
    // Index new version
    const renamedPage = {
      ...page,
      path: page.destinationPath,
      localeCode: page.destinationLocaleCode,
      hash: page.destinationHash
    }
    await this._indexDocument(renamedPage, 'renamed')
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
        .select('id', 'path', 'localeCode', 'title', 'description', 'content', 'render', 'hash', 'createdAt', 'updatedAt')

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
        await new Promise(resolve => setTimeout(resolve, 100))
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
   * @param {String} operation Operation type (created, updated, etc.)
   */
  async _indexDocument(page, operation) {
    let attempt = 0
    const maxAttempts = this.config.retryAttempts || 3

    while (attempt < maxAttempts) {
      try {
        attempt++
        
        // Prepare document for AION service
        const wikiDocument = {
          id: page.hash || page.id,
          title: page.title || '',
          content: page.content || page.render || '',
          path: page.path || '',
          locale: page.localeCode || 'en',
          tags: page.tags ? page.tags.map(tag => tag.tag) : [],
          created_at: page.createdAt ? (page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt) : new Date().toISOString(),
          updated_at: page.updatedAt ? (page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt) : new Date().toISOString(),
          author: page.authorName || 'wiki-system'
        }

        // Call AION indexing service (async endpoint)
        const response = await axios.post(
          `${this.config.serviceUrl}/index-document`,
          wikiDocument,
          {
            timeout: this.config.indexingTimeout || 30000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.data.status === 'processing') {
          WIKI.logger.info(`(SEARCH/AION) Document ${page.path} queued for indexing`)
          return true
        } else if (response.data.status === 'error') {
          throw new Error(`AION service error: ${response.data.error_details}`)
        }

        return true

      } catch (err) {
        WIKI.logger.warn(`(SEARCH/AION) Indexing attempt ${attempt}/${maxAttempts} failed for ${page.path}: ${err.message}`)
        
        if (attempt >= maxAttempts) {
          if (this.config.logIndexingErrors) {
            WIKI.logger.error(`(SEARCH/AION) Failed to index ${page.path} after ${maxAttempts} attempts`)
            WIKI.logger.error(`(SEARCH/AION) Error details: ${err.message}`)
          }
          
          // Don't throw error to prevent breaking Wiki.js operations
          // Just log and continue
          return false
        }
        
        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  },

  /**
   * Fallback to database search when AION service is unavailable
   * 
   * @param {String} q Query string
   * @param {Object} opts Additional options
   */
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