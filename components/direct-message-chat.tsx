"use client"

import { useState, useEffect, useRef } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send, RefreshCw, Check, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Message {
  sender: string
  timestamp: number
  msg: string
  isDelivered?: boolean
}

interface DirectMessageChatProps {
  receiverAddress: string
  receiverName: string
  contract: ethers.Contract | null
  account: string
}

export default function DirectMessageChat({
  receiverAddress,
  receiverName,
  contract,
  account,
}: DirectMessageChatProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [accountCreationTime, setAccountCreationTime] = useState<number>(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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

  // Fetch messages when receiver changes
  useEffect(() => {
    if (receiverAddress && contract) {
      fetchDirectMessages()
      checkReceiverAccount()
    }
  }, [receiverAddress, contract])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const checkReceiverAccount = async () => {
    if (!contract || !receiverAddress) return
    try {
      const exists = await contract.checkUserExists(receiverAddress)
      if (exists) {
        const timestamp = await contract.getAccountCreationTime(receiverAddress)
        setAccountCreationTime(Number(timestamp))
      } else {
        setAccountCreationTime(0)
      }
    } catch (error) {
      console.error("Error checking receiver account:", error)
    }
  }

  // Fetch direct messages
  const fetchDirectMessages = async () => {
    if (!contract || !receiverAddress) return

    try {
      setLoading(true)
      setRefreshing(true)
      const fetchedMessages = await contract.readDirectMessage(receiverAddress)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Error fetching direct messages:", error)
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

  // Send a direct message
  const sendDirectMessage = async () => {
    if (!contract || !message.trim() || !receiverAddress) return

    try {
      setSending(true)
      const tx = await contract.sendDirectMessage(receiverAddress, message)
      await tx.wait()

      setMessage("")
      fetchDirectMessages()

      toast({
        title: "Message Sent",
        description: "Your direct message has been sent successfully!",
      })
    } catch (error) {
      console.error("Error sending direct message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Make sure we have a valid receiver address
  if (!receiverAddress) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Invalid recipient. Please select a valid contact.</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-redbelly-red text-white">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-gray-700 text-white">{getInitials(receiverName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{receiverName || formatAddress(receiverAddress)}</h3>
            <div className="flex items-center text-xs text-gray-100">
              <span className="mr-2">{formatAddress(receiverAddress)}</span>
              {accountCreationTime > 0 ? (
                <span className="flex items-center text-green-300">
                  <Check className="h-3 w-3 mr-1" />
                  Account created {formatDistanceToNow(new Date(accountCreationTime * 1000), { addSuffix: true })}
                </span>
              ) : (
                <span className="flex items-center text-yellow-300">
                  <Clock className="h-3 w-3 mr-1" />
                  No account yet
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDirectMessages}
          disabled={refreshing}
          className="bg-transparent border-white text-white hover:bg-red-600"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-redbelly-red" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser =
                message.sender && account ? message.sender.toLowerCase() === account.toLowerCase() : false
              const timestamp = new Date(Number(message.timestamp) * 1000)

              return (
                <div key={index} className={cn("flex gap-3", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn(isCurrentUser ? "bg-redbelly-red" : "bg-gray-700", "text-white")}>
                      {isCurrentUser ? "ME" : getInitials(receiverName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 inline-block",
                        isCurrentUser ? "bg-redbelly-red text-white" : "bg-gray-700 text-white",
                      )}
                    >
                      <p className="break-words">{message.msg}</p>
                    </div>

                    <div className={cn("text-xs mt-1", isCurrentUser ? "text-right" : "text-left")}>
                      <span className="text-gray-500">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 w-full">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendDirectMessage()
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={sendDirectMessage}
            disabled={!message.trim() || sending}
            className="bg-redbelly-red hover:bg-red-600 text-white flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </>
  )
}

