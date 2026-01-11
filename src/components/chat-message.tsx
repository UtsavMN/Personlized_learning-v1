import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  // Regex to find citations like [1], [2], etc.
  const citationRegex = /\[(\d+)\]/g;
  
  // Regex to find bullet points (lines starting with - or •)
  const bulletPointRegex = /^[-•]\s+(.+)$/gm;
  
  // Check if content has bullet points
  const hasBulletPoints = bulletPointRegex.test(content);
  bulletPointRegex.lastIndex = 0; // Reset regex
  
  // Split content into sections by double newlines (for structured content)
  const sections = content.split('\n\n').filter(s => s.trim());
  
  const renderSection = (text: string) => {
    // Check if this section has bullet points
    const bulletMatches = text.match(/^[-•]\s+(.+)$/gm);
    
    if (bulletMatches && bulletMatches.length > 0) {
      // Parse bullet points
      const bulletPoints = text.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
      
      return (
        <ul className="space-y-2 ml-4">
          {bulletPoints.map((bullet, idx) => {
            const content = bullet.replace(/^[-•]\s+/, '').trim();
            const parts = content.split(citationRegex);
            
            return (
              <li key={idx} className="list-disc list-inside">
                {parts.map((part, i) => {
                  if (i % 2 === 1) {
                    // Citation
                    return (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="ml-1 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/80"
                      >
                        [{part}]
                      </Badge>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </li>
            );
          })}
        </ul>
      );
    }
    
    // Regular paragraph with potential citations
    const parts = text.split(citationRegex);
    return (
      <p className="inline">
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            // Citation - render as an inline <span> to avoid nested <div> in <p>
            return (
              <span
                key={i}
                role="button"
                className="mx-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer bg-accent text-accent-foreground hover:bg-accent/80"
              >
                [{part}]
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className={cn('flex items-start space-x-4', isAssistant ? '' : 'justify-end')}>
      {isAssistant && (
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 text-sm shadow-md',
          isAssistant
            ? 'bg-card'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <div className="leading-relaxed space-y-3">
          {sections.map((section, idx) => (
            <div key={idx}>
              {renderSection(section)}
            </div>
          ))}
        </div>
      </div>
      {!isAssistant && (
         <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-secondary">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
