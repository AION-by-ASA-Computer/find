module.exports = {
  async init(moduleConfig) {
    WIKI.logger.info('AIEditor module initialized')
    
    const aiEnabled = moduleConfig.aiApiKey && moduleConfig.aiApiKey.trim().length > 0
    
    if (aiEnabled) {
      WIKI.logger.info(`AIEditor: AI features enabled with provider: ${moduleConfig.aiProvider}`)
    } else {
      WIKI.logger.warn('AIEditor: AI features disabled - no API key provided')
    }
    
    return {
      config: moduleConfig,
      aiEnabled,
      features: {
        aiMenu: moduleConfig.enableAIMenu && aiEnabled,
        theme: moduleConfig.theme || 'light'
      }
    }
  },

  async convertFrom(content, fromEditor) {
    switch (fromEditor) {
      case 'markdown':
        return content
      case 'ckeditor':
      case 'tiptap':
        return content
      case 'code':
        return `<p>${content}</p>`
      default:
        return content
    }
  },

  async convertTo(content, toEditor) {
    switch (toEditor) {
      case 'markdown':
        return this.htmlToMarkdown(content)
      case 'ckeditor':
      case 'tiptap':
        return content
      case 'code':
        return content.replace(/<[^>]*>/g, '')
      default:
        return content
    }
  },

  htmlToMarkdown(html) {
    return html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
      .trim()
  }
}
