import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { command } = await request.json()
    
    // For security, we'll just echo back the command for now
    return NextResponse.json({
      output: `Received command: ${command}\nThis is a test response.`
    })
  } catch (error) {
    const { command, cwd } = await request.json()

    // Basic security check
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 })
    }

    // Validate and normalize the working directory
    const normalizedCwd = path.normalize(cwd || process.cwd())
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      cwd: normalizedCwd,
      shell: process.platform === 'win32' ? 'cmd.exe' : 'bash',
    })

    // Handle cd command specially to track directory changes
    if (command.trim().startsWith('cd ')) {
      const newPath = command.trim().slice(3)
      const resolvedPath = path.resolve(normalizedCwd, newPath)
      return NextResponse.json({
        output: stdout || stderr,
        cwd: resolvedPath,
      })
    }

    return NextResponse.json({
      output: stdout || stderr,
      cwd: normalizedCwd,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cwd: process.cwd(),
    })
  }
} 