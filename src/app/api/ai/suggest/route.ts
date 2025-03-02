import { NextResponse } from 'next/server'

const OLLAMA_API_URL = 'http://localhost:11434/api/generate'

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'codellama',
        prompt: `You are an expert programmer. Given this ${language} code:\n\n${code}\n\nProvide 2-3 suggestions for improvements or completions. Return only the code suggestions, no explanations.`,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error('Ollama API request failed')
    }

    const data = await response.json()
    
    // Split the response into separate code suggestions
    const suggestions = data.response
      .split('```')
      .filter((block: string) => block.trim().length > 0)
      .map((block: string) => block.trim())

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('AI suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI suggestions. Make sure Ollama is running with CodeLlama model.' },
      { status: 500 }
    )
  }
} 