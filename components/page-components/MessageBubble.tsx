import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react"; // Lucide icons
import LoadingCard from "./LoadingCard";
import ExpandViewDialog from "./ExpandViewDialog"
import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
type MessageProps = {
  id?:number
  chat_id?:string
  role: "user" | "assistant";
  body: { [key: string]: string | number | boolean };
  isLoading ? : boolean
};
function isJsonString(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    // JSON must be an object or array
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

const MessageBubble = ({ id, chat_id, role, body }: MessageProps) => {
  const [open, setOpen] = useState(false);
  const messageContent = isJsonString(body) ? JSON.parse(body) : body
  const isUser = role === "user";
  
  return (
    <div
      className={cn(
        "flex items-start gap-2 my-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Show Icon */}
      {!isUser && (
        <div className="p-2 bg-muted rounded-full">
          <Bot className="h-5 w-5 text-black" />
        </div>
      )}

      {/* Message Text */}
      <div
        className={cn(
          "p-3 rounded-xl max-w-[70%] whitespace-pre-wrap",
          isUser
            ? "bg-primary text-white"
            : "bg-muted text-black"
        )}
      >
        <>
        
  {messageContent?.isLoading && messageContent?.type === 'text' ? (
    <LoadingCard />
  ) : messageContent?.type === 'text' ? (
    <div>{messageContent.text}</div>
  ) : null}
  
  {(messageContent?.type === 'Expand_View' || messageContent?.type === 'Table_View') && (
    <Card className="w-full max-w-sm shadow-lg rounded-2xl overflow-hidden">
    <div className="relative h-32 w-full">
      <Image
        src="/monitor.png"
        alt="Sample Image"
        fill
        className="object-contain rounded-lg"
      />
    </div>
    <CardContent className="p-4 text-center">
      <p className="font-bold text-md mb-2">{messageContent.text}</p>
      <Button className="w-full" onClick={() => setOpen(true)}>Expand</Button>
    </CardContent>
  </Card>

  )}
  {(messageContent?.type === 'no_data') && (
     <div>{messageContent.text}</div>
  )}
</>

        
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="p-2 bg-primary rounded-full">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
      
      <ExpandViewDialog id={id} chat_id={chat_id} open={open} setOpen={setOpen} />
    </div>
  );
};

export default MessageBubble;
