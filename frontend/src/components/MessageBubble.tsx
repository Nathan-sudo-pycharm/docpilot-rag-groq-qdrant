"use client"
import type { Message } from "@/types"

// In React + TypeScript, when a component accepts data from its
// parent, we define an interface describing exactly what it expects.
// This is called the component's "props" (short for properties).
interface Props {
  message: Message
}

// { message }: Props means: "this component receives an object with
// one field called `message`, and that object must match the Props
// interface above." This is called "destructuring" — instead of
// writing `props.message` everywhere, we pull `message` out directly.
export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed font-mono
          ${isUser
            ? "bg-[#7c3aed] text-white"
            : "bg-[#1a1a1a] text-white"
          }
        `}
      >
        {/* If content is empty (first token hasn't arrived yet),
            show a pulsing dot as a loading indicator instead */}
        {message.content || (
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        )}

        {/* Blinking cursor — only shows while actively streaming
            AND there's already some content to show it after */}
        {message.isStreaming && message.content && (
          <span className="ml-0.5 inline-block w-0.5 h-4 bg-current animate-pulse" />
        )}
      </div>
    </div>
  )
}