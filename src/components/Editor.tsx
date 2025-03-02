'use client'

import { useEffect, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { useEditorStore } from '@/store/editorStore'
import * as monaco from 'monaco-editor'

// Configure Monaco Editor with language features
const configureMonaco = () => {
  // TypeScript configuration
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowJs: true,
    typeRoots: ['node_modules/@types']
  })

  // Python configuration (via Pyright)
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: async (model, position) => {
      // This would be connected to Pyright LSP in production
      return {
        suggestions: []
      }
    }
  })

  // Java configuration (via Eclipse JDT)
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: async (model, position) => {
      // This would be connected to Eclipse JDT LSP in production
      return {
        suggestions: []
      }
    }
  })
}

export default function Editor() {
  const [mounted, setMounted] = useState(false)
  const { tabs, activeTab, updateTabContent, theme } = useEditorStore()
  
  useEffect(() => {
    setMounted(true)
    configureMonaco()
  }, [])

  const activeFile = tabs.find((tab) => tab.id === activeTab)

  if (!mounted || !activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        {!mounted ? 'Loading editor...' : 'No file open'}
      </div>
    )
  }

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'cs':
        return 'csharp'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'rb':
        return 'ruby'
      case 'php':
        return 'php'
      case 'swift':
        return 'swift'
      case 'kt':
      case 'kts':
        return 'kotlin'
      case 'scala':
        return 'scala'
      default:
        return 'plaintext'
    }
  }

  return (
    <MonacoEditor
      height="100%"
      language={getLanguage(activeFile.name)}
      value={activeFile.content}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onChange={(value) => {
        if (value !== undefined) {
          updateTabContent(activeFile.id, value)
        }
      }}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: true,
        quickSuggestionsDelay: 10,
        parameterHints: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnType: true,
        formatOnPaste: true,
        codeLens: true,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        renderWhitespace: 'selection',
        links: true,
        colorDecorators: true,
        suggest: {
          showMethods: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showKeywords: true,
          showWords: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          showSnippets: true,
        }
      }}
    />
  )
} 