#!/bin/sh

# TipTap Editor - Automated Deploy Script for Wiki.js (POSIX Compatible)
# Version: 1.0.1
# Author: Wiki.js Community

# Configuration
WIKI_ROOT=$(pwd)
BACKUP_DIR="${WIKI_ROOT}/backups/tiptap-integration-$(date +%Y%m%d-%H%M%S)"
TIPTAP_MODULE_DIR="${WIKI_ROOT}/server/modules/editor/tiptap"
VUE_COMPONENT_FILE="${WIKI_ROOT}/client/components/editor/editor-tiptap.vue"

# Functions
log_info() {
    printf "\033[0;34m[INFO]\033[0m %s\n" "$1"
}

log_success() {
    printf "\033[0;32m[SUCCESS]\033[0m %s\n" "$1"
}

log_warning() {
    printf "\033[1;33m[WARNING]\033[0m %s\n" "$1"
}

log_error() {
    printf "\033[0;31m[ERROR]\033[0m %s\n" "$1"
}

# Error handling function
handle_error() {
    log_error "Installation failed at step: $1"
    log_error "Check the logs and backup at: $BACKUP_DIR"
    exit 1
}

# Check if we're in a Wiki.js directory
check_wiki_directory() {
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        handle_error "directory_check"
    fi
    
    if ! grep -q "wiki" package.json; then
        log_error "This doesn't appear to be a Wiki.js directory"
        log_error "Please run this script from the Wiki.js root directory"
        handle_error "directory_check"
    fi
    
    log_success "Wiki.js directory detected"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    mkdir -p "$BACKUP_DIR" || handle_error "backup_creation"
    
    # Backup existing editor files if they exist
    if [ -f "${WIKI_ROOT}/server/models/editors.js" ]; then
        cp "${WIKI_ROOT}/server/models/editors.js" "$BACKUP_DIR/" || handle_error "backup_editors"
        log_success "Backed up editors.js"
    fi
    
    if [ -f "${WIKI_ROOT}/client/components/editor.vue" ]; then
        cp "${WIKI_ROOT}/client/components/editor.vue" "$BACKUP_DIR/" || handle_error "backup_editor_vue"
        log_success "Backed up editor.vue"
    fi
    
    # Backup webpack config if it exists
    if [ -f "${WIKI_ROOT}/webpack.config.js" ]; then
        cp "${WIKI_ROOT}/webpack.config.js" "$BACKUP_DIR/" || handle_error "backup_webpack"
        log_success "Backed up webpack.config.js"
    fi
    
    log_success "Backup created at: $BACKUP_DIR"
}

# Check if npm is available
check_npm() {
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm is not installed or not in PATH"
        handle_error "npm_check"
    fi
    log_success "npm found"
}

# Install Node.js dependencies
install_dependencies() {
    log_info "Installing TipTap dependencies..."
    
    # Check if npm is available
    check_npm
    
    # Add TipTap packages to main package.json (optional, for development)
    npm install --legacy-peer-deps --save-optional \
        "@tiptap/core@^2.2.0" \
        "@tiptap/starter-kit@^2.2.0" \
        "@tiptap/extension-image@^2.2.0" \
        "@tiptap/extension-link@^2.2.0" \
        "@tiptap/extension-table@^2.2.0" \
        "@tiptap/extension-table-row@^2.2.0" \
        "@tiptap/extension-table-header@^2.2.0" \
        "@tiptap/extension-table-cell@^2.2.0" \
        "@tiptap/extension-text-align@^2.2.0" \
        "@tiptap/extension-highlight@^2.2.0" \
        "@tiptap/extension-underline@^2.2.0" \
        "@tiptap/extension-character-count@^2.2.0" || handle_error "dependency_installation"
    
    log_success "Dependencies installed"
}

