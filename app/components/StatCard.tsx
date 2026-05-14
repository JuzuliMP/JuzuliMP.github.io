import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  delay?: number;
}

export function StatCard({ icon: Icon, value, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="p-8 rounded-2xl border border-border bg-card hover:shadow-xl hover:border-primary/30 transition-all"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-4 rounded-xl bg-primary/10">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}
