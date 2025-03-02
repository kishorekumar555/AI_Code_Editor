import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CommandLineIcon,
  PlayIcon,
  BugAntIcon,
} from '@heroicons/react/24/outline'
import { useEditorStore } from '@/store/editorStore'

export default function Header() {
  const { theme, toggleTheme, togglePreview, toggleTerminal, previewVisible, terminalVisible, tabs, activeTab } = useEditorStore()

  const handleRun = () => {
    const activeFile = tabs.find(tab => tab.id === activeTab);
    if (!activeFile) return;

    // Get file extension
    const ext = activeFile.name.split('.').pop()?.toLowerCase();
    let command = '';

    switch (ext) {
      case 'js':
        command = `node "${activeFile.path}"`;
        break;
      case 'ts':
        command = `ts-node "${activeFile.path}"`;
        break;
      case 'py':
        command = `python "${activeFile.path}"`;
        break;
      case 'html':
        togglePreview();
        return;
      default:
        alert('Unsupported file type for running');
        return;
    }

    // Send command to terminal
    window.dispatchEvent(new CustomEvent('terminal-command', { detail: command }));
  };

  const handleDebug = () => {
    const activeFile = tabs.find(tab => tab.id === activeTab);
    if (!activeFile) return;

    // Get file extension
    const ext = activeFile.name.split('.').pop()?.toLowerCase();
    let command = '';

    switch (ext) {
      case 'js':
        command = `node --inspect-brk "${activeFile.path}"`;
        break;
      case 'ts':
        command = `ts-node --inspect-brk "${activeFile.path}"`;
        break;
      case 'py':
        command = `python -m pdb "${activeFile.path}"`;
        break;
      default:
        alert('Unsupported file type for debugging');
        return;
    }

    // Send command to terminal
    window.dispatchEvent(new CustomEvent('terminal-command', { detail: command }));
  };

  return (
    <div className="h-10 bg-[#252526] border-b border-[#333336] flex items-center justify-between px-4">
      <div className="text-white font-semibold">AI Code Editor</div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          className="p-1.5 hover:bg-[#2a2d2e] rounded"
          title="Run"
          disabled={!activeTab}
        >
          <PlayIcon className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleDebug}
          className="p-1.5 hover:bg-[#2a2d2e] rounded"
          title="Debug"
          disabled={!activeTab}
        >
          <BugAntIcon className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={togglePreview}
          className={`p-1.5 rounded ${
            previewVisible ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'
          }`}
          title="Toggle Preview"
        >
          <ComputerDesktopIcon className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={toggleTerminal}
          className={`p-1.5 rounded ${
            terminalVisible ? 'bg-[#2a2d2e]' : 'hover:bg-[#2a2d2e]'
          }`}
          title="Toggle Terminal"
        >
          <CommandLineIcon className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-[#2a2d2e] rounded"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5 text-white" />
          ) : (
            <MoonIcon className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  )
} 