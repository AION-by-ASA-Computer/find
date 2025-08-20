// server/modules/editor/tiptap/ai-integration.js

const axios = require('axios')

/**
 * AI Integration Module for TipTap Notion-like Editor
 * Supporta OpenAI, Anthropic Claude, e provider personalizzati
 */
class AIIntegration {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled || false,
      provider: config.provider || 'openai', // 'openai', 'anthropic', 'custom'
      apiKey: config.apiKey || process.env.AI_API_KEY,
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      ...config
    }
    
    this.endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      custom: config.customEndpoint || ''
    }
  }

  /**
   * Migliora il testo selezionato usando AI
   */
  async improveText(text, context = {}) {
    if (!this.config.enabled || !text) {
      throw new Error('AI not enabled or no text provided')
    }

    const prompt = this.buildPrompt('improve', text, context)
    return await this.callAI(prompt)
  }

  /**
   * Continua la scrittura dal punto del cursore
   */
  async continueWriting(text, context = {}) {
    if (!this.config.enabled) {
      throw new Error('AI not enabled')
    }

    const prompt = this.buildPrompt('continue', text, context)
    return await this.callAI(prompt)
  }

  /**
   * Crea un riassunto del testo
   */
  async summarizeText(text, context = {}) {
    if (!this.config.enabled || !text) {
      throw new Error('AI not enabled or no text provided')
    }

    const prompt = this.buildPrompt('summarize', text, context)
    return await this.callAI(prompt)
  }

  /**
   * Traduce il testo
   */
  async translateText(text, targetLanguage = 'english', context = {}) {
    if (!this.config.enabled || !text) {
      throw new Error('AI not enabled or no text provided')
    }

    const prompt = this.buildPrompt('translate', text, { ...context, targetLanguage })
    return await this.callAI(prompt)
  }

  /**
   * Genera contenuto basato su una descrizione
   */
  async generateContent(description, type = 'paragraph', context = {}) {
    if (!this.config.enabled || !description) {
      throw new Error('AI not enabled or no description provided')
    }

    const prompt = this.buildPrompt('generate', description, { ...context, type })
    return await this.callAI(prompt)
  }

  /**
   * Costruisce il prompt basato sul tipo di azione
   */
  buildPrompt(action, text, context = {}) {
    const prompts = {
      improve: `Migliora il seguente testo mantenendo il significato originale ma rendendolo più chiaro, coinvolgente e ben scritto. Restituisci solo il testo migliorato senza spiegazioni aggiuntive:\n\n${text}`,
      
      continue: `Continua la scrittura del seguente testo in modo naturale e coerente. Il testo deve seguire lo stesso stile e tono. Scrivi circa 2-3 frasi aggiuntive:\n\n${text}`,
      
      summarize: `Crea un riassunto conciso e chiaro del seguente testo. Il riassunto deve catturare i punti principali in modo conciso:\n\n${text}`,
      
      translate: `Traduci il seguente testo in ${context.targetLanguage}. Mantieni il tono e lo stile originali:\n\n${text}`,
      
      generate: `Genera un ${context.type} basato sulla seguente descrizione: ${text}. Il contenuto deve essere ben strutturato e di alta qualità.`
    }

    return prompts[action] || text
  }

  /**
   * Effettua la chiamata all'API AI
   */
  async callAI(prompt) {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt)
        case 'anthropic':
          return await this.callAnthropic(prompt)
        case 'custom':
          return await this.callCustomAI(prompt)
        default:
          throw new Error(`Provider ${this.config.provider} not supported`)
      }
    } catch (error) {
      WIKI.logger.error('AI Integration Error:', error)
      throw new Error(`AI service error: ${error.message}`)
    }
  }

  /**
   * Chiamata API OpenAI
   */
  async callOpenAI(prompt) {
    const response = await axios.post(this.endpoints.openai, {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Sei un assistente esperto nella scrittura e editing di testi. Rispondi sempre in italiano quando non specificato diversamente.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    return response.data.choices[0].message.content.trim()
  }

  /**
   * Chiamata API Anthropic Claude
   */
  async callAnthropic(prompt) {
    const response = await axios.post(this.endpoints.anthropic, {
      model: this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: this.config.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, {
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    })

    return response.data.content[0].text.trim()
  }

  /**
   * Chiamata API personalizzata
   */
  async callCustomAI(prompt) {
    if (!this.config.customEndpoint) {
      throw new Error('Custom endpoint not configured')
    }

    const response = await axios.post(this.config.customEndpoint, {
      prompt: prompt,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    return response.data.text || response.data.content || response.data.result || ''
  }

  /**
   * Valida la configurazione AI
   */
  validateConfig() {
    if (!this.config.enabled) {
      return { valid: false, message: 'AI integration is disabled' }
    }

    if (!this.config.apiKey) {
      return { valid: false, message: 'API key is required' }
    }

    if (!this.endpoints[this.config.provider]) {
      return { valid: false, message: `Provider ${this.config.provider} is not supported` }
    }

    return { valid: true, message: 'Configuration is valid' }
  }

  /**
   * Test della connessione AI
   */
  async testConnection() {
    try {
      const result = await this.improveText('Questo è un test.')
      return { 
        success: true, 
        message: 'AI connection successful',
        result: result.substring(0, 100) + '...'
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message 
      }
    }
  }
}

module.exports = AIIntegration