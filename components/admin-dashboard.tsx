"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, MessageSquare, RefreshCw } from "lucide-react"
import type { ethers } from "ethers"

interface AdminDashboardProps {
  contract: ethers.Contract | null
}

export default function AdminDashboard({ contract }: AdminDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [userCount, setUserCount] = useState<number | null>(null)
  const [messageCount, setMessageCount] = useState<number | null>(null)

  // This function would work if the contract had a userCount variable
  const fetchStats = async () => {
    if (!contract) return

    setLoading(true)
    try {
      // Get user count using the new functions
      const users = await contract.userCount()
      setUserCount(Number(users))

      // Get message count
      const messages = await contract.totalMessageCount()
      setMessageCount(Number(messages))
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contract) {
      fetchStats()
    }
  }, [contract])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Echo Admin Dashboard</h2>
        <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-redbelly-red" />
              Total Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-redbelly-red" />
              </div>
            ) : userCount !== null ? (
              <p className="text-4xl font-bold">{userCount}</p>
            ) : (
              <div className="py-4 text-gray-500">
                <p>Not available in current contract</p>
                <p className="text-sm mt-1">Contract needs modification to track user count</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-redbelly-red" />
              Total Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-redbelly-red" />
              </div>
            ) : messageCount !== null ? (
              <p className="text-4xl font-bold">{messageCount}</p>
            ) : (
              <div className="py-4 text-gray-500">
                <p>Not available in current contract</p>
                <p className="text-sm mt-1">Contract needs modification to track message count</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">How to enable user counting</h3>
        <p className="text-sm text-gray-600 mb-2">
          To track the number of users, the contract needs to be modified to include:
        </p>
        <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
          {`// Add a counter variable
uint256 public userCount = 0;

// Increment in createAccount function
function createAccount(string calldata name) external {
    // existing checks...
    
    userList[msg.sender].name = name;
    // other assignments...
    
    userCount++; // Increment the counter
}`}
        </pre>
      </div>
    </div>
  )
}

