"use client"

import { useState, useEffect, useRef } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, RefreshCw, MessageSquare, Users, Check, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import DirectMessageList from "./direct-message-list"

interface Message {
  sender: string
  timestamp: number
  msg: string
  isDelivered?: boolean
}

interface DirectMessageProps {
  contract: ethers.Contract | null
  account: string
}

export default function DirectMessage({ contract, account }: DirectMessageProps) {
  const [receiverAddress, setReceiverAddress] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<"new" | "list">("new")
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [accountCreationTime, setAccountCreationTime] = useState<number>(0)
  const [receiverName, setReceiverName] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // When a sender is selected from the list
  useEffect(() => {
    if (selectedSender) {
      setReceiverAddress(selectedSender)
      setViewMode("new")
      fetchDirectMessages(selectedSender)
      checkReceiverAccount(selectedSender)
    }
  }, [selectedSender])

  const checkReceiverAccount = async (address: string) => {
    if (!contract) return
    try {
      const exists = await contract.checkUserExists(address)
      if (exists) {
        const name = await contract.getUsername(address)
        setReceiverName(name)
        const timestamp = await contract.getAccountCreationTime(address)
        setAccountCreationTime(Number(timestamp))
      } else {
        setReceiverName("")
        setAccountCreationTime(0)
      }
    } catch (error) {
      console.error("Error checking receiver account:", error)
    }
  }

  // Fetch direct messages
  const fetchDirectMessages = async (address?: string) => {
    if (!contract) return

    const targetAddress = address || receiverAddress

    if (!targetAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter a recipient address",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setRefreshing(true)
      const fetchedMessages = await contract.readDirectMessage(targetAddress)
      setMessages(fetchedMessages)
      await checkReceiverAccount(targetAddress)
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
    if (!contract || !message.trim()) return

    if (!receiverAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter a recipient address",
        variant: "destructive",
      })
      return
    }

    if (!ethers.isAddress(receiverAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

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

  const handleSelectSender = (address: string) => {
    setSelectedSender(address)
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-full divide-x">
      {/* Left Panel */}
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("new")}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Message
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Message List
            </Button>
          </div>

          {viewMode === "new" && (
            <div className="flex gap-2">
              <Input
                placeholder="Recipient Address (0x...)"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => fetchDirectMessages()}
                disabled={!receiverAddress || refreshing}
                className="shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          )}
        </div>

        {viewMode === "list" && (
          <DirectMessageList
            contract={contract}
            account={account}
            onSelectSender={handleSelectSender}
            selectedSender={selectedSender}
          />
        )}
      </div>

      {/* Right Panel - Message Display */}
      <div className="flex flex-col h-full">
        {receiverAddress || selectedSender ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-redbelly-red text-white">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-gray-700 text-white">
                    {receiverName
                      ? receiverName.substring(0, 2).toUpperCase()
                      : receiverAddress.substring(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {receiverName ||
                      `${receiverAddress.substring(0, 6)}...${receiverAddress.substring(receiverAddress.length - 4)}`}
                  </h3>
                  <div className="flex items-center text-xs text-gray-100">
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
                onClick={() => fetchDirectMessages()}
                disabled={refreshing}
                className="bg-transparent border-white text-white hover:bg-red-600"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
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
                    const isCurrentUser = message.sender.toLowerCase() === account.toLowerCase()
                    const timestamp = new Date(Number(message.timestamp) * 1000)

                    return (
                      <div key={index} className={cn("flex gap-3", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={cn(isCurrentUser ? "bg-redbelly-red" : "bg-gray-700", "text-white")}
                          >
                            {isCurrentUser
                              ? "ME"
                              : receiverName
                                ? receiverName.substring(0, 2).toUpperCase()
                                : message.sender.substring(2, 4).toUpperCase()}
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
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-center">Select a recipient to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}

