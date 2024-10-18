import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Settings, Bell, Send, Paperclip, Mic } from "lucide-react"

export default function AdvancedChatUI() {
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [selectedConversation, setSelectedConversation] = useState(null)

  const conversations = [
    { id: 1, name: "AjeethKumar R", avatar: "/placeholder-user.jpg", lastMessage: "Hey bro", time: "3:41 PM" },
    { id: 2, name: "Sarah Lee", avatar: "/placeholder-user.jpg", lastMessage: "See you tomorrow!", time: "2:30 PM" },
    { id: 3, name: "John Doe", avatar: "/placeholder-user.jpg", lastMessage: "Thanks for your help", time: "11:20 AM" },
  ]

  const messages = [
    { id: 1, sender: "AjeethKumar R", content: "Hey bro", time: "3:41 PM" },
    { id: 2, sender: "You", content: "Hi there! What's up?", time: "3:42 PM" },
    { id: 3, sender: "AjeethKumar R", content: "Not much, just working on some code. How about you?", time: "3:43 PM" },
    { id: 4, sender: "You", content: "Same here. Working on a new project. It's pretty exciting!", time: "3:45 PM" },
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-8 flex justify-center items-center">
      <div className="w-full max-w-6xl h-[80vh] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden flex">
        {/* Left side - Conversation list */}
        <div className="w-1/3 border-r border-gray-200 border-opacity-50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 transition-all duration-300">
                  <Bell className="h-5 w-5 text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white bg-opacity-50 hover:bg-opacity-75 transition-all duration-300">
                  <Settings className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10 pr-4 py-2 w-full bg-white bg-opacity-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[calc(100%-130px)]">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center p-4 rounded-2xl hover:bg-white hover:bg-opacity-50 transition-all duration-300 cursor-pointer mb-2 ${
                    selectedConversation === conversation.id ? "bg-white bg-opacity-50" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                    <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white">
                      {conversation.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    <h2 className="text-sm font-semibold text-gray-800">{conversation.name}</h2>
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                  </div>
                  <span className="text-xs text-gray-400">{conversation.time}</span>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 flex justify-between items-center">
            <p className="text-white font-medium">New Chat</p>
            <Button className="rounded-full bg-white text-indigo-600 hover:bg-opacity-90 transition-all duration-300">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Right side - Chat window */}
        <div className="w-2/3 flex flex-col">
          <div className="p-6 border-b border-gray-200 border-opacity-50">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                <AvatarImage src="/placeholder-user.jpg" alt="AjeethKumar R" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white">
                  A
                </AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-800">AjeethKumar R</h2>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-grow p-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "You" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    msg.sender === "You"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "bg-white bg-opacity-50 text-gray-800"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-6 bg-white bg-opacity-50">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // Handle message send
                setMessage("")
              }}
              className="flex items-center space-x-4"
            >
              <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                className="flex-grow bg-white bg-opacity-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-600">
                <Mic className="h-5 w-5" />
              </Button>
              <Button type="submit" className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-all duration-300">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}