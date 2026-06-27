"use client"

import type { Message } from "@/types"

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-3 text-base leading-relaxed font-mono
          ${isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-[#1a1a1a] dark:text-gray-100"
          }
        `}
      >
        {message.content || (
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        )}

        {message.isStreaming && message.content && (
          <span className="ml-0.5 inline-block w-0.5 h-4 bg-current animate-pulse" />
        )}
      </div>
    </div>
  )
}