module.exports = {
  async init(moduleConfig) {
    WIKI.logger.info('TipTap Editor module initialized')
    return {
      config: moduleConfig,
      extensions: moduleConfig.extensions || ['StarterKit', 'Image', 'Link', 'Table', 'TextAlign', 'Highlight'],
      toolbar: moduleConfig.toolbar || ['bold', 'italic', 'underline', 'strike', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'image', 'link', 'table', 'textAlign', 'highlight', 'undo', 'redo']
    }
  },

  async convertFrom(content, fromEditor) {
    switch (fromEditor) {
      case 'ckeditor':
        return content
      case 'markdown':
        return await this.markdownToHtml(content)
      case 'code':
        return '<p>' + content + '</p>'
      default:
        return content
    }
  },

  async convertTo(content, toEditor) {
    switch (toEditor) {
      case 'ckeditor':
        return content
      case 'markdown':
        return await this.htmlToMarkdown(content)
      case 'code':
        return content
      default:
        return content
    }
  },

  async markdownToHtml(markdown) {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>')
  },

  async htmlToMarkdown(html) {
    return html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]*>/g, '')
  },

  validateConfig(config) {
    var validExtensions = ['StarterKit', 'Image', 'Link', 'Table', 'TextAlign', 'Highlight', 'Underline', 'CharacterCount']
    var validToolbarItems = ['bold', 'italic', 'underline', 'strike', 'code', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock', 'image', 'link', 'table', 'textAlign', 'highlight', 'undo', 'redo']

    if (config.extensions) {
      config.extensions = config.extensions.filter(function(ext) { return validExtensions.indexOf(ext) !== -1 })
    }
    if (config.toolbar) {
      config.toolbar = config.toolbar.filter(function(item) { return validToolbarItems.indexOf(item) !== -1 })
    }
    return config
  }
}
