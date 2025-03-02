'use client'

import {
  PlayIcon,
  CogIcon,
  BugAntIcon,
} from '@heroicons/react/24/outline'
import { useEditorStore } from '@/store/editorStore'

// Judge0 language IDs
const LANGUAGE_IDS = {
  'js': 63,    // JavaScript Node.js
  'py': 71,    // Python
  'java': 62,  // Java
  'cpp': 54,   // C++
  'c': 50,     // C
  'cs': 51,    // C#
  'go': 60,    // Go
  'rs': 73,    // Rust
  'rb': 72,    // Ruby
  'php': 68,   // PHP
  'swift': 83, // Swift
  'kt': 78,    // Kotlin
  'scala': 81  // Scala
}

export default function EditorToolbar() {
  const { tabs, activeTab } = useEditorStore()
  const activeFile = tabs.find((tab) => tab.id === activeTab)

  const executeCode = async (code: string, languageId: number) => {
    try {
      // Replace with your Judge0 API endpoint
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: ''
        })
      })

      const { token } = await response.json()

      // Poll for results
      const result = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
        }
      })

      const { stdout, stderr, compile_output } = await result.json()
      
      // Send output to terminal
      const output = stdout || stderr || compile_output || 'No output'
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: output }))
    } catch (error) {
      console.error('Error executing code:', error)
      window.dispatchEvent(new CustomEvent('terminal-output', { 
        detail: `Error executing code: ${error.message}` 
      }))
    }
  }

  const handleCompile = () => {
    if (!activeFile) return
    const ext = activeFile.name.split('.').pop()?.toLowerCase()
    
    if (!ext || !LANGUAGE_IDS[ext]) {
      alert('This file type does not need compilation or is not supported')
      return
    }

    executeCode(activeFile.content, LANGUAGE_IDS[ext])
  }

  const handleRun = () => {
    if (!activeFile) return
    const ext = activeFile.name.split('.').pop()?.toLowerCase()

    if (ext === 'html') {
      window.dispatchEvent(new CustomEvent('toggle-preview'))
      return
    }

    if (!ext || !LANGUAGE_IDS[ext]) {
      alert('This file type is not supported for execution')
      return
    }

    executeCode(activeFile.content, LANGUAGE_IDS[ext])
  }

  const handleDebug = () => {
    if (!activeFile) return
    alert('Debug functionality is not yet implemented with Judge0 API')
  }

  if (!activeFile) return null

  return (
    <div className="h-10 bg-[#252526] flex items-center px-4 gap-2">
      <button
        onClick={handleCompile}
        className="p-2 hover:bg-[#2a2d2e] rounded text-gray-300 hover:text-white"
        title="Compile (if needed)"
      >
        <CogIcon className="w-5 h-5" />
      </button>
      <button
        onClick={handleRun}
        className="p-2 hover:bg-[#2a2d2e] rounded text-gray-300 hover:text-white"
        title="Run"
      >
        <PlayIcon className="w-5 h-5" />
      </button>
      <button
        onClick={handleDebug}
        className="p-2 hover:bg-[#2a2d2e] rounded text-gray-300 hover:text-white"
        title="Debug"
      >
        <BugAntIcon className="w-5 h-5" />
      </button>
    </div>
  )
} 