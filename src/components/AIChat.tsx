'use client'

import { useState } from 'react'
import { PaperAirplaneIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface OllamaConfig {
  model: string
  endpoint: string
}

const OLLAMA_MODELS = {
  codellama: {
    model: 'codellama',
    endpoint: 'http://localhost:11434/api/chat'
  },
  llama2: {
    model: 'llama2',
    endpoint: 'http://localhost:11434/api/chat'
  },
  mistral: {
    model: 'mistral',
    endpoint: 'http://localhost:11434/api/chat'
  },
  neural_chat: {
    model: 'neural-chat',
    endpoint: 'http://localhost:11434/api/chat'
  }
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('codellama')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const config = OLLAMA_MODELS[selectedModel as keyof typeof OLLAMA_MODELS]
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [...messages, userMessage],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message.content
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to get response from Ollama. Make sure Ollama is running and the model is downloaded.')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadModel = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: OLLAMA_MODELS[selectedModel as keyof typeof OLLAMA_MODELS].model
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setError('Model downloaded successfully! You can now start chatting.')
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to download model. Make sure Ollama is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full bg-[#252526] text-white flex flex-col">
      <div className="flex justify-between items-center p-2 border-b border-[#333336]">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-[#1e1e1e] text-white text-sm rounded px-2 py-1"
        >
          <option value="codellama">CodeLlama</option>
          <option value="llama2">Llama 2</option>
          <option value="mistral">Mistral</option>
          <option value="neural_chat">Neural Chat</option>
        </select>
        <button
          onClick={downloadModel}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Download Model'}
        </button>
      </div>

      {error && (
        <div className="p-2 bg-red-900/20 border border-red-900/50 m-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              message.role === 'user' ? 'bg-[#2a2d2e]' : 'bg-[#1e1e1e]'
            }`}
          >
            <div className="font-bold mb-1">
              {message.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="text-sm text-gray-400">AI is thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#333336]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="flex-1 bg-[#1e1e1e] text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            className="p-2 hover:bg-[#2a2d2e] rounded disabled:opacity-50"
            disabled={!input.trim() || isLoading}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 