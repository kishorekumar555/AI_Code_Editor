'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEditorStore } from '@/store/editorStore'

export default function EditorTabs() {
  const { tabs, activeTab, closeTab, setActiveTab } = useEditorStore()

  if (tabs.length === 0) {
    return (
      <div className="h-10 bg-[#252526] flex items-center px-4 text-gray-400 text-sm">
        No files open
      </div>
    )
  }

  return (
    <div className="h-10 bg-[#252526] flex items-center px-2 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center h-8 px-3 text-white text-sm rounded-t cursor-pointer group
            ${tab.id === activeTab ? 'bg-[#1e1e1e]' : 'bg-[#2d2d2d] hover:bg-[#2a2a2a]'}
            ${tab.isDirty ? 'italic' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span>{tab.name}{tab.isDirty ? '*' : ''}</span>
          <button
            className="ml-2 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#333336] rounded"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
} 