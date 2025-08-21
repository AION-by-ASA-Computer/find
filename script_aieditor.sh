#!/bin/bash

# AIEditor Installation Script for Wiki.js - Metodo Corretto
# Basato sulla documentazione ufficiale di AIEditor

set -e

echo "================================================="
echo "  AIEditor Installation for Wiki.js (Correct)"
echo "================================================="

# Verifica directory Wiki.js
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trovato. Esegui dalla directory root di Wiki.js"
    exit 1
fi

if ! grep -q "wiki" package.json; then
    echo "❌ Questa non sembra essere la directory di Wiki.js"
    exit 1
fi

echo "✅ Directory Wiki.js verificata"

# Backup
BACKUP_DIR="backups/aieditor-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Backup creato in: $BACKUP_DIR"

# Step 1: Installa AIEditor
echo ""
echo "1️⃣ Installazione AIEditor..."
echo "   Seguendo la documentazione ufficiale: npm install aieditor"

npm install aieditor --save

# Verifica installazione
if [ ! -d "node_modules/aieditor" ]; then
    echo "❌ Installazione fallita"
    exit 1
fi

echo "✅ AIEditor installato correttamente"

# Verifica struttura del pacchetto
echo ""
echo "📋 Struttura pacchetto AIEditor:"
ls -la "node_modules/aieditor/" | head -5
if [ -d "node_modules/aieditor/dist" ]; then
    echo "📋 File in dist/:"
    ls -la "node_modules/aieditor/dist/" | head -5
fi

# Step 2: Crea modulo Wiki.js 
echo ""
echo "2️⃣ Creazione modulo Wiki.js..."

MODULE_DIR="server/modules/editor/aieditor"
mkdir -p "$MODULE_DIR"

# definition.yml
cat > "$MODULE_DIR/definition.yml" << 'EOF'
key: aieditor
title: AI Editor
description: Next-generation rich text editor powered by AI
contentType: html
author: aieditor-team
website: https://aieditor.dev
props:
  aiProvider:
    type: String
    title: AI Provider
    hint: AI service provider (openai, anthropic, gemini, custom)
    default: openai
    order: 1
  aiApiKey:
    type: String
    title: AI API Key
    hint: API key for AI services (leave empty to disable AI features)
    default: ""
    order: 2
  aiModel:
    type: String
    title: AI Model
    hint: AI model to use (e.g., gpt-3.5-turbo, claude-3-sonnet)
    default: "gpt-3.5-turbo"
    order: 3
  placeholder:
    type: String
    title: Placeholder Text
    hint: Text to show when editor is empty
    default: "Click to Input Content..."
    order: 4
  height:
    type: String
    title: Editor Height
    hint: Height of the editor (e.g., 600px, 100vh)
    default: "600px"
    order: 5
EOF

# package.json del modulo
cat > "$MODULE_DIR/package.json" << 'EOF'
{
  "name": "wiki-aieditor-module",
  "version": "1.0.0",
  "description": "AIEditor module for Wiki.js",
  "main": "index.js",
  "dependencies": {
    "aieditor": "^1.0.0"
  },
  "keywords": ["aieditor", "ai", "editor", "wiki"],
  "author": "Wiki.js Community",
  "license": "MIT"
}
EOF

# index.js del modulo  
cat > "$MODULE_DIR/index.js" << 'EOF'
module.exports = {
  async init(moduleConfig) {
    WIKI.logger.info('AIEditor module initialized')
    
    const aiEnabled = moduleConfig.aiApiKey && moduleConfig.aiApiKey.trim().length > 0
    
    if (aiEnabled) {
      WIKI.logger.info(`AIEditor: AI features enabled with provider: ${moduleConfig.aiProvider}`)
    } else {
      WIKI.logger.info('AIEditor: AI features disabled (no API key provided)')
    }
    
    return {
      config: moduleConfig,
      aiEnabled
    }
  },

  async convertFrom(content, fromEditor) {
    // AIEditor supporta HTML nativamente
    switch (fromEditor) {
      case 'markdown':
        // AIEditor può gestire markdown direttamente
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
        // Conversione base HTML -> Markdown
        return content
          .replace(/<h([1-6])>(.*?)<\/h\1>/gi, (match, level, text) => '#'.repeat(parseInt(level)) + ' ' + text + '\n\n')
          .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<em>(.*?)<\/em>/gi, '*$1*')
          .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
          .trim()
      case 'ckeditor':
      case 'tiptap':
        return content
      case 'code':
        return content.replace(/<[^>]*>/g, '')
      default:
        return content
    }
  }
}
EOF

# Step 3: Installa dipendenze del modulo
echo ""
echo "3️⃣ Installazione dipendenze modulo..."
cd "$MODULE_DIR"
npm install
cd "../../../.."

# Step 4: Crea componente Vue
echo ""
echo "4️⃣ Creazione componente Vue..."

# Backup del componente esistente se presente
if [ -f "client/components/editor/editor-aieditor.vue" ]; then
    cp "client/components/editor/editor-aieditor.vue" "$BACKUP_DIR/"
fi

# Il componente è già stato creato nell'artifact sopra, qui aggiungiamo solo un placeholder
echo "✅ Sostituisci client/components/editor/editor-aieditor.vue con il componente dall'artifact"

# Step 5: Registra il componente in editor.vue
echo ""
echo "5️⃣ Registrazione componente..."

if [ -f "client/components/editor.vue" ]; then
    cp "client/components/editor.vue" "$BACKUP_DIR/"
    
    # Verifica se già registrato
    if ! grep -q "editorAieditor" "client/components/editor.vue"; then
        # Trova la riga con editorTiptap e aggiungi dopo
        if grep -q "editorTiptap" "client/components/editor.vue"; then
            sed -i.bak '/editorTiptap.*vue/a\
    editorAieditor: () => import("./editor/editor-aieditor.vue"),' "client/components/editor.vue"
            echo "✅ AIEditor registrato in editor.vue"
        else
            echo "⚠️  Aggiungi manualmente questa riga in client/components/editor.vue:"
            echo "   editorAieditor: () => import('./editor/editor-aieditor.vue'),"
        fi
    else
        echo "✅ AIEditor già registrato in editor.vue"
    fi
else
    echo "❌ File client/components/editor.vue non trovato"
fi

# Step 6: Verifica finale
echo ""
echo "6️⃣ Verifica installazione..."

checks=0
total=4

if [ -d "node_modules/aieditor" ]; then
    echo "✅ Pacchetto AIEditor installato"
    ((checks++))
else
    echo "❌ Pacchetto AIEditor mancante"
fi

if [ -f "$MODULE_DIR/definition.yml" ]; then
    echo "✅ Modulo Wiki.js creato"
    ((checks++))
else
    echo "❌ Modulo Wiki.js mancante"
fi

if [ -f "client/components/editor/editor-aieditor.vue" ]; then
    echo "✅ Componente Vue presente"
    ((checks++))
else
    echo "❌ Componente Vue mancante"
fi

if grep -q "editorAieditor" "client/components/editor.vue" 2>/dev/null; then
    echo "✅ Componente registrato"
    ((checks++))
else
    echo "❌ Componente non registrato"
fi

echo ""
echo "================================================="
echo "  Installazione completata: $checks/$total checks"
echo "================================================="

if [ $checks -eq $total ]; then
    echo ""
    echo "🎉 Installazione completata con successo!"
    echo ""
    echo "📋 Prossimi passi:"
    echo "1. Sostituisci client/components/editor/editor-aieditor.vue con il componente corretto dall'artifact"
    echo "2. Riavvia Wiki.js: npm run dev"
    echo "3. Vai in Admin → Editors"
    echo "4. Abilita 'AI Editor'"
    echo "5. Configura API key AI nelle impostazioni"
    echo ""
    echo "📖 Secondo la documentazione ufficiale di AIEditor:"
    echo "   - Import: import {AiEditor} from 'aieditor'"
    echo "   - CSS: import 'aieditor/dist/style.css'"
    echo "   - Inizializzazione: new AiEditor({ element, config })"
    echo ""
    echo "🔍 Il componente usa import dinamico per compatibilità Webpack"
else
    echo ""
    echo "⚠️  Installazione parzialmente completata"
    echo "   Completa manualmente i passaggi mancanti"
fi

echo ""
echo "💾 Backup salvato in: $BACKUP_DIR"
echo "🔙 Per rollback: rm -rf server/modules/editor/aieditor && git checkout client/components/editor/"