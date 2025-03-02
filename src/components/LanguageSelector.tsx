'use client'

import { useEffect, useState } from 'react'
import useEditorStore from '../store/editorStore'

const supportedLanguages = [
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'go', name: 'Go', extension: '.go' },
  { id: 'rust', name: 'Rust', extension: '.rs' },
  { id: 'html', name: 'HTML', extension: '.html' },
  { id: 'css', name: 'CSS', extension: '.css' },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useEditorStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-[#1e1e1e] text-white border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.name}
        </option>
      ))}
    </select>
  )
} 