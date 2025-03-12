"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Send, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ModernChatInterface from "./modern-chat-interface"
import { useMobile } from "@/hooks/use-mobile"

interface DirectMessageProps {
  contract: ethers.Contract | null
  account: string
  onBack: () => void
}

export default function ModernDirectMessage({ contract, account, onBack }: DirectMessageProps) {
  const [receiverAddress, setReceiverAddress] = useState("")
  const [receiverName, setReceiverName] = useState("")
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [isAddressSelected, setIsAddressSelected] = useState(false)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Validate the address whenever it changes
  useEffect(() => {
    try {
      setIsValidAddress(ethers.isAddress(receiverAddress))
    } catch {
      setIsValidAddress(false)
    }
  }, [receiverAddress])

  // Check if the address has a registered name
  const checkReceiverName = async () => {
    if (!contract || !isValidAddress) return

    try {
      const exists = await contract.checkUserExists(receiverAddress)
      if (exists) {
        const name = await contract.getUsername(receiverAddress)
        setReceiverName(name)
      } else {
        setReceiverName("")
      }
      setIsAddressSelected(true)
    } catch (error) {
      console.error("Error checking receiver name:", error)
      setReceiverName("")
      setIsAddressSelected(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValidAddress) {
      checkReceiverName()

      // Store this address in local storage as a recent recipient
      try {
        const recentRecipients = JSON.parse(localStorage.getItem("recentRecipients") || "[]")
        if (!recentRecipients.includes(receiverAddress)) {
          recentRecipients.push(receiverAddress)
          localStorage.setItem("recentRecipients", JSON.stringify(recentRecipients))
        }
      } catch (error) {
        console.error("Error storing recent recipient:", error)
      }
    } else {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
    }
  }

  if (isAddressSelected) {
    return (
      <ModernChatInterface
        recipient={{
          pubkey: receiverAddress,
          name:
            receiverName ||
            `${receiverAddress.substring(0, 6)}...${receiverAddress.substring(receiverAddress.length - 4)}`,
          isFriend: false,
        }}
        contract={contract}
        account={account}
        onBack={() => setIsAddressSelected(false)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center p-4 border-b">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-medium">New Message</h2>
      </div>

      <div className="p-6 flex-1">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter Redbelly address (0x...)"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Enter the wallet address of the person you want to message</p>
          </div>

          <Button
            type="submit"
            disabled={!isValidAddress}
            className="w-full bg-redbelly-red hover:bg-red-600 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Start Conversation
          </Button>
        </form>

        <div className="mt-12 text-center">
          <div className="bg-gray-100 rounded-full p-4 inline-flex mb-4">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Direct Messaging</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            You can message any Ethereum address on the Redbelly network, even if they're not in your contacts.
          </p>
        </div>
      </div>
    </div>
  )
}

