import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcePanel } from '@/components/source-panel';
import { ConfidenceMeter } from '@/components/confidence-meter';
import { TraceabilityView } from '@/components/traceability-view';
import type { ConfidenceLevel } from '@/components/confidence-meter';

type RightPanelProps = {
  sources: { id: number; content: string }[];
  confidence: ConfidenceLevel;
};

export function RightPanel({ sources, confidence }: RightPanelProps) {
  return (
    <Card className="h-full hidden lg:flex lg:flex-col">
      <CardContent className="p-4">
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
            <TabsTrigger value="traceability">Trace</TabsTrigger>
          </TabsList>
          <TabsContent value="sources" className="mt-4">
            <SourcePanel sources={sources} />
          </TabsContent>
          <TabsContent value="confidence" className="mt-4">
            <ConfidenceMeter level={confidence} />
          </TabsContent>
          <TabsContent value="traceability" className="mt-4">
            <TraceabilityView />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
