import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

export function TerminalWindow() {
  const commands = [
    { command: '$ flutter --version', output: 'Flutter 3.24.0 • Dart 3.5.0' },
    { command: '$ git status', output: 'On branch main • Nothing to commit' },
    { command: '$ flutter doctor', output: '✓ All checks passed!' },
    { command: '$ flutter build appbundle', output: '✓ Built build/app/outputs/bundle/release' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 font-[family-name:var(--font-mono)] text-sm">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-500/10">
        <Terminal className="w-4 h-4 text-purple-400" />
        <span className="text-muted-foreground text-xs">terminal — zsh</span>
        <div className="flex gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
      </div>
      <div className="space-y-2">
        {commands.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.4 + 0.5 }}
          >
            <div className="text-purple-400">{item.command}</div>
            <div className="text-cyan-300/70 ml-4">{item.output}</div>
          </motion.div>
        ))}
        <div className="text-purple-400 flex items-center">
          $ <span className="w-2 h-5 bg-purple-400 ml-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
