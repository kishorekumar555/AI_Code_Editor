'use client'

import { useState } from 'react'
import {
  FolderIcon,
  DocumentIcon,
  FolderPlusIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import useEditorStore from '../store/editorStore'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
  path: string
}

export default function Sidebar() {
  const { files, addFile, deleteFile, openTab } = useEditorStore()
  const [newItemPath, setNewItemPath] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file')

  const handleCreateItem = (parentPath: string, type: 'file' | 'folder') => {
    setNewItemPath(parentPath)
    setNewItemType(type)
    setNewItemName('')
  }

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemPath === null || !newItemName.trim()) return

    addFile(newItemPath, newItemName.trim(), newItemType)
    setNewItemPath(null)
    setNewItemName('')
  }

  const handleDelete = (path: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteFile(path)
    }
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: `${level * 16}px` }}>
        <div className="flex items-center group py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <div 
            className="flex-1 flex items-center cursor-pointer" 
            onClick={() => node.type === 'file' ? openTab(node.path) : null}
          >
            {node.type === 'folder' ? (
              <FolderIcon className="w-5 h-5 text-yellow-500" />
            ) : (
              <DocumentIcon className="w-5 h-5 text-blue-500" />
            )}
            <span className="ml-2 text-sm">{node.name}</span>
          </div>
          <div className="hidden group-hover:flex items-center space-x-2">
            {node.type === 'folder' && (
              <>
                <button
                  onClick={() => handleCreateItem(node.path, 'folder')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <FolderPlusIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCreateItem(node.path, 'file')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(node.path)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {node.type === 'folder' && node.children && renderFileTree(node.children, level + 1)}
        {newItemPath === node.path && (
          <form 
            onSubmit={handleSubmitNewItem}
            className="flex items-center mt-1 px-2"
            style={{ marginLeft: `${(level + 1) * 16}px` }}
          >
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}...`}
              className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
          </form>
        )}
      </div>
    ))
  }

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold">Files</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleCreateItem('/', 'folder')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleCreateItem('/', 'file')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {renderFileTree(files)}
        {newItemPath === '/' && (
          <form onSubmit={handleSubmitNewItem} className="flex items-center mt-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}...`}
              className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
          </form>
        )}
      </div>
    </div>
  )
} 