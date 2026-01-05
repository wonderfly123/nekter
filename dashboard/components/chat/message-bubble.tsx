import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export function MessageBubble({ content, role }: MessageBubbleProps) {
  const isBarry = role === 'assistant';

  return (
    <div className="px-6 py-4">
      <div className="max-w-3xl mx-auto flex gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            isBarry
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {isBarry ? (
            <Sparkles className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {isBarry ? 'Barry' : 'You'}
            </span>
          </div>
          <div
            className={cn(
              'text-[15px] leading-relaxed',
              isBarry
                ? 'text-gray-700 bg-gray-50 rounded-lg rounded-tl-none px-4 py-3 border border-gray-100'
                : 'text-gray-900 whitespace-pre-wrap'
            )}
          >
            {isBarry ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-300 pl-3 my-3 italic text-gray-600">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-200 rounded px-1.5 py-0.5 text-sm font-mono">
                      {children}
                    </code>
                  ),
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
