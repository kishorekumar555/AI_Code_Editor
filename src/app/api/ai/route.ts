import { NextResponse } from 'next/server'

interface FileNode {
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
  path: string
}

interface FileEdit {
  path: string
  content: string
  description: string
}

function generateFileStructure(files: FileNode[], level = 0): string {
  let structure = ''
  const indent = '  '.repeat(level)

  for (const file of files) {
    structure += `${indent}${file.type === 'folder' ? '📁' : '📄'} ${file.path}\n`
    if (file.type === 'folder' && file.children) {
      structure += generateFileStructure(file.children, level + 1)
    }
  }

  return structure
}

function getAllFiles(files: FileNode[]): { path: string; content: string }[] {
  const allFiles: { path: string; content: string }[] = []

  const searchFiles = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        allFiles.push({ path: node.path, content: node.content })
      }
      if (node.type === 'folder' && node.children) {
        searchFiles(node.children)
      }
    }
  }

  searchFiles(files)
  return allFiles
}

function findRelevantFiles(files: FileNode[], currentPath: string): { path: string; content: string }[] {
  const relevantFiles: { path: string; content: string }[] = []
  const currentExt = currentPath.split('.').pop()

  const searchFiles = (nodes: FileNode[]) => {
    for (const node of nodes) {
      if (node.type === 'file') {
        // Include the current file
        if (node.path === currentPath && node.content) {
          relevantFiles.push({ path: node.path, content: node.content })
        }
        // Include files with the same extension
        else if (
          node.content &&
          currentExt &&
          node.path.endsWith(`.${currentExt}`)
        ) {
          relevantFiles.push({ path: node.path, content: node.content })
        }
        // Include related files (e.g., if editing index.html, include style.css and script.js)
        else if (
          node.content &&
          (
            (currentPath.endsWith('.html') && (node.path.endsWith('.css') || node.path.endsWith('.js'))) ||
            (currentPath.endsWith('.css') && node.path.endsWith('.html')) ||
            (currentPath.endsWith('.js') && node.path.endsWith('.html'))
          )
        ) {
          relevantFiles.push({ path: node.path, content: node.content })
        }
      }
      if (node.type === 'folder' && node.children) {
        searchFiles(node.children)
      }
    }
  }

  searchFiles(files)
  return relevantFiles
}

const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama' // 'ollama' | 'openai' | 'huggingface' | 'replicate'
const AI_API_KEY = process.env.AI_API_KEY || ''
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'

async function getAIResponse(prompt: string): Promise<string> {
  switch (AI_PROVIDER) {
    case 'ollama':
      const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'codellama',
          prompt,
          stream: false,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          context_window: 4096
        }),
      })

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`)
      }

      const ollamaData = await ollamaResponse.json()
      return ollamaData.response

    case 'openai':
      if (!AI_API_KEY) throw new Error('OpenAI API key not configured')
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`)
      }

      const openaiData = await openaiResponse.json()
      return openaiData.choices[0].message.content

    // Add more providers as needed
    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`)
  }
}

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { messages, code = '', language = 'plaintext', files = [], currentFile = null } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Generate file structure overview
    const fileStructure = generateFileStructure(files)

    // Get all files for complete context
    const allFiles = getAllFiles(files)
    const allFilesContext = allFiles
      .map(file => `File: ${file.path}\n\`\`\`${file.path.split('.').pop() || ''}\n${file.content}\n\`\`\`\n`)
      .join('\n')

    // Find relevant files for immediate context
    const relevantFiles = currentFile ? findRelevantFiles(files, currentFile) : []
    const relevantFilesContext = relevantFiles
      .map(file => `File: ${file.path}\n\`\`\`${file.path.split('.').pop() || ''}\n${file.content}\n\`\`\`\n`)
      .join('\n')

    const contextString = `You are an AI coding assistant with direct access to the project's files and structure.
You can suggest edits, improvements, and help write new code.

Project Structure:
${fileStructure}

Current File: ${currentFile || 'None selected'}
Current Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Immediately Related Files:
${relevantFilesContext}

All Project Files:
${allFilesContext}

You can:
1. Analyze code and suggest improvements
2. Propose direct file edits (use \`\`\`edit:filepath\`\`\` blocks)
3. Suggest new files (use \`\`\`new:filepath\`\`\` blocks)
4. Reference any file in the project
5. Maintain consistency across files
6. Suggest refactoring across multiple files

When suggesting edits, use this format:
\`\`\`edit:/path/to/file
// Your edited code here
\`\`\`

When suggesting new files, use this format:
\`\`\`new:/path/to/new/file
// Your new file content here
\`\`\`

Based on this project structure and files, please provide helpful, specific responses to help the user with their code.
Consider relationships between files and suggest improvements that maintain consistency across the project.`

    console.log(`Making request to ${AI_PROVIDER} API...`)
    
    try {
      const aiResponse = await getAIResponse([
        { role: 'system', content: contextString },
        ...messages
      ].map(msg => msg.content).join('\n\n'))

      // Parse the response for edit suggestions
      const content = aiResponse
      const edits: FileEdit[] = []
      
      // Extract new file suggestions
      const newFileMatches = content.match(/```new:([^\n]+)\n([\s\S]*?)```/g)
      if (newFileMatches) {
        newFileMatches.forEach((match: string) => {
          const [_, path, code] = match.match(/```new:([^\n]+)\n([\s\S]*?)```/) || []
          if (path && code) {
            edits.push({
              path: path.trim(),
              content: code.trim(),
              description: 'New file suggested by AI'
            })
          }
        })
      }

      // Extract edit suggestions
      const editMatches = content.match(/```edit:([^\n]+)\n([\s\S]*?)```/g)
      if (editMatches) {
        editMatches.forEach((match: string) => {
          const [_, path, code] = match.match(/```edit:([^\n]+)\n([\s\S]*?)```/) || []
          if (path && code) {
            edits.push({
              path: path.trim(),
              content: code.trim(),
              description: 'Suggested edit by AI'
            })
          }
        })
      }

      // Log the edits for debugging
      console.log('Extracted edits:', edits)

      return NextResponse.json({
        content: aiResponse,
        edits: edits
      })
    } catch (error) {
      console.error(`Error making request to ${AI_PROVIDER} API:`, error)
      return NextResponse.json(
        { error: `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing your request' },
      { status: 500 }
    )
  }
} 