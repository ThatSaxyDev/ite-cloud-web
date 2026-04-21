import { useEffect, useRef, useState } from "react";

interface ToolEvent {
  id: string;
  icon: string;
  label: string;
  status: "running" | "complete";
}

interface CodeLine {
  id: string;
  text: string;
  color: string;
}

const toolEvents: Omit<ToolEvent, "id">[] = [
  { icon: "◦", label: "read_file", status: "running" },
  { icon: "◦", label: "grep", status: "complete" },
  { icon: "◦", label: "edit", status: "running" },
  { icon: "◦", label: "shell", status: "complete" },
  { icon: "◦", label: "list_dir", status: "running" },
];

const codeSnippets = [
  { prompt: "▸", text: "Analyzing codebase structure...", color: "blue" },
  { prompt: "▸", text: "Found 23 files matching pattern", color: "green" },
  { prompt: "▸", text: "Checking dependencies...", color: "blue" },
  { prompt: "▸", text: "Optimizing imports", color: "yellow" },
  { prompt: "▸", text: "tests passed", color: "green" },
];

export function AgentVisualization() {
  const [tools, setTools] = useState<ToolEvent[]>([]);
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const uuidRef = useRef(0);

  // Single flow: tools + code alternate in one stream
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index % 2 === 0 && index / 2 < toolEvents.length) {
        const event = toolEvents[(index / 2) % toolEvents.length];
        setTools((prev) => {
          const updated = [
            { id: `t-${uuidRef.current++}`, ...event },
            ...prev.slice(0, 2),
          ];
          return updated;
        });
      } else {
        const snippet = codeSnippets[Math.floor(index / 2) % codeSnippets.length];
        setCodeLines((prev) => {
          const updated = [
            { id: `c-${uuidRef.current++}`, text: `${snippet.text}`, color: snippet.color },
            ...prev.slice(0, 4),
          ];
          return updated;
        });
      }
      index++;
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Subtle cursor glow following mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCursorPos({ x, y });
    };

    containerRef.current?.addEventListener("mousemove", handleMouseMove);
    return () => containerRef.current?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="agent-viz" aria-hidden="true">
      <div className="agent-viz-ambient" />
      
      <div className="agent-viz-content">
        <div className="agent-viz-header">
          <span className="agent-viz-status">live</span>
          <div className="agent-viz-pulse">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="agent-viz-stream">
          {tools.map((tool) => (
            <div key={tool.id} className={`agent-viz-item ${tool.status}`}>
              <span className="agent-viz-dot" />
              <span className="agent-viz-label">{tool.label}</span>
              <span className="agent-viz-state">{tool.status}</span>
            </div>
          ))}
          
        {codeLines.map((line) => (
            <div key={line.id} className={`agent-viz-line color-${line.color}`}>
              <span className="agent-viz-caret" style={{ color: `var(--agent-${line.color})` }}>›</span>
              <span className="agent-viz-text">{line.text}</span>
            </div>
          ))}
        </div>

        <div className="agent-viz-input">
          <span className="agent-viz-prompt">$</span>
          <span className="agent-viz-cursor" />
        </div>
      </div>

      <div 
        className="agent-viz-glow" 
        style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }} 
      />
    </div>
  );
}
