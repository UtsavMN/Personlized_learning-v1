import { cn } from '@/lib/utils';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

type ConfidenceMeterProps = {
  level: ConfidenceLevel;
};

const confidenceConfig = {
  low: {
    label: 'Low Confidence',
    color: 'bg-red-500',
    description: 'The answer may not be fully supported by the sources. Please verify.',
  },
  medium: {
    label: 'Medium Confidence',
    color: 'bg-yellow-500',
    description: 'The answer is likely supported, but some parts may be inferred.',
  },
  high: {
    label: 'High Confidence',
    color: 'bg-green-500',
    description: 'The answer is strongly supported by the provided sources.',
  },
};

export function ConfidenceMeter({ level }: ConfidenceMeterProps) {
  const config = confidenceConfig[level];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 font-headline">Confidence Score</h3>
      <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-background">
          <div className={cn('absolute w-20 h-20 rounded-full', config.color, 'opacity-20')} />
          <div className={cn('absolute w-16 h-16 rounded-full', config.color, 'opacity-40')} />
          <div className={cn('w-12 h-12 rounded-full', config.color)} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{config.label}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{config.description}</p>
        </div>
      </div>
    </div>
  );
}