# Create TipTap module structure
create_module_structure() {
    log_info "Creating TipTap module structure..."
    
    # Create module directory
    mkdir -p "$TIPTAP_MODULE_DIR" || handle_error "module_directory_creation"
    
    # Create definition.yml
    cat > "$TIPTAP_MODULE_DIR/definition.yml" << 'EOF'
key: tiptap
title: TipTap Editor
description: Modern WYSIWYG editor based on TipTap and ProseMirror
contentType: html
author: community
props:
  extensions:
    type: Array
    title: Extensions
    hint: List of TipTap extensions to enable
    default: 
      - StarterKit
      - Image
      - Link
      - Table
      - TextAlign
      - Highlight
    order: 1
  placeholder:
    type: String
    title: Placeholder Text
    hint: Text to show when editor is empty
    default: "Start typing your content here..."
    order: 2
  showCharacterCount:
    type: Boolean
    title: Show Character Count
    hint: Display character and word count in status bar
    default: true
    order: 3
  toolbar:
    type: Array
    title: Toolbar Items
    hint: List of toolbar items to display
    default:
      - bold
      - italic
      - underline
      - strike
      - code
      - heading
      - bulletList
      - orderedList
      - blockquote
      - codeBlock
      - image
      - link
      - table
      - textAlign
      - highlight
      - undo
      - redo
    order: 4
EOF

    if [ $? -ne 0 ]; then
        handle_error "definition_yml_creation"
    fi

    # Create package.json for module
    cat > "$TIPTAP_MODULE_DIR/package.json" << 'EOF'
{
  "name": "wiki-tiptap-editor",
  "version": "1.0.0",
  "description": "TipTap editor module for Wiki.js",
  "main": "index.js",
  "dependencies": {
    "@tiptap/core": "^2.2.0",
    "@tiptap/starter-kit": "^2.2.0",
    "@tiptap/extension-image": "^2.2.0",
    "@tiptap/extension-link": "^2.2.0",
    "@tiptap/extension-table": "^2.2.0",
    "@tiptap/extension-table-row": "^2.2.0",
    "@tiptap/extension-table-header": "^2.2.0",
    "@tiptap/extension-table-cell": "^2.2.0",
    "@tiptap/extension-text-align": "^2.2.0",
    "@tiptap/extension-highlight": "^2.2.0",
    "@tiptap/extension-underline": "^2.2.0",
    "@tiptap/extension-character-count": "^2.2.0"
  },
  "peerDependencies": {
    "vue": "^2.6.0"
  },
  "keywords": ["tiptap", "editor", "wysiwyg", "prosemirror", "wiki"],
  "author": "Wiki.js Community",
  "license": "MIT"
}
EOF

    if [ $? -ne 0 ]; then
        handle_error "package_json_creation"
    fi

    # Create index.js for module
    cat > "$TIPTAP_MODULE_DIR/index.js" << 'EOF'
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
EOF

    if [ $? -ne 0 ]; then
        handle_error "index_js_creation"
    fi

    log_success "Module structure created"
}

# Install module dependencies
install_module_dependencies() {
    log_info "Installing module dependencies..."
    
    # Save current directory
    original_dir=$(pwd)
    
    # Change to module directory
    cd "$TIPTAP_MODULE_DIR" || handle_error "module_directory_change"
    
    # Install dependencies
    npm install || handle_error "module_dependency_installation"
    
    # Return to original directory
    cd "$original_dir" || handle_error "directory_return"
    
    log_success "Module dependencies installed"
}

# Create Vue component placeholder
create_vue_component_placeholder() {
    log_info "Creating Vue component placeholder..."
    
    # Create the directory if it doesn't exist
    mkdir -p "$(dirname "$VUE_COMPONENT_FILE")" || handle_error "vue_component_directory"
    
    # Create a placeholder file with instructions
    cat > "$VUE_COMPONENT_FILE" << 'EOF'
<!-- 
TipTap Vue Component Placeholder

This file needs to be replaced with the actual TipTap Vue component.
The component code is available in the artifacts provided with the integration.

To complete the integration:
1. Copy the full TipTap Vue component code from the artifacts
2. Replace this entire file with that content
3. Restart the Wiki.js server

Component should include:
- Template with toolbar and editor area
- Script with TipTap editor initialization
- Styles for proper theming
-->

<template>
  <div class="editor-tiptap-placeholder">
    <h3>TipTap Editor - Integration Incomplete</h3>
    <p>Please replace this file with the actual TipTap Vue component.</p>
  </div>
</template>

<script>
export default {
  name: 'EditorTiptap',
  props: {
    save: {
      type: Function,
      default: () => {}
    }
  },
  mounted() {
    console.warn('TipTap Editor: Vue component placeholder loaded. Please replace with actual component.')
  }
}
</script>

<style>
.editor-tiptap-placeholder {
  padding: 20px;
  text-align: center;
  background: #f0f0f0;
  border: 2px dashed #ccc;
  margin: 20px;
}
</style>
EOF

    if [ $? -ne 0 ]; then
        handle_error "vue_component_placeholder_creation"
    fi
    
    log_success "Vue component placeholder created"
    log_warning "IMPORTANT: Replace $VUE_COMPONENT_FILE with the actual TipTap component!"
}

