"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserCircle, Users, MessageSquare } from "lucide-react"
import type { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast"

interface Friend {
  pubkey: string
  name: string
  isFriend?: boolean
}

interface FriendsListProps {
  friends: Friend[]
  selectedFriend: Friend | null
  onSelectFriend: (friend: Friend) => void
  contract: ethers.Contract | null
  account: string
}

export default function FriendsList({ friends, selectedFriend, onSelectFriend, contract, account }: FriendsListProps) {
  const [allContacts, setAllContacts] = useState<Friend[]>([])
  const [directMessageSenders, setDirectMessageSenders] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "friends">("all")
  const { toast } = useToast()

  useEffect(() => {
    if (contract) {
      fetchDirectMessageSenders()
    }
  }, [contract])

  useEffect(() => {
    // Combine friends and direct message senders
    const combined = [...(friends || [])]

    // Add direct message senders that aren't already friends
    directMessageSenders.forEach((sender) => {
      if (!combined.some((f) => f.pubkey.toLowerCase() === sender.pubkey.toLowerCase())) {
        combined.push(sender)
      }
    })

    setAllContacts(combined)
  }, [friends, directMessageSenders])

  const fetchDirectMessageSenders = async () => {
    if (!contract) return

    try {
      setLoading(true)
      const sendersList = await contract.getDirectMessageSenders()

      const sendersWithNames = await Promise.all(
        sendersList.map(async (sender: string) => {
          try {
            const exists = await contract.checkUserExists(sender)
            let name = formatAddress(sender) // Default to formatted address

            if (exists) {
              const username = await contract.getUsername(sender)
              if (username) {
                name = username
              }
            }

            return {
              pubkey: sender,
              name,
              isFriend: false,
            }
          } catch (error) {
            console.error(`Error fetching info for ${sender}:`, error)
            return {
              pubkey: sender,
              name: formatAddress(sender),
              isFriend: false,
            }
          }
        }),
      )

      setDirectMessageSenders(sendersWithNames)
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

  // Helper function to format address
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Helper function to get display name
  const getDisplayName = (contact: Friend) => {
    if (!contact) return "Unknown"
    if (contact.name && contact.name !== formatAddress(contact.pubkey)) {
      return contact.name
    }
    return formatAddress(contact.pubkey)
  }

  // Helper function to get avatar initials
  const getAvatarInitials = (contact: Friend) => {
    if (!contact) return "??"
    if (contact.name && contact.name !== formatAddress(contact.pubkey)) {
      return contact.name.substring(0, 2).toUpperCase()
    }
    return contact.pubkey.substring(2, 4).toUpperCase()
  }

  const displayedContacts = filter === "all" ? allContacts : friends || []

  if (loading && displayedContacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-redbelly-red"></div>
      </div>
    )
  }

  if (displayedContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500 p-4">
        <UserCircle className="h-10 w-10 mb-2 text-gray-400" />
        <p className="text-center text-sm">
          {filter === "all"
            ? "No contacts yet. Add friends or send direct messages to start chatting!"
            : "No friends yet. Add friends to start chatting!"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === "friends" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("friends")}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Friends Only
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(80vh-160px)]">
        <div className="p-2">
          {displayedContacts.map((contact) => (
            <div
              key={contact.pubkey}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors",
                selectedFriend?.pubkey === contact.pubkey ? "bg-gray-100" : "",
              )}
              onClick={() => onSelectFriend(contact)}
            >
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                  {getAvatarInitials(contact)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{getDisplayName(contact)}</p>
                <p className="text-xs text-gray-500 truncate flex items-center">
                  {formatAddress(contact.pubkey)}
                  {contact.isFriend === false && (
                    <span className="ml-2 text-xs text-gray-400 flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Direct
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

