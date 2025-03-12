"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, Users, MessageSquare, Plus, UserCircle, Settings } from "lucide-react"
import { ethers } from "ethers"
import type { Contract } from "ethers"
import { useToast } from "@/hooks/use-toast"

interface Contact {
  pubkey: string
  name: string
  isFriend?: boolean
  lastMessage?: string
  lastMessageTime?: number
}

interface ContactListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  onSelectContact: (contact: Contact) => void
  contract: Contract | null
  account: string
  onNewMessage: () => void
  onManageContacts: () => void
}

export default function ModernContactList({
  contacts,
  selectedContact,
  onSelectContact,
  contract,
  account,
  onNewMessage,
  onManageContacts,
}: ContactListProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [directMessageSenders, setDirectMessageSenders] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "friends">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (contract) {
      fetchDirectMessageSenders()
    }
  }, [contract])

  useEffect(() => {
    // Combine friends and direct message senders
    const combined = [...(contacts || [])]

    // Add direct message senders that aren't already friends
    directMessageSenders.forEach((sender) => {
      if (!combined.some((f) => f.pubkey.toLowerCase() === sender.pubkey.toLowerCase())) {
        combined.push(sender)
      } else {
        // If this sender is already in combined as a friend, update with lastMessage if available
        const existingIndex = combined.findIndex((f) => f.pubkey.toLowerCase() === sender.pubkey.toLowerCase())
        if (existingIndex >= 0 && sender.lastMessageTime) {
          combined[existingIndex] = {
            ...combined[existingIndex],
            lastMessage: sender.lastMessage || combined[existingIndex].lastMessage,
            lastMessageTime: sender.lastMessageTime || combined[existingIndex].lastMessageTime,
          }
        }
      }
    })

    setAllContacts(combined)
  }, [contacts, directMessageSenders])

  const fetchDirectMessageSenders = async () => {
    if (!contract) return

    try {
      setLoading(true)

      // Get incomingcoming direct message senders
      const sendersList = await contract.getDirectMessageSenders()

      // Create a set to track unique addresses
      const uniqueAddresses = new Set<string>()

      // Process incoming message senders
      const sendersWithNames = await Promise.all(
        sendersList.map(async (sender: string) => {
          uniqueAddresses.add(sender.toLowerCase())
          try {
            const exists = await contract.checkUserExists(sender)
            let name = formatAddress(sender) // Default to formatted address

            if (exists) {
              const username = await contract.getUsername(sender)
              if (username) {
                name = username
              }
            }

            // Get the last message for timestamp
            const messages = await contract.readDirectMessage(sender)
            let lastMessageInfo = { lastMessage: "", lastMessageTime: 0 }

            if (messages && messages.length > 0) {
              const lastMsg = messages[messages.length - 1]
              lastMessageInfo = {
                lastMessage: lastMsg.msg,
                lastMessageTime: Number(lastMsg.timestamp),
              }
            }

            return {
              pubkey: sender,
              name,
              isFriend: false,
              ...lastMessageInfo,
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

      // Now check for outgoing messages to non-registered users
      // This is a simplified approach - in a production app, you might want to store this data differently
      try {
        // We'll check the user's recent transactions or use local storage in a real app
        // For now, let's add a way to manually add non-registered contacts

        setDirectMessageSenders(sendersWithNames)
      } catch (error) {
        console.error("Error checking outgoing messages:", error)
        setDirectMessageSenders(sendersWithNames)
      }
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

  // Add this after the fetchDirectMessageSenders function
  const addNonRegisteredContact = (address: string) => {
    if (!ethers.isAddress(address)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    // Check if this address is already in our contacts
    if (allContacts.some((c) => c.pubkey.toLowerCase() === address.toLowerCase())) {
      toast({
        title: "Contact Exists",
        description: "This address is already in your contacts",
      })
      return
    }

    const newContact = {
      pubkey: address,
      name: formatAddress(address),
      isFriend: false,
    }

    setDirectMessageSenders((prev) => [...prev, newContact])
  }

  // Helper function to format address
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Helper function to get display name
  const getDisplayName = (contact: Contact) => {
    if (!contact) return "Unknown"
    if (contact.name && contact.name !== formatAddress(contact.pubkey)) {
      return contact.name
    }
    return formatAddress(contact.pubkey)
  }

  // Helper function to get avatar initials
  const getAvatarInitials = (contact: Contact) => {
    if (!contact) return "??"
    if (contact.name && contact.name !== formatAddress(contact.pubkey)) {
      return contact.name.substring(0, 2).toUpperCase()
    }
    return contact.pubkey.substring(2, 4).toUpperCase()
  }

  // Filter contacts based on search query
  const filteredContacts = allContacts
    .filter((contact) => {
      // First apply the friends/all filter
      if (filter === "friends" && contact.isFriend !== true) {
        return false
      }

      // Then apply the search filter
      if (!searchQuery) return true

      const displayName = getDisplayName(contact).toLowerCase()
      const address = contact.pubkey.toLowerCase()
      const query = searchQuery.toLowerCase()

      return displayName.includes(query) || address.includes(query)
    })
    .sort((a, b) => {
      // Sort by most recent message first
      if (a.lastMessageTime && b.lastMessageTime) {
        return b.lastMessageTime - a.lastMessageTime
      }
      // If no message time, put friends first
      if (a.isFriend && !b.isFriend) return -1
      if (!a.isFriend && b.isFriend) return 1
      // Otherwise sort alphabetically
      return getDisplayName(a).localeCompare(getDisplayName(b))
    })

  if (loading && filteredContacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 p-4">
        <div className="animate-spin h-8 w-8 border-2 border-redbelly-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filter */}
      <div className="p-3 border-b">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-100 border-gray-200"
          />
        </div>

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
            Friends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNewMessage}
            className="bg-redbelly-red text-white hover:bg-red-600 border-0"
            title="New Message"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageContacts}
            className="border-gray-200 text-gray-700 hover:bg-gray-100"
            title="Manage Contacts"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact list */}
      <ScrollArea className="flex-1">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 p-4">
            <UserCircle className="h-10 w-10 mb-2 text-gray-400" />
            <p className="text-center text-sm">
              {searchQuery
                ? "No contacts match your search"
                : filter === "all"
                  ? "No contacts yet. Add friends or send direct messages to start chatting!"
                  : "No friends yet. Add friends to start chatting!"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.pubkey}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors",
                  selectedContact?.pubkey === contact.pubkey ? "bg-gray-100" : "",
                )}
                onClick={() => onSelectContact(contact)}
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-white",
                      contact.isFriend
                        ? "bg-gradient-to-br from-redbelly-red to-red-700"
                        : "bg-gradient-to-br from-gray-700 to-gray-900",
                    )}
                  >
                    {getAvatarInitials(contact)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate">{getDisplayName(contact)}</p>
                    {contact.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(contact.lastMessageTime * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center">
                    {contact.lastMessage ? (
                      <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                    ) : (
                      <p className="text-xs text-gray-400 flex items-center">
                        {formatAddress(contact.pubkey)}
                        {contact.isFriend === false && (
                          <span className="ml-2 flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Direct
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