# Run validation tests
run_tests() {
    log_info "Running integration tests..."
    
    # Check if module directory was created
    if [ -d "$TIPTAP_MODULE_DIR" ]; then
        log_success "✓ Module directory created"
    else
        log_error "✗ Module directory not found"
        return 1
    fi
    
    # Check if definition.yml exists
    if [ -f "$TIPTAP_MODULE_DIR/definition.yml" ]; then
        log_success "✓ Module definition created"
    else
        log_error "✗ Module definition not found"
        return 1
    fi
    
    # Check if package.json exists
    if [ -f "$TIPTAP_MODULE_DIR/package.json" ]; then
        log_success "✓ Module package.json created"
    else
        log_error "✗ Module package.json not found"
        return 1
    fi
    
    # Check if dependencies were installed
    if [ -d "$TIPTAP_MODULE_DIR/node_modules" ]; then
        log_success "✓ Module dependencies installed"
    else
        log_warning "⚠ Module dependencies not installed properly"
    fi
    
    # Check if TipTap core is available
    if [ -d "$TIPTAP_MODULE_DIR/node_modules/@tiptap/core" ]; then
        log_success "✓ TipTap core dependency available"
    else
        log_warning "⚠ TipTap core dependency not found"
    fi
    
    # Check if Vue component placeholder exists
    if [ -f "$VUE_COMPONENT_FILE" ]; then
        log_success "✓ Vue component placeholder created"
    else
        log_error "✗ Vue component file not found"
        return 1
    fi
    
    return 0
}

