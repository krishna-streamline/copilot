"use client";

import { useEffect, useState } from "react";
import { Home, MessageCircle, Calendar, Search, Settings,Folder } from "lucide-react";

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

const staticItems = [
  { title: "Home", url: "#", icon: Home },
  { title: "Calendar", url: "#", icon: Calendar },
  { title: "Search", url: "#", icon: Search },
  { title: "Settings", url: "#", icon: Settings },
];
type Collection = {
  id: number;
  title: string;
};
const ChatSidebar = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      const token = localStorage.getItem("auth_token");
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
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch("/api/copilots/chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setChats(data);
      }
    };

    fetchChats();
    fetchCollections();
  }, []);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

  return (
    <Sidebar className="mt-4">
      <SidebarContent>
      <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections.map((collection) => (
                <SidebarMenuItem key={collection.id}>
                  <SidebarMenuButton asChild>
                    <a href={`/?collection_id=${collection.id}`}>
                      <Folder className="mr-2" />
                      <span>{collection.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.CHAT_ID}>
                  <SidebarMenuButton asChild>
                    <a href={`/?token=${token}&&chat_id=${chat.CHAT_ID}`}>
                    <MessageCircle />
                      <span>{chat.TITLE.replaceAll('"',"")}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>
    </Sidebar>
  );
};

export default ChatSidebar;
