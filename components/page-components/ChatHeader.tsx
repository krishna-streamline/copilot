"use client";

import { SidebarTrigger } from "../ui/sidebar";
import { MessageCirclePlus, SquareTerminal } from "lucide-react"; // Assuming you're using lucide-react
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import prompts from '@/lib/prompts.json';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
type Prompt = {
  category: string;
  subcategory: string;
  prompt: string;
};
type ChatHeaderProps = {
  send: (message: string) => void;
  title:string;
};
const categories = ["All", ...new Set(prompts.map(p => p.category))];
const ChatHeader = ({ title, send }: ChatHeaderProps) => {
  const { setTheme } = useTheme()
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");

  const filteredSubcategories = selectedCategory === "All"
    ? []
    : ["All", ...new Set(prompts.filter(p => p.category === selectedCategory).map(p => p.subcategory))];

  const filteredPrompts = prompts.filter(p => {
    const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchSubcategory = selectedSubcategory === "All" || p.subcategory === selectedSubcategory;
    return matchCategory && matchSubcategory;
  });
  const handleMessageClick = () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      router.push(`/?token=${token}`);
    }
   
  };
  
  

 
  return (
    <div className="flex items-center justify-between p-4">
      
      {/* Left: Sidebar Trigger */}
      <SidebarTrigger />
      <h2><strong>{title}</strong></h2>
      {/* Right: Action Icons */}
      <div className="flex items-center space-x-4">
        <MessageCirclePlus
          className="w-6 h-6 cursor-pointer hover:text-gray-300"
          onClick={handleMessageClick}
        />
        <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center rounded-full text-foreground hover:text-muted-foreground transition-colors focus:outline-none"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {
    (send) ? (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <SquareTerminal />
        </DialogTrigger>

        <DialogContent className="w-[80vw] h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Prompts</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-y-auto flex flex-col gap-6 py-4">

          {/* Dropdowns */}
          <div className="flex gap-4 mb-6">
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setSelectedSubcategory("All");
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat, idx) => (
                  <SelectItem key={idx} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {(filteredSubcategories.length > 0 ? filteredSubcategories : ["All"]).map((sub, idx) => (
                  <SelectItem key={idx} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrompts.map((prompt, idx) => (
              <Card key={idx} className="border border-gray-300 p-4 hover:shadow-md cursor-pointer" onClick={() => { setOpen(false); send(prompt?.prompt) }}>
                <div className="flex flex-col space-y-2">
                  <h2 className="font-semibold">{prompt.category}</h2>
                  <Badge variant="outline">{prompt.subcategory}</Badge>
                  <p className="text-sm text-gray-600">{prompt.prompt}</p>
                </div>
              </Card>
            ))}
          </div>
          </div>
        </DialogContent>
      </Dialog> 
    ): null 
  }       

      </div>

     
    </div>
  );
};

export default ChatHeader;