# Generate completion report
generate_report() {
    log_info "Generating completion report..."
    
    cat > "$BACKUP_DIR/integration-report.md" << EOF
# TipTap Integration Report

**Date**: $(date)
**Wiki.js Root**: $WIKI_ROOT
**Backup Location**: $BACKUP_DIR

## Files Created/Modified

### Module Files
- \`$TIPTAP_MODULE_DIR/definition.yml\` ✓
- \`$TIPTAP_MODULE_DIR/package.json\` ✓
- \`$TIPTAP_MODULE_DIR/index.js\` ✓
- \`$TIPTAP_MODULE_DIR/node_modules/\` ✓

### Vue Component
- \`$VUE_COMPONENT_FILE\` ⚠ (Placeholder created - needs replacement)

### Dependencies Added
- @tiptap/core@^2.2.0
- @tiptap/starter-kit@^2.2.0
- @tiptap/extension-image@^2.2.0
- @tiptap/extension-link@^2.2.0
- @tiptap/extension-table@^2.2.0
- @tiptap/extension-text-align@^2.2.0
- @tiptap/extension-highlight@^2.2.0
- @tiptap/extension-underline@^2.2.0
- @tiptap/extension-character-count@^2.2.0

## Manual Steps Required

### 1. Vue Component (CRITICAL)
Replace the placeholder at \`$VUE_COMPONENT_FILE\` with the actual TipTap Vue component from the artifacts.

### 2. Editor Registration
Update \`client/components/editor.vue\` to include:
\`\`\`javascript
editorTiptap: () => import('./editor/editor-tiptap.vue'),
\`\`\`

### 3. Default Editor Setting (Optional)
Update \`server/models/editors.js\` getDefaultEditor method:
\`\`\`javascript
case 'html':
  return 'tiptap' // Changed from 'ckeditor'
\`\`\`

### 4. Restart and Configure
1. Restart Wiki.js server: \`npm run dev\` or \`npm start\`
2. Go to Admin → Editors
3. Enable TipTap editor
4. Configure extensions and toolbar as needed

## Rollback Instructions

To rollback this integration:
1. Remove directory: \`$TIPTAP_MODULE_DIR\`
2. Restore files from: \`$BACKUP_DIR\`
3. Remove TipTap dependencies from package.json
4. Restart Wiki.js

## Support

For issues or questions:
- Check Wiki.js documentation: https://docs.requarks.io
- TipTap documentation: https://tiptap.dev
- Review this report and backup files
EOF

    if [ $? -eq 0 ]; then
        log_success "Integration report saved to: $BACKUP_DIR/integration-report.md"
    else
        log_warning "Could not create integration report"
    fi
}

# Show help
show_help() {
    cat << EOF
TipTap Editor Integration Script for Wiki.js

Usage: $0 [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be done without making changes
  --force        Force installation even if TipTap already exists

This script integrates TipTap editor into Wiki.js by:
  - Creating the TipTap module structure
  - Installing required dependencies
  - Setting up configuration files
  - Creating necessary backups

Manual steps are still required after running this script.
See the integration report for detailed instructions.
EOF
}

# Main execution
main() {
    printf "\n"
    printf "===============================================\n"
    printf "  TipTap Editor Integration for Wiki.js\n"
    printf "===============================================\n"
    printf "\n"
    
    # Pre-flight checks
    log_info "Starting TipTap integration process..."
    check_wiki_directory
    
    # Create backup before making changes
    create_backup
    
    # Installation steps
    install_dependencies
    create_module_structure
    install_module_dependencies
    create_vue_component_placeholder
    
    # Post-installation
    if run_tests; then
        generate_report
        
        printf "\n"
        printf "===============================================\n"
        printf "         Integration Completed!\n"
        printf "===============================================\n"
        printf "\n"
        log_success "TipTap editor module has been successfully integrated!"
        printf "\n"
        log_warning "CRITICAL: Complete the Vue component setup!"
        printf "\n"
        log_info "Next steps:"
        printf "  1. Replace the Vue component placeholder:\n"
        printf "     %s\n" "$VUE_COMPONENT_FILE"
        printf "     with the actual TipTap component from artifacts\n"
        printf "\n"
        printf "  2. Update client/components/editor.vue:\n"
        printf "     Add editorTiptap import to components section\n"
        printf "\n"
        printf "  3. Update server/models/editors.js (optional):\n"
        printf "     Change default HTML editor from 'ckeditor' to 'tiptap'\n"
        printf "\n"
        printf "  4. Restart Wiki.js:\n"
        printf "     npm run dev (development) or npm start (production)\n"
        printf "\n"
        printf "  5. Configure in Admin Panel:\n"
        printf "     Go to Admin → Editors → Enable TipTap\n"
        printf "\n"
        log_warning "Backup created at: $BACKUP_DIR"
        log_warning "Review integration report for detailed information"
        printf "\n"
        log_success "Happy editing with TipTap! 🎉"
    else
        log_error "Integration validation failed"
        log_error "Check the backup and logs at: $BACKUP_DIR"
        exit 1
    fi
}

# Script arguments handling
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --dry-run)
        log_info "DRY RUN MODE - No changes will be made"
        log_info "This would create:"
        printf "  - %s/\n" "$TIPTAP_MODULE_DIR"
        printf "  - Module definition and configuration files\n"
        printf "  - Install TipTap dependencies\n"
        printf "  - Create backup at: backups/tiptap-integration-%s\n" "$(date +%Y%m%d-%H%M%S)"
        printf "\n"
        log_warning "Vue component and editor registration still require manual setup"
        exit 0
        ;;
    --force)
        log_warning "Force mode enabled - existing TipTap installation will be overwritten"
        if [ -d "$TIPTAP_MODULE_DIR" ]; then
            rm -rf "$TIPTAP_MODULE_DIR"
            log_success "Removed existing TipTap module"
        fi
        ;;
    *)
        # Check if TipTap already exists
        if [ -d "$TIPTAP_MODULE_DIR" ] && [ "${1:-}" != "--force" ]; then
            log_error "TipTap module already exists at: $TIPTAP_MODULE_DIR"
            log_error "Use --force to overwrite or --help for more options"
            exit 1
        fi
        ;;
esac

# Run main installation
main "$@"