"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea"


type ChatInputProps = {
  message: string;
  handleSend: (message: string) => void;
  inProgress: boolean;
  setInProgress: (status: boolean) => void;
};

const ChatInput = ({ message, handleSend,inProgress,setInProgress }: ChatInputProps) => {
  const [promptMessage, setPromptMessage] = useState(message);

  useEffect(() => {
    setPromptMessage(message);
  }, [message]);

  const onSendClick = () => {
    console.log("Welcome",promptMessage )
    setInProgress(true)
    handleSend(promptMessage); // pass promptMessage to parent
    setPromptMessage(""); // Clear input after sending
  };

  return (
    <div className="w-full p-4">
      <div className="relative max-w-4xl mx-auto">
      <Textarea
  placeholder="Ask me anything..."
  value={promptMessage}
  onChange={(e) => setPromptMessage(e.target.value)}
  rows={2}
  className="w-full rounded-2xl border border-[#333333] placeholder-gray-500 resize-none p-4 pr-14 focus:outline-none focus:ring-0"
/>
        <Button
          className="absolute bottom-2 right-2 bg-black rounded-full text-white hover:bg-gray-900"
          disabled={inProgress}
          onClick={onSendClick}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
