"use client"

import { useState, useEffect, useRef } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, RefreshCw, MoreVertical, Check, Clock, ArrowLeft, Copy, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  sender: string
  timestamp: number
  msg: string
  isDelivered?: boolean
}

interface ChatInterfaceProps {
  recipient: {
    pubkey: string
    name: string
    isFriend?: boolean
  }
  contract: ethers.Contract | null
  account: string
  onBack?: () => void
}

export default function ModernChatInterface({ recipient, contract, account, onBack }: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [accountCreationTime, setAccountCreationTime] = useState<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Fetch messages when recipient changes
  useEffect(() => {
    if (recipient && contract) {
      fetchMessages()
      checkAccountCreation()
    }
  }, [recipient, contract])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Helper function to safely get initials
  const getInitials = (name: string | undefined) => {
    if (!name) return "??"
    return name.substring(0, 2).toUpperCase()
  }

  // Helper function to safely format address
  const formatAddress = (address: string | undefined) => {
    if (!address) return "Unknown"
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Check when the recipient's account was created
  const checkAccountCreation = async () => {
    if (!contract || !recipient || !recipient.pubkey) return

    try {
      const timestamp = await contract.getAccountCreationTime(recipient.pubkey)
      setAccountCreationTime(Number(timestamp))
    } catch (error) {
      console.error("Error checking account creation:", error)
    }
  }

  // Fetch messages from the contract
  const fetchMessages = async () => {
    if (!contract || !recipient || !recipient.pubkey) return

    try {
      setLoading(true)
      setRefreshing(true)

      // Use the appropriate method based on whether this is a friend or direct message
      const fetchedMessages =
        recipient.isFriend === false
          ? await contract.readDirectMessage(recipient.pubkey)
          : await contract.readMessage(recipient.pubkey)

      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Send a message
  const sendMessage = async () => {
    if (!contract || !recipient || !recipient.pubkey || !message.trim()) return

    try {
      setSending(true)

      // Use the appropriate method based on whether this is a friend or direct message
      const tx =
        recipient.isFriend === false
          ? await contract.sendDirectMessage(recipient.pubkey, message)
          : await contract.sendMessage(recipient.pubkey, message)

      await tx.wait()

      // Add this message to our local state immediately
      const newMessage = {
        sender: account,
        timestamp: Math.floor(Date.now() / 1000),
        msg: message,
        isDelivered: accountCreationTime > 0,
      }

      setMessages((prev) => [...prev, newMessage])
      setMessage("")

      // Store this recipient in local storage
      try {
        const recentRecipients = JSON.parse(localStorage.getItem("recentRecipients") || "[]")
        if (!recentRecipients.includes(recipient.pubkey)) {
          recentRecipients.push(recipient.pubkey)
          localStorage.setItem("recentRecipients", JSON.stringify(recentRecipients))
        }
      } catch (error) {
        console.error("Error storing recent recipient:", error)
      }

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully!",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Block a user
  const handleBlockUser = async (address: string) => {
    if (!contract) return

    try {
      const tx = await contract.blockUser(address)
      await tx.wait()

      toast({
        title: "User Blocked",
        description: "This user has been blocked from sending you direct messages",
      })

      if (onBack) onBack() // Go back to contact list after blocking
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      })
    }
  }

  // Make sure we have a valid recipient object
  if (!recipient || !recipient.pubkey) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Invalid recipient data. Please select a valid contact.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-1" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10 border border-gray-200">
            <AvatarFallback className="bg-gradient-to-br from-redbelly-red to-red-700 text-white">
              {getInitials(recipient.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{recipient.name || "Unknown"}</h3>
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-2">{formatAddress(recipient.pubkey)}</span>
              {accountCreationTime > 0 ? (
                <span className="flex items-center text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="flex items-center text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  No account
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchMessages}
            disabled={refreshing}
            className="text-gray-500"
            aria-label="Refresh messages"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500" aria-label="More options">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(recipient.pubkey)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuItem onClick={fetchMessages}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBlockUser(recipient.pubkey)} className="text-red-600">
                <Shield className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-redbelly-red border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-center font-medium">No messages yet</p>
            <p className="text-center text-sm mt-1">Start the conversation with {recipient.name || "this contact"}!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.toLowerCase() === account.toLowerCase()
              const timestamp = new Date(Number(message.timestamp) * 1000)
              const showTimestamp =
                index === 0 || new Date(Number(messages[index - 1].timestamp) * 1000).getDate() !== timestamp.getDate()

              return (
                <div key={index}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {timestamp.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                  <div className={cn("flex gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                          {getInitials(recipient.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn("max-w-[75%]", isCurrentUser ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 break-words",
                          isCurrentUser
                            ? "bg-redbelly-red text-white rounded-br-none"
                            : "bg-white border border-gray-200 shadow-sm rounded-bl-none",
                        )}
                      >
                        <p>{message.msg}</p>
                      </div>

                      <div className="flex items-center mt-1 text-xs text-gray-500 gap-1">
                        <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                        {isCurrentUser && (
                          <span>
                            {message.isDelivered ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-500" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message input area */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none min-h-[40px] max-h-[120px] rounded-2xl bg-gray-100 border-gray-200 focus-visible:ring-1 focus-visible:ring-redbelly-red focus-visible:ring-offset-0 w-full"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="bg-redbelly-red hover:bg-red-600 text-white rounded-full h-10 w-10 p-0 flex-shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">Messages are stored on the Redbelly blockchain</p>
        </div>
      </div>
    </div>
  )
}

