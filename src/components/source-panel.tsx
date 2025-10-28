import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';

type SourcePanelProps = {
  sources: { id: number; content: string }[];
};

export function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-2 font-headline">Retrieved Sources</h3>
      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg h-96">
            <p className="text-sm text-muted-foreground">No sources available.</p>
            <p className="text-sm text-muted-foreground">Provide documents and ask a question to see sources here.</p>
        </div>
      ) : (
        <ScrollArea className="h-96 pr-4 -mr-4">
          <div className="space-y-4">
            {sources.map((source) => (
              <Card key={source.id} className="bg-background/50 hover:bg-accent/50 transition-colors">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Source [{source.id}]
                  </CardTitle>
                  <CardDescription className="text-xs pt-2 text-foreground break-words">
                    {source.content}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
}
