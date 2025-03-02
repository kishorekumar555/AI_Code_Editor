import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      )
    }

    // For web development (HTML, CSS, JavaScript)
    if (['html', 'css', 'javascript'].includes(language)) {
      return NextResponse.json({
        output: 'Web content updated. Check the preview window.',
        content: code,
      })
    }

    // Check if Judge0 API key is available
    const apiKey = process.env.JUDGE0_API_KEY
    if (!apiKey) {
      console.error('Judge0 API key is missing')
      return NextResponse.json(
        { error: 'Judge0 API key is not configured' },
        { status: 500 }
      )
    }

    // For other languages, use Judge0 API
    try {
      const submissionResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: getLanguageId(language),
          stdin: '',
          wait: true,
        }),
      })

      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text()
        console.error('Judge0 submission failed:', {
          status: submissionResponse.status,
          statusText: submissionResponse.statusText,
          error: errorText,
          apiKeyPresent: !!apiKey,
          apiKeyLength: apiKey.length
        })
        return NextResponse.json(
          { error: `Failed to submit code to Judge0: ${submissionResponse.status} ${submissionResponse.statusText}` },
          { status: 502 }
        )
      }

      const submission = await submissionResponse.json()
      console.log('Judge0 submission response:', submission)

      if (!submission.token) {
        return NextResponse.json(
          { error: 'No submission token received from Judge0' },
          { status: 502 }
        )
      }

      // Wait for a short time to allow processing
      await sleep(2000)

      // Get the result
      const resultResponse = await fetch(
        `https://judge0-ce.p.rapidapi.com/submissions/${submission.token}?base64_encoded=false&wait=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'X-RapidAPI-Key': apiKey,
            'Accept': 'application/json',
          },
        }
      )

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text()
        console.error('Judge0 result fetch failed:', {
          status: resultResponse.status,
          statusText: resultResponse.statusText,
          error: errorText
        })
        return NextResponse.json(
          { error: `Failed to get execution result from Judge0: ${resultResponse.status} ${resultResponse.statusText}` },
          { status: 502 }
        )
      }

      const data = await resultResponse.json()
      console.log('Judge0 execution result:', data)
      
      // Check for compilation/runtime errors
      if (data.status?.id >= 6) { // Status IDs 6 and above indicate various error states
        return NextResponse.json({
          error: data.status.description,
          output: data.stderr || data.compile_output || 'Execution failed',
        })
      }

      return NextResponse.json({
        output: data.stdout || 'No output',
        error: data.stderr,
      })
    } catch (error) {
      console.error('Judge0 API error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to communicate with Judge0 API' },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Code execution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute code' },
      { status: 500 }
    )
  }
}

function getLanguageId(language: string): number {
  const languageMap: { [key: string]: number } = {
    python: 71,
    javascript: 63,
    typescript: 74,
    cpp: 54,
    java: 62,
    go: 60,
    rust: 73,
  }

  return languageMap[language] || 71 // Default to Python if language not found
} 