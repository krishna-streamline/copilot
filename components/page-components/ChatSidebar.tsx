"use client";


import { useAtom } from 'jotai';
import { refreshCounterAtom } from '@/lib/atoms/refreshCounter';
import { useEffect, useState } from "react";
import { Home, Plus,MessagesSquare, Calendar, Search, Settings,Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSearchParams,useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type ChatItem = {
  CHAT_ID: string;
  TITLE: string;
};


type Collection = {
  id: number;
  title: string;
};
const ChatSidebar = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const router = useRouter();
  const [refreshCounter] = useAtom(refreshCounterAtom);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    const fetchCollections = async () => {
      if (!token) return;

      try {
        const res = await fetch("/api/copilots/collections", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCollections(data);
        } else {
          console.error("Failed to load collections");
        }
      } catch (err) {
        console.error("Error fetching collections", err);
      }
    };

    
    const fetchChats = async () => {
      
      if (!token) return;

      const res = await fetch("/api/copilots/chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    };

    fetchChats();
    fetchCollections();
  }, [refreshCounter]);



  return (
    <Sidebar className="mt-4">
      <SidebarContent>
      <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
            <ScrollArea className="h-full">
            {collections.length === 0 ? (
          <div className="text-gray-500 text-sm pl-4 ">No Collections found</div>
        ) : null }
              {collections.map((collection) => (
                <SidebarMenuItem key={collection.ID}>
                  <SidebarMenuButton asChild>
                    <a href={`/collection?token=${token}&&collection_id=${collection.ID}`}>
                      <Folder className="mr-2" />
                      <span>{collection.TITLE}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
        <div className="flex items-center justify-between">
    <SidebarGroupLabel>Chats</SidebarGroupLabel>
    <Plus
      className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-primary"
      onClick={() => {
        if (token) {
          router.push(`/?token=${token}`);
        }
      }}
    />
  </div>
          <SidebarGroupContent>
            <SidebarMenu>
            <ScrollArea className="h-full">
            {chats.length === 0 ? (
          <div className="text-gray-500 text-sm pl-4">No chats found</div>
        ) : null }
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.CHAT_ID}>
                  <SidebarMenuButton asChild>
                    <a href={`/?token=${token}&&chat_id=${chat.CHAT_ID}`}>
                    <MessagesSquare />
                      <span>{chat.TITLE.replaceAll('"',"")}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>
    </Sidebar>
  );
};

export default ChatSidebar;
