import { useEffect, useRef, useState } from "react";

interface StreamItem {
  id: string;
  type: "tool" | "log" | "plan" | "result";
  icon?: string;
  label?: string;
  status?: "running" | "complete" | "error";
  content: string;
  color?: "blue" | "green" | "yellow" | "red" | "dim";
}

// Extended realistic agent workflow
const workflowSteps: Omit<StreamItem, "id">[] = [
  { type: "plan", content: "Initializing context...", color: "dim" },
  { type: "tool", icon: "◦", label: "list_dir", status: "complete", content: "./src/components", color: "green" },
  { type: "log", content: "4 files found", color: "dim" },
  { type: "tool", icon: "◦", label: "read_file", status: "running", content: "Hero.tsx", color: "yellow" },
  { type: "log", content: "Parsing JSX structure", color: "blue" },
  { type: "plan", content: "Identifying insertion point", color: "dim" },
  { type: "tool", icon: "◦", label: "grep", status: "complete", content: "className=\"hero", color: "green" },
  { type: "log", content: "3 matches in scope", color: "dim" },
  { type: "plan", content: "Drafting changes", color: "blue" },
  { type: "tool", icon: "◦", label: "edit", status: "running", content: "Hero.tsx:42", color: "yellow" },
  { type: "log", content: "Validating syntax", color: "dim" },
  { type: "result", content: "Edit applied ✓", color: "green" },
  { type: "tool", icon: "◦", label: "shell", status: "running", content: "npm run typecheck", color: "yellow" },
  { type: "log", content: "0 errors, 0 warnings", color: "green" },
  { type: "tool", icon: "◦", label: "grep", status: "complete", content: "import.*React", color: "green" },
  { type: "log", content: "Dependency check complete", color: "dim" },
  { type: "plan", content: "Running validation suite", color: "blue" },
  { type: "tool", icon: "◦", label: "shell", status: "running", content: "npm test -- --watch", color: "yellow" },
  { type: "log", content: "7 passed, 0 failed (420ms)", color: "green" },
  { type: "result", content: "Task sequence complete", color: "green" },
];

// Random delays for unpredictability
function getRandomDelay() {
  const delays = [800, 1200, 1800, 2400, 600, 1500, 900];
  return delays[Math.floor(Math.random() * delays.length)];
}

export function AgentVisualization() {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const uuidRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let index = 0;
    
    function scheduleNext() {
      const delay = getRandomDelay();
      timeoutRef.current = setTimeout(() => {
        if (index < workflowSteps.length) {
          const step = workflowSteps[index];
          setItems((prev) => {
            const updated = [
              { id: `i-${uuidRef.current++}`, ...step },
              ...prev.slice(0, 6),
            ];
            return updated;
          });
          index++;
        } else {
          index = 0;
        }
        scheduleNext();
      }, delay);
    }
    
    scheduleNext();
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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

  const getColorVar = (color?: string) => {
    switch (color) {
      case "blue": return "var(--agent-blue)";
      case "green": return "var(--agent-green)";
      case "yellow": return "var(--agent-yellow)";
      case "red": return "var(--agent-red)";
      default: return "var(--text-dim)";
    }
  };

  return (
    <div ref={containerRef} className="agent-viz" aria-hidden="true">
      <div className="agent-viz-ambient" />
      
      <div className="agent-viz-content">
        <div className="agent-viz-header">
          <div className="agent-viz-left">
            <span className="agent-viz-status">agent</span>
            <div className="agent-viz-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <span className="agent-viz-live">live</span>
        </div>

        <div className="agent-viz-stream">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`agent-viz-item type-${item.type}`}
            >
              {item.type === 'tool' && (
                <>
                  <span 
                    className="agent-viz-marker" 
                    style={{ 
                      color: getColorVar(item.color),
                      textShadow: item.status === 'running' ? `0 0 8px ${getColorVar(item.color)}` : 'none'
                    }}
                  >
                    {item.status === 'running' ? '◐' : '◦'}
                  </span>
                  <span className="agent-viz-name">{item.label}</span>
                  <span className="agent-viz-sep">—</span>
                  <span 
                    className="agent-viz-detail"
                    style={{ color: getColorVar(item.color) }}
                  >
                    {item.content}
                  </span>
                </>
              )}
              
              {item.type === 'log' && (
                <>
                  <span 
                    className="agent-viz-caret"
                    style={{ color: getColorVar(item.color) }}
                  >
                    ›
                  </span>
                  <span 
                    className="agent-viz-text"
                    style={{ color: getColorVar(item.color) }}
                  >
                    {item.content}
                  </span>
                </>
              )}
              
              {item.type === 'plan' && (
                <>
                  <span className="agent-viz-plan-mark">◆</span>
                  <span 
                    className="agent-viz-plan-text"
                    style={{ color: getColorVar(item.color) }}
                  >
                    {item.content}
                  </span>
                </>
              )}
              
              {item.type === 'result' && (
                <>
                  <span 
                    className="agent-viz-check"
                    style={{ color: getColorVar('green') }}
                  >
                    ✓
                  </span>
                  <span 
                    className="agent-viz-result"
                    style={{ color: getColorVar('green') }}
                  >
                    {item.content}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="agent-viz-footer">
          <span className="agent-viz-prompt">❯</span>
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
