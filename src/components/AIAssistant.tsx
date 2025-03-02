'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import useEditorStore from '../store/editorStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface FileEdit {
  path: string
  content: string
  description: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI coding assistant. I can help you with your code and understand your project structure. I can suggest edits, create new files, and help improve your code. How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingEdits, setPendingEdits] = useState<FileEdit[]>([])
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { 
    code, 
    language, 
    files, 
    currentFile, 
    addFile,
    updateFileContent,
    openTab
  } = useEditorStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setPendingEdits([])
    setError(null)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
          code: code || '',
          language: language || 'plaintext',
          files: files || [],
          currentFile: currentFile || null
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        throw new Error('Failed to parse AI response')
      }

      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string' 
            ? data.error 
            : 'Failed to get AI response'
        )
      }

      if (!data || typeof data.content !== 'string') {
        throw new Error('Invalid response format from AI')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      
      if (data.edits && Array.isArray(data.edits) && data.edits.length > 0) {
        setPendingEdits(data.edits)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}\n\nPlease make sure:\n1. Ollama is running (check http://localhost:11434)\n2. The CodeLlama model is installed (run: ollama pull codellama)\n3. The model is running (run: ollama run codellama)\n\nIf the issue persists, try restarting Ollama.` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const applyEdit = (edit: FileEdit) => {
    // Check if this is a new file suggestion by checking the description
    const isNewFile = edit.description === 'New file suggested by AI'
    
    if (isNewFile) {
      // Extract parent path and file name
      const pathParts = edit.path.split('/')
      const fileName = pathParts.pop() || ''
      const parentPath = pathParts.join('/') || '/'
      
      // Create the new file
      addFile(parentPath, fileName, 'file')
      
      // Update the content and open the file
      updateFileContent(edit.path, edit.content)
      openTab(edit.path)
    } else {
      // Update existing file
      updateFileContent(edit.path, edit.content)
      openTab(edit.path)
    }
  }

  const applyAllEdits = () => {
    pendingEdits.forEach(edit => applyEdit(edit))
    setPendingEdits([])
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : error && index === messages.length - 1
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {pendingEdits.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Suggested Changes:</h3>
            <div className="space-y-2">
              {pendingEdits.map((edit, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{edit.description} - {edit.path}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => applyEdit(edit)}
                      className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded text-green-600 dark:text-green-400"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPendingEdits(prev => prev.filter((_, i) => i !== index))}
                      className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded text-red-600 dark:text-red-400"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {pendingEdits.length > 1 && (
                <button
                  onClick={applyAllEdits}
                  className="mt-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded text-sm"
                >
                  Apply All Changes
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? 'Thinking...' : 'Ask me anything about your code or project...'}
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 