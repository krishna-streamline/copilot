"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import LoadingCard from "./LoadingCard";
import ExpandViewDialog from "./ExpandViewDialog";
import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MessageProps = {
  id?: number;
  chat_id?: string;
  role: "user" | "assistant";
  body: { [key: string]: string | number | boolean };
  isLoading?: boolean;
};

function isJsonString(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

const MessageBubble = ({ id, chat_id, role, body }: MessageProps) => {
  const [open, setOpen] = useState(false);
  const messageContent = isJsonString(body) ? JSON.parse(body) : body;
  const isUser = role === "user";

  return (
    <div className={cn("flex items-start gap-3 my-4", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar */}
      {!isUser && (
        <div className="p-2 rounded-full bg-muted flex items-center justify-center shadow-sm">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Bubble */}
      <Card
        className={cn(
          "max-w-[50%] w-full shadow-sm rounded-2xl border bg-card text-card-foreground p-4 transition-all duration-300 space-y-4",
          isUser ? "ml-auto" : "mr-auto"
        )}
      >
        {/* Loading Text */}
        {messageContent?.isLoading && messageContent?.type === "text" ? (
          <LoadingCard />
        ) : messageContent?.type === "text" ? (
          <p className="text-sm leading-relaxed break-words">{messageContent.text}</p>
        ) : null}

        {/* Expand View / Table View */}
        {(messageContent?.type === "Expand_View" || messageContent?.type === "Table_View") && (
          <div className="flex flex-col items-center text-center space-y-3">
            <Image
              src="/monitor.png"
              alt="Monitor Icon"
              width={100}
              height={100}
              className="object-contain"
            />
            <p className="text-sm font-semibold">{messageContent.text}</p>
            <Button className="w-full" onClick={() => setOpen(true)}>
              Expand
            </Button>
          </div>
        )}

        {/* No Data */}
        {messageContent?.type === "no_data" && (
          <p className="text-muted-foreground text-sm text-center">{messageContent.text}</p>
        )}
      </Card>

      {/* User Icon */}
      {isUser && (
        <div className="p-2 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      {/* Dialog */}
      <ExpandViewDialog id={id} chat_id={chat_id} open={open} setOpen={setOpen} />
    </div>
  );
};

export default MessageBubble;
