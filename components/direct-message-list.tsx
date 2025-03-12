"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserCircle, Shield, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DirectMessageListProps {
  contract: ethers.Contract | null
  account: string
  onSelectSender: (address: string) => void
  selectedSender: string | null
}

export default function DirectMessageList({
  contract,
  account,
  onSelectSender,
  selectedSender,
}: DirectMessageListProps) {
  const [senders, setSenders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  useEffect(() => {
    if (contract) {
      fetchDirectMessageSenders()
    }
  }, [contract])

  const fetchDirectMessageSenders = async () => {
    if (!contract) return

    try {
      setLoading(true)
      const sendersList = await contract.getDirectMessageSenders()
      setSenders(sendersList)

      // Try to get usernames for each sender
      const usernamesMap: { [key: string]: string } = {}

      for (const sender of sendersList) {
        try {
          const exists = await contract.checkUserExists(sender)
          if (exists) {
            const name = await contract.getUsername(sender)
            usernamesMap[sender.toLowerCase()] = name
          }
        } catch (error) {
          console.error(`Error fetching info for ${sender}:`, error)
        }
      }

      setUsernames(usernamesMap)
    } catch (error) {
      console.error("Error fetching direct message senders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch direct message senders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const blockUser = async (address: string) => {
    if (!contract) return

    try {
      const tx = await contract.blockUser(address)
      await tx.wait()

      toast({
        title: "User Blocked",
        description: "This user can no longer send you direct messages",
      })
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      })
    }
  }

  const removeSender = async (address: string) => {
    if (!contract) return

    try {
      const tx = await contract.removeDirectMessageSender(address)
      await tx.wait()

      // Update the senders list
      setSenders((prev) => prev.filter((sender) => sender.toLowerCase() !== address.toLowerCase()))

      toast({
        title: "Sender Removed",
        description: "This user has been removed from your direct messages list",
      })
    } catch (error) {
      console.error("Error removing sender:", error)
      toast({
        title: "Error",
        description: "Failed to remove sender",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-redbelly-red"></div>
      </div>
    )
  }

  if (senders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <UserCircle className="h-10 w-10 mb-2 text-gray-400" />
        <p className="text-center text-sm">No direct messages yet.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {senders.map((sender) => {
          const senderLower = sender.toLowerCase()

          return (
            <div
              key={sender}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors",
                selectedSender === sender ? "bg-gray-100" : "",
              )}
            >
              <div className="flex-1 min-w-0" onClick={() => onSelectSender(sender)}>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-gray-700 text-white">
                      {usernames[senderLower]
                        ? usernames[senderLower].substring(0, 2).toUpperCase()
                        : sender.substring(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium truncate">
                      {usernames[senderLower] || `${sender.substring(0, 6)}...${sender.substring(sender.length - 4)}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-redbelly-red"
                  onClick={() => blockUser(sender)}
                  title="Block User"
                >
                  <Shield className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-redbelly-red"
                  onClick={() => removeSender(sender)}
                  title="Remove from List"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

