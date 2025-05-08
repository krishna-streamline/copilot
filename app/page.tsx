"use client";

import { Card } from "@/components/ui/card";
import { useSetAtom } from 'jotai';
import { refreshCounterAtom } from '@/lib/atoms/refreshCounter';
import ChatInput from "@/components/page-components/ChatInput";

import ChatHeader from "@/components/page-components/ChatHeader";
import MessageBubble from "@/components/page-components/MessageBubble";
import mostUsedPrompts from '@/components/data/most_imp_prompts.json'
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
type Message = {
  id:number,
  chat_id:string,
  role: "user" | "assistant";
  body: { [key: string]: string | number | boolean };
  isLoading ? : boolean
};
const initialMessages: Message[] = [];

const isJsonString = (value: string): boolean => {
  try {
    const parsed = JSON.parse(value);
    // JSON must be an object or array
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}
export default function Home() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const chatId = searchParams.get("chat_id") || "";
  const store = searchParams.get("store") || "";
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('New Chat')
  const incrementRefreshCounter = useSetAtom(refreshCounterAtom);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inProgress, setInProgress] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState(chatId)
  const [refreshChatMessage, setRefreshChatMessage] = useState(0)
  const [response, setResponse] = useState<any>(null);

  
  const deviceSerialNo = searchParams.get("deviceSerialNo") || "";
  useEffect(()=>{
    localStorage.setItem('auth_token', token)
    if(!token){
      router.replace("/401"); // 👈 Redirect if no token
    }
  },[token,router])
  useEffect(()=>{
    if(chatId && chatId.length){
      try {
        const fetchChatInfo = async() => {
          const res = await fetch(`/api/copilots/chats/${chatId}`);
          const chatInfo = await res.json();
          if (res.ok) {
            setTitle(chatInfo.title)
          }
        }
        
        fetchChatInfo()
        
      } catch (err: any) {
        
      } finally {
        
      }
    }
  },[chatId])
  useEffect(() => {
    const fetchChats = async() =>{
      const res = await fetch(`/api/copilots/chats/${selectedChatId}/messages`);
    const messagesList = await res.json();
    if (res.ok) {
      const messagesListArr= []
      
      if(messagesList && messagesList.length){
        messagesList.forEach(msg => {
          const customMessage = {}
          customMessage.role = msg['ROLE']
          customMessage.body = JSON.parse(msg['MESSAGE'])
          customMessage.id = msg['ID']
          customMessage.chat_id = chatId
          messagesListArr.push(customMessage)
        })
        
      }
      setMessages(messagesListArr)
    } else {
      
    }
    }
    if(selectedChatId && selectedChatId.length){
    fetchChats()
    }
  },[selectedChatId, refreshChatMessage])
  useEffect(()=>{
    console.log(message)
  },[message])
  const generateSqlString = async (chatId) => {
         
    try {
      const res = await fetch(`/api/generate-sql?chat_id=${chatId}&&store_id=${store}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedChatId(data['CHAT_ID'])
        setRefreshChatMessage(prev => prev + 1);
        setInProgress(false)

      } else {
        setError(data.error || 'Failed to generate SQL');
      }
    } catch (err: any) {
      
    } finally {
      
    }
  };
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
  
    const newMessage: Message = { role: "user" };
    newMessage.body = {}
    newMessage.body.type = 'text'
    newMessage.body.text = text;
    const totalMessages = ([...messages, newMessage]);
    setMessages(totalMessages);
    setMessage("");
    // Simulate bot reply
    const botReply: Message = {
      role: "assistant",
      body: {},
    };
    botReply.body.type = 'text'
    botReply.body.isLoading = true
    botReply.isLoading= true
  
    setTimeout(() => {
      setMessages((prev) => [...prev, botReply]);
    }, 100);
    try {
      const res = await fetch('/api/copilots/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message:text }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
        const chatId = data.chat_id;
        setTitle(data.title.replaceAll("/",'').replaceAll('"','') || 'New Chat')
        incrementRefreshCounter((prev) => prev + 1);
        
        generateSqlString(chatId);
      } else {
        console.error('API error:', data);
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Server error');
    }

    
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
    <MessageBubble id={msg.id} chat_id={msg.chat_id} role={msg.role} body={msg.body} isLoading={inProgress} />
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
