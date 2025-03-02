import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
  path: string
}

interface Tab {
  id: string
  path: string
  name: string
  content: string
  isDirty: boolean
}

interface EditorStore {
  // Editor state
  code: string
  language: string
  output: string
  isRunning: boolean
  isDebugging: boolean
  theme: 'light' | 'dark'
  
  // File system state
  files: FileNode[]
  currentFile: string | null
  tabs: Tab[]
  activeTab: string | null
  previewVisible: boolean
  terminalVisible: boolean
  
  // Editor actions
  setCode: (code: string) => void
  setLanguage: (language: string) => void
  setOutput: (output: string) => void
  setIsRunning: (isRunning: boolean) => void
  setIsDebugging: (isDebugging: boolean) => void
  clearOutput: () => void
  
  // File operations
  addFile: (parentPath: string, name: string, type: 'file' | 'folder') => void
  deleteFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  setCurrentFile: (path: string | null) => void
  
  // Tab operations
  openTab: (path: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  
  // UI operations
  toggleTheme: () => void
  togglePreview: () => void
  toggleTerminal: () => void
}

const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // Initial editor state
      code: '',
      language: 'javascript',
      output: '',
      isRunning: false,
      isDebugging: false,
      theme: 'dark',
      
      // Initial file system state
      files: [],
      currentFile: null,
      tabs: [],
      activeTab: null,
      previewVisible: false,
      terminalVisible: true,

      // Editor actions
      setCode: (code) => {
        set({ code })
        const state = get()
        if (state.currentFile) {
          state.updateFileContent(state.currentFile, code)
        }
      },
      setLanguage: (language) => set({ language }),
      setOutput: (output) => set((state) => ({ output: state.output + output })),
      setIsRunning: (isRunning) => set({ isRunning }),
      setIsDebugging: (isDebugging) => set({ isDebugging }),
      clearOutput: () => set({ output: '' }),

      // File operations
      addFile: (parentPath, name, type) => {
        set((state) => {
          const newFile: FileNode = {
            id: Math.random().toString(36).substring(7),
            name,
            type,
            path: `${parentPath === '/' ? '' : parentPath}/${name}`,
            content: type === 'file' ? '' : undefined,
            children: type === 'folder' ? [] : undefined,
          }

          const addToTree = (files: FileNode[]): FileNode[] => {
            if (parentPath === '/') {
              return [...files, newFile]
            }

            return files.map((file) => {
              if (file.path === parentPath && file.type === 'folder') {
                return {
                  ...file,
                  children: [...(file.children || []), newFile],
                }
              }
              if (file.children) {
                return {
                  ...file,
                  children: addToTree(file.children),
                }
              }
              return file
            })
          }

          const newFiles = addToTree(state.files)
          return { files: newFiles }
        })
      },

      deleteFile: (path) => {
        set((state) => {
          const deleteFromTree = (files: FileNode[]): FileNode[] => {
            return files.filter((file) => {
              if (file.path === path) return false
              if (file.children) {
                file.children = deleteFromTree(file.children)
              }
              return true
            })
          }

          const newFiles = deleteFromTree(state.files)
          const newTabs = state.tabs.filter((tab) => !tab.path.startsWith(path))
          const newActiveTab = newTabs.length > 0 ? newTabs[0].id : null

          return {
            files: newFiles,
            tabs: newTabs,
            activeTab: newActiveTab,
            currentFile: newActiveTab ? state.tabs.find(t => t.id === newActiveTab)?.path || null : null
          }
        })
      },

      updateFileContent: (path, content) => {
        set((state) => {
          const updateInTree = (files: FileNode[]): FileNode[] => {
            return files.map((file) => {
              if (file.path === path) {
                return { ...file, content }
              }
              if (file.children) {
                return {
                  ...file,
                  children: updateInTree(file.children),
                }
              }
              return file
            })
          }

          const newFiles = updateInTree(state.files)
          const updatedTabs = state.tabs.map((tab) =>
            tab.path === path ? { ...tab, content, isDirty: true } : tab
          )

          return { 
            files: newFiles,
            tabs: updatedTabs,
            code: state.currentFile === path ? content : state.code
          }
        })
      },

      setCurrentFile: (path) => set({ currentFile: path }),

      // Tab operations
      openTab: (path) => {
        set((state) => {
          const findFile = (files: FileNode[], targetPath: string): FileNode | undefined => {
            for (const file of files) {
              if (file.path === targetPath) return file
              if (file.children) {
                const found = findFile(file.children, targetPath)
                if (found) return found
              }
            }
            return undefined
          }

          const file = findFile(state.files, path)
          if (!file || file.type !== 'file') return state

          const existingTab = state.tabs.find((t) => t.path === path)
          const extension = file.name.split('.').pop()?.toLowerCase() || ''
          
          // Map file extensions to languages
          const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'php': 'php',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'rb': 'ruby',
            'sql': 'sql',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell',
            'vue': 'vue',
            'svelte': 'svelte',
            'dart': 'dart',
            'kt': 'kotlin',
            'swift': 'swift',
            'r': 'r',
            'lua': 'lua',
            'perl': 'perl',
            'dockerfile': 'dockerfile'
          }

          const language = languageMap[extension] || 'plaintext'

          if (existingTab) {
            return { 
              activeTab: existingTab.id,
              currentFile: path,
              code: existingTab.content,
              language
            }
          }

          const newTab: Tab = {
            id: Math.random().toString(36).substring(7),
            path,
            name: file.name,
            content: file.content || '',
            isDirty: false,
          }

          return {
            tabs: [...state.tabs, newTab],
            activeTab: newTab.id,
            currentFile: path,
            code: newTab.content,
            language
          }
        })
      },

      closeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id)
          let newActiveTab = state.activeTab

          if (state.activeTab === id) {
            const index = state.tabs.findIndex((tab) => tab.id === id)
            newActiveTab = newTabs[index - 1]?.id || newTabs[0]?.id || null
          }

          const newCurrentFile = newActiveTab 
            ? state.tabs.find(t => t.id === newActiveTab)?.path || null 
            : null

          const newCode = newCurrentFile
            ? state.tabs.find(t => t.path === newCurrentFile)?.content || ''
            : ''

          return {
            tabs: newTabs,
            activeTab: newActiveTab,
            currentFile: newCurrentFile,
            code: newCode
          }
        })
      },

      setActiveTab: (id) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === id)
          if (!tab) return state

          return {
            activeTab: id,
            currentFile: tab.path,
            code: tab.content,
            language: tab.name.split('.').pop() || 'javascript'
          }
        })
      },

      updateTabContent: (id, content) => {
        set((state) => {
          const updatedTabs = state.tabs.map((tab) =>
            tab.id === id ? { ...tab, content, isDirty: true } : tab
          )
          
          const tab = state.tabs.find(t => t.id === id)
          if (tab) {
            get().updateFileContent(tab.path, content)
          }

          return { 
            tabs: updatedTabs,
            code: state.activeTab === id ? content : state.code
          }
        })
      },

      // UI operations
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', newTheme === 'dark')
          return { theme: newTheme }
        })
      },
      togglePreview: () => set((state) => ({ previewVisible: !state.previewVisible })),
      toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        files: state.files,
        theme: state.theme
      })
    }
  )
)

export default useEditorStore 