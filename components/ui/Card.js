import { cn } from '@/lib/utils';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-6',
        hover &&
          'transition-all duration-300 hover:border-brand-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ children, className }) {
  return (
    <div className={cn('text-slate-400 text-sm leading-relaxed', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-surface-border', className)}>
      {children}
    </div>
  );
}
