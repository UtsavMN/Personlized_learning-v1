import { Header } from '@/components/header';
import { ChatView } from '@/components/views/chat-view';
import { CodeView } from '@/components/views/code-view';
import { MathView } from '@/components/views/math-view';
import { TimetableView } from '@/components/views/timetable-view';
import { DocumentView } from '@/components/views/document-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookText, Calculator, CalendarClock, Code2, FileUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 max-w-3xl mx-auto h-auto">
            <TabsTrigger value="chat" className="py-2">
              <BookText className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="math" className="py-2">
              <Calculator className="w-4 h-4 mr-2" />
              Math
            </TabsTrigger>
            <TabsTrigger value="code" className="py-2">
              <Code2 className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="timetable" className="py-2">
              <CalendarClock className="w-4 h-4 mr-2" />
              Timetable
            </TabsTrigger>
            <TabsTrigger value="documents" className="py-2">
               <FileUp className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-6">
            <ChatView />
          </TabsContent>
          <TabsContent value="math" className="mt-6">
            <MathView />
          </TabsContent>
          <TabsContent value="code" className="mt-6">
            <CodeView />
          </TabsContent>
          <TabsContent value="timetable" className="mt-6">
            <TimetableView />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <DocumentView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
