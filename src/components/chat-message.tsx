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
  const parts = content.split(citationRegex);

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
        <p className="leading-relaxed">
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              // This is a citation number
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="mx-1 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/80"
                >
                  {part}
                </Badge>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
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
