import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useMessages, useConversation, Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MessageSquare, Send, Loader2 } from "lucide-react";

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
        <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm text-center">No tienes conversaciones</p>
        <p className="text-xs text-center mt-1">
          Las conversaciones aparecerán aquí cuando envíes o recibas mensajes sobre solicitudes
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            "w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors",
            selectedId === conv.id && "bg-muted"
          )}
        >
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conv.other_user_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {conv.other_user_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground truncate">
                  {conv.other_user_name}
                </p>
                {conv.unread_count ? (
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                ) : null}
              </div>
              {conv.solicitud && (
                <p className="text-xs text-muted-foreground">
                  {conv.solicitud.device_brand} {conv.solicitud.device_model}
                </p>
              )}
              {/* Last message preview removed */}
              <p className="text-xs text-muted-foreground/70 mt-1">
                {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>
        </button>
      ))}
    </ScrollArea>
  );
}

function ChatView({
  conversationId,
  conversation,
  onBack,
}: {
  conversationId: string;
  conversation?: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useConversation(conversationId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);

    let recipientId: string | undefined;
    if (conversation && user) {
      recipientId = conversation.customer_id === user.id ? conversation.workshop_id : conversation.customer_id;
    }

    const success = await sendMessage(newMessage, recipientId);
    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation?.other_user_avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {conversation?.other_user_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{conversation?.other_user_name}</p>
          {conversation?.solicitud && (
            <p className="text-xs text-muted-foreground">
              {conversation.solicitud.device_brand} {conversation.solicitud.device_model}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs mt-1">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Mensajes() {
  const [searchParams] = useSearchParams();
  const { conversations, loading } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Handle conversation query param
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Mensajes</h1>

        <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-200px)] min-h-[500px]">
          <div className="flex h-full">
            {/* Conversation list - hidden on mobile when chat is open */}
            <div
              className={cn(
                "w-full md:w-80 border-r border-border flex-shrink-0",
                selectedConversationId ? "hidden md:block" : "block"
              )}
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Conversaciones</h2>
              </div>
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                loading={loading}
              />
            </div>

            {/* Chat view */}
            <div
              className={cn(
                "flex-1",
                !selectedConversationId ? "hidden md:flex" : "flex"
              )}
            >
              {selectedConversationId ? (
                <div className="w-full">
                  <ChatView
                    conversationId={selectedConversationId}
                    conversation={selectedConversation}
                    onBack={() => setSelectedConversationId(null)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground flex-1">
                  <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Selecciona una conversación</p>
                  <p className="text-sm mt-1">
                    Elige una conversación de la lista para ver los mensajes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
