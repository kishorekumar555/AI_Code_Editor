# AI Code Editor

A modern, intelligent code editor powered by CodeLlama AI that provides smart code suggestions, real-time assistance, and project-aware code editing capabilities.

## Features

- 🤖 **AI-Powered Code Assistance**: Integrated CodeLlama AI for intelligent code suggestions and real-time help
- 📝 **Smart Code Editor**: Syntax highlighting and language detection based on file extensions
- 🌳 **Project File Management**: Built-in file explorer with create/delete capabilities for files and folders
- 🔄 **Multi-File Context**: AI understands your entire project structure for contextually aware suggestions
- 💡 **Intelligent Code Analysis**: Get suggestions for improvements and refactoring across multiple files
- 🎨 **Modern UI**: Clean and intuitive interface with split-pane views and resizable panels

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Ollama (for running CodeLlama locally)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/ai-code-editor.git
cd ai-code-editor
```

2. Install dependencies:
```bash
npm install
```

3. Install and run Ollama:
- Download Ollama from [ollama.ai](https://ollama.ai)
- Install the CodeLlama model:
```bash
ollama pull codellama
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with these variables:

```env
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434
```

## Usage

1. **File Management**:
   - Use the sidebar to create, delete, and navigate files/folders
   - Click on files to open them in the editor

2. **AI Assistance**:
   - Type your questions or requests in the AI chat panel
   - Get context-aware suggestions and code improvements
   - Apply suggested changes directly to your files

3. **Code Editing**:
   - Edit files with syntax highlighting
   - Multiple file support with tabs
   - Split-pane view for side-by-side editing

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **AI**: CodeLlama (via Ollama)
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor

## Development

To contribute to the project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CodeLlama for providing the AI capabilities
- Monaco Editor for the powerful code editing features
- Next.js team for the amazing framework 
