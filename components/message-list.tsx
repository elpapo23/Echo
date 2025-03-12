import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  sender: string
  content: string
  timestamp: Date
}

interface MessageListProps {
  messages: Message[]
  currentAccount: string
}

export default function MessageList({ messages, currentAccount }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet. Be the first to send one!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender.toLowerCase() === currentAccount.toLowerCase()

        return (
          <div key={index} className={cn("flex gap-3", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
            <Avatar className={cn("h-8 w-8", isCurrentUser ? "bg-blue-500" : "bg-gray-500")}>
              <AvatarFallback>{message.sender.substring(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="max-w-[75%]">
              <div
                className={cn(
                  "rounded-lg px-4 py-2 inline-block",
                  isCurrentUser
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : "bg-gray-200 text-gray-800",
                )}
              >
                <p className="break-words">{message.content}</p>
              </div>

              <div className={cn("text-xs text-gray-500 mt-1", isCurrentUser ? "text-right" : "text-left")}>
                <span className="mr-2">
                  {isCurrentUser
                    ? "You"
                    : `${message.sender.substring(0, 6)}...${message.sender.substring(message.sender.length - 4)}`}
                </span>
                <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

