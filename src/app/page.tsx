'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Resizable, ResizeCallback } from 're-resizable'
import useEditorStore from '../store/editorStore'
import LanguageSelector from '../components/LanguageSelector'
import Terminal from '../components/Terminal'
import AIAssistant from '../components/AIAssistant'
import Preview from '../components/Preview'
import Sidebar from '../components/Sidebar'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

// Dynamically import Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface ResizeData {
  width: number
  height: number
}

export default function Home() {
  const {
    code,
    language,
    setCode,
    theme,
    toggleTheme,
    isRunning,
    setIsRunning,
    isDebugging,
    setIsDebugging,
    output,
    clearOutput,
  } = useEditorStore()

  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [aiPanelWidth, setAiPanelWidth] = useState(300)
  const [previewWidth, setPreviewWidth] = useState(400)
  const [terminalHeight, setTerminalHeight] = useState(300)

  const handleRunCode = async () => {
    setIsRunning(true)
    clearOutput()
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Execution failed')
      }

      // Dispatch output to terminal
      const result = await response.json()
      const event = new CustomEvent('terminal-output', { detail: result.output })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Code execution error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute code'
      const event = new CustomEvent('terminal-output', {
        detail: `Error: ${errorMessage}\n`,
      })
      window.dispatchEvent(event)
    } finally {
      setIsRunning(false)
    }
  }

  const handleDebug = () => {
    setIsDebugging(!isDebugging)
    // Add your debugging logic here
  }

  return (
    <main className={`flex h-screen ${theme === 'dark' ? 'dark bg-[#1e1e1e] text-white' : 'light bg-white text-black'}`}>
      <Resizable
        size={{ width: sidebarWidth, height: '100%' }}
        onResizeStop={(e, direction, ref, d) => setSidebarWidth(sidebarWidth + d.width)}
        minWidth={200}
        maxWidth={400}
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
      >
        <Sidebar />
      </Resizable>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-4 p-4 border-b border-gray-700">
          <LanguageSelector />
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleDebug}
            className={`px-4 py-2 rounded ${
              isDebugging
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isDebugging ? 'Stop Debug' : 'Debug'}
          </button>
          <button
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-full hover:bg-gray-700"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 min-w-0">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {['html', 'css', 'javascript'].includes(language) && (
            <Resizable
              size={{ width: previewWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => setPreviewWidth(previewWidth + d.width)}
              minWidth={300}
              maxWidth={800}
              enable={{
                top: false,
                right: false,
                bottom: false,
                left: true,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              className={`border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <Preview />
            </Resizable>
          )}

          <Resizable
            size={{ width: aiPanelWidth, height: '100%' }}
            onResizeStop={(e, direction, ref, d) => setAiPanelWidth(aiPanelWidth + d.width)}
            minWidth={200}
            maxWidth={800}
            enable={{
              top: false,
              right: false,
              bottom: false,
              left: true,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
            className={`border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <AIAssistant />
          </Resizable>
        </div>

        <Resizable
          size={{ width: '100%', height: terminalHeight }}
          onResizeStop={(e, direction, ref, d) => setTerminalHeight(terminalHeight + d.height)}
          minHeight={100}
          maxHeight={800}
          enable={{
            top: true,
            right: false,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          className="border-t border-gray-700"
        >
          <Terminal />
        </Resizable>
      </div>
    </main>
  )
} 