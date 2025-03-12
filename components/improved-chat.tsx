"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Smile, MoreVertical, Phone, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "other"
  timestamp: Date
  status?: "sent" | "delivered" | "read"
}

export default function ImprovedChat() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How are you doing today?",
      sender: "other",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2",
      content: "I'm doing well, thanks for asking! How about you?",
      sender: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      status: "read",
    },
    {
      id: "3",
      content: "I'm great! Just wanted to check in. Have you had a chance to look at the project we discussed?",
      sender: "other",
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
    },
    {
      id: "4",
      content: "Yes, I've been working on it. I should have something to show you by tomorrow.",
      sender: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      status: "read",
    },
    {
      id: "5",
      content: "That sounds great! Looking forward to seeing your progress.",
      sender: "other",
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
      status: "sent",
    }

    setMessages([...messages, newMessage])
    setMessage("")

    // Simulate a response after 2 seconds
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for the update! Is there anything you need help with?",
        sender: "other",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, responseMessage])

      // Update status of user's message to "read" after 1 more second
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "read" } : msg)))
      }, 1000)
    }, 2000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto rounded-lg overflow-hidden border shadow-lg bg-white">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Contact" />
            <AvatarFallback className="bg-indigo-100 text-indigo-800">JD</AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h2 className="font-semibold">John Doe</h2>
            <p className="text-xs text-indigo-100">Online</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-indigo-600 rounded-full"
            aria-label="Voice call"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-indigo-600 rounded-full"
            aria-label="Video call"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-indigo-600 rounded-full"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat messages area */}
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("flex gap-2 max-w-[80%]", msg.sender === "user" ? "flex-row-reverse" : "flex-row")}>
                {msg.sender === "other" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-indigo-100 text-indigo-800">JD</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2",
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white border shadow-sm rounded-tl-none",
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center mt-1 text-xs text-gray-500",
                      msg.sender === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.status && (
                      <span className="ml-2">
                        {msg.status === "sent" && "✓"}
                        {msg.status === "delivered" && "✓✓"}
                        {msg.status === "read" && <span className="text-blue-500">✓✓</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input area */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-indigo-600 hover:bg-transparent rounded-full"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 bg-transparent border-none focus:outline-none py-2 text-gray-800"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            aria-label="Message input"
          />

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-indigo-600 hover:bg-transparent rounded-full"
            aria-label="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            Messages are end-to-end encrypted. No one outside this chat can read them.
          </p>
        </div>
      </div>
    </div>
  )
}

