"use client";

import { Card } from "@/components/ui/card";

import { PenLine, Newspaper, Plane, Sparkles, FileStack, Code } from "lucide-react";
import ChatInput from "@/components/page-components/ChatInput";

import ChatHeader from "@/components/page-components/ChatHeader";
import MessageBubble from "@/components/page-components/MessageBubble";
import mostUsedPrompts from '@/components/data/most_imp_prompts.json'
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
type Message = {
  role: "user" | "assistant";
  text: string;
};
const initialMessages: Message[] = [];


export default function Home() {
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('New Chat')
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inProgress, setInProgress] = useState(false)
  const [response, setResponse] = useState<any>(null);

  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const chatId = searchParams.get("chat_id") || "";
  const store = searchParams.get("store") || "";
  const deviceSerialNo = searchParams.get("deviceSerialNo") || "";
  useEffect(()=>{
    localStorage.setItem('auth_token', token)
    if(!token){
      router.replace("/401"); // 👈 Redirect if no token
    }
  },[token,router])
  useEffect(()=>{
    console.log(message)
  },[message])

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
  
    const newMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    try {
      const res = await fetch('/api/copilots/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
        console.log('Chat Created:', data);
        const chatId = data.chat_id;
        const fetchData = async () => {
         
          try {
            const res = await fetch(`/api/generate-sql?chat_id=${chatId}`);
            const data = await res.json();
            if (res.ok) {
             
            } else {
              setError(data.error || 'Failed to generate SQL');
            }
          } catch (err: any) {
            
          } finally {
            
          }
        };
        fetchData();
      } else {
        console.error('API error:', data);
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Server error');
    }

    // Simulate bot reply
    const botReply: Message = {
      role: "assistant",
      text: `Echo: ${text}`,
    };
  
    setTimeout(() => {
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };
  
  return (
   
    
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader send={setMessage} title={title} />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
  {/* Chat Messages */}
  <div className="w-full max-w-3xl flex flex-col space-y-2">
  {messages.length > 0 && messages.map((msg, idx) => (
  <div key={idx} className="flex flex-col">
    <MessageBubble role={msg.role} text={msg.text} />
  </div>
))}

  </div>

  {/* Most Used Prompts */}
  <div className="w-full max-w-6xl mt-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {!messages.length && mostUsedPrompts.map((prompt, index) => (
        <Card key={index} className="border border-gray-300 p-4 hover:shadow-md cursor-pointer" onClick={() => {  setMessage(prompt?.prompt) }}>
        <div className="flex flex-col space-y-2">
          <h2 className="font-semibold">{prompt.category}</h2>
          <Badge variant="outline">{prompt.subcategory}</Badge>
          <p className="text-sm text-gray-600">{prompt.prompt}</p>
        </div>
      </Card>
      ))}
    </div>
  </div>
</div>


      {/* Chat Input at Bottom */}
      <ChatInput message={message} handleSend={handleSend} inProgress={inProgress} setInProgress={setInProgress} />
    </div>
  


    
  );
}
