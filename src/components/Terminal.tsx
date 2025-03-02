'use client'

import { useEffect, useRef } from 'react'
import useEditorStore from '../store/editorStore'
import '../styles/terminal.css'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm>()
  const { output, clearOutput } = useEditorStore()

  useEffect(() => {
    const initTerminal = async () => {
      if (!terminalRef.current || typeof window === 'undefined') return

      try {
        // Import xterm CSS
        await import('@xterm/xterm/css/xterm.css')

        // Import required modules
        const { Terminal } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')
        const { WebLinksAddon } = await import('@xterm/addon-web-links')

        // Initialize xterm.js
        const xterm = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#1e1e1e',
            foreground: '#ffffff',
          },
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          convertEol: true,
          scrollback: 1000,
        })

        const fitAddon = new FitAddon()
        const webLinksAddon = new WebLinksAddon()
        
        xterm.loadAddon(fitAddon)
        xterm.loadAddon(webLinksAddon)

        xterm.open(terminalRef.current)
        fitAddon.fit()
        xterm.writeln('Terminal ready...')

        xtermRef.current = xterm

        // Handle window resize and container resize
        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit()
        })

        resizeObserver.observe(terminalRef.current)

        // Handle output from code execution
        const handleOutput = (event: CustomEvent) => {
          const output = event.detail
          if (typeof output === 'string') {
            xterm.writeln(output)
          }
        }

        window.addEventListener('terminal-output', handleOutput as EventListener)

        // Cleanup
        return () => {
          window.removeEventListener('terminal-output', handleOutput as EventListener)
          resizeObserver.disconnect()
          xterm.dispose()
        }
      } catch (error) {
        console.error('Failed to initialize terminal:', error)
      }
    }

    initTerminal()
  }, [])

  // Update terminal when output changes
  useEffect(() => {
    if (xtermRef.current && output) {
      xtermRef.current.writeln(output)
    }
  }, [output])

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-700">
        <span className="text-white">Terminal</span>
        <button
          onClick={clearOutput}
          className="text-gray-400 hover:text-white text-sm"
        >
          Clear
        </button>
      </div>
      <div ref={terminalRef} className="terminal-container flex-1" />
    </div>
  )
} 