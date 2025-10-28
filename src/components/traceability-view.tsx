import { ArrowRight } from 'lucide-react';

const steps = [
  'Query',
  'Retrieval',
  'Rerank',
  'Grounding',
  'Generation',
];

export function TraceabilityView() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 font-headline">Query Trace</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {steps.map((step, index) => (
            <li key={step}>
              <div className="relative pb-8">
                {index !== steps.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-center space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ring-8 ring-background">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        This is a simplified representation of the RAG pipeline for your query.
      </p>
    </div>
  );
}
