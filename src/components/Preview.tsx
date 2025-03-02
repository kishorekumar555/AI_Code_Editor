'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import useEditorStore from '../store/editorStore'

export default function Preview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { code, language } = useEditorStore()
  const [externalWindow, setExternalWindow] = useState<Window | null>(null)

  useEffect(() => {
    if (!iframeRef.current || !['html', 'css', 'javascript'].includes(language)) return

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) return

    if (language === 'html') {
      iframeDoc.open()
      iframeDoc.write(code)
      iframeDoc.close()
    } else if (language === 'css') {
      const style = iframeDoc.createElement('style')
      style.textContent = code
      iframeDoc.head.appendChild(style)
    } else if (language === 'javascript') {
      const script = iframeDoc.createElement('script')
      script.text = code
      iframeDoc.body.appendChild(script)
    }

    // Update external window if it exists
    if (externalWindow && !externalWindow.closed) {
      const extDoc = externalWindow.document
      extDoc.open()
      extDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview</title>
            <style>
              body { margin: 0; }
              ${language === 'css' ? code : ''}
            </style>
          </head>
          <body>
            ${language === 'html' ? code : '<div id="root"></div>'}
            ${language === 'javascript' ? `<script>${code}</script>` : ''}
          </body>
        </html>
      `)
      extDoc.close()
    }
  }, [code, language, externalWindow])

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (iframeRef.current) {
        iframeRef.current.style.height = `${containerRef.current?.clientHeight}px`
        iframeRef.current.style.width = `${containerRef.current?.clientWidth}px`
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const openInNewWindow = () => {
    if (externalWindow && !externalWindow.closed) {
      externalWindow.focus()
    } else {
      const win = window.open('', 'Preview', 'width=800,height=600')
      if (win) {
        setExternalWindow(win)
        win.onunload = () => setExternalWindow(null)
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-700">
        <span className="text-white">Preview</span>
        <button
          onClick={openInNewWindow}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          title="Open in new window"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </button>
      </div>
      <div ref={containerRef} className="flex-1 bg-white overflow-hidden">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
        />
      </div>
    </div>
  )
} 