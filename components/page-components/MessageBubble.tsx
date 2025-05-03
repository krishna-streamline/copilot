import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react"; // Lucide icons

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

const MessageBubble = ({ role, text }: MessageProps) => {
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
            ? "bg-blue-500 text-white"
            : "bg-muted text-black"
        )}
      >
        {text}
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="p-2 bg-blue-500 rounded-full">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
