import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  solicitud_id: string | null;
  customer_id: string;
  workshop_id: string;
  last_message_at: string | null;
  created_at: string;
  other_user_name?: string;
  other_user_avatar?: string | null;
  last_message?: string;
  unread_count?: number;
  solicitud?: {
    device_brand: string;
    device_model: string;
  } | null;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          solicitud:solicitudes(device_brand, device_model)
        `)
        .or(`customer_id.eq.${user.id},workshop_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (convError) throw convError;

      // For each conversation, get the other user's profile and last message
      const enrichedConversations = await Promise.all(
        (convData || []).map(async (conv) => {
          const otherUserId = conv.customer_id === user.id ? conv.workshop_id : conv.customer_id;

          // Get other user's profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, workshop_name, avatar_url")
            .eq("user_id", otherUserId)
            .maybeSingle();

          // Get last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_user_name: profileData?.workshop_name || profileData?.full_name || "Usuario",
            other_user_avatar: profileData?.avatar_url,
            last_message: lastMessageData?.content,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (workshopId: string, solicitudId?: string) => {
    if (!user) return null;

    // Check if conversation already exists for this specific solicitud
    let query = supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", user.id)
      .eq("workshop_id", workshopId);

    if (solicitudId) {
      query = query.eq("solicitud_id", solicitudId);
    } else {
      query = query.is("solicitud_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) return existing.id;

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: user.id,
        workshop_id: workshopId,
        solicitud_id: solicitudId || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    return newConv.id;
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    getOrCreateConversation,
  };
}

export function useConversation(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false);
    }
    setLoading(false);
  };

  const sendMessage = async (content: string, recipientId?: string) => {
    if (!conversationId || !user || !content.trim()) return false;

    const { data: newMessage, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return false;
    }

    // Immediately update local state
    if (newMessage) {
      setMessages((prev) => [...prev, newMessage]);
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Send notification to the recipient
    if (recipientId) {
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "message",
        title: `Nuevo mensaje de ${user.user_metadata?.full_name || "Usuario"}`,
        message: content.trim().substring(0, 100) + (content.length > 100 ? "..." : ""),
        link: `/mensajes?conversation=${conversationId}`,
        read: false,
      });

      if (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return true;
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Prevent duplicates if already added by sendMessage
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
