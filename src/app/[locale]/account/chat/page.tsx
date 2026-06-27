'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  connectChatSocket, getChatSocket,
  joinChat, leaveChat, sendChatMessage, emitTyping,
} from '@/lib/socket';
import { getChats, getChatMessages, markChatRead } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { ChevronRight, Send } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string | null;
  profilePhoto: string | null;
  phone: string;
}

interface ChatListing {
  id: string;
  title: string;
  coverPhoto: string | null;
  adNumber: string;
}

interface Chat {
  id: string;
  listingId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  otherParticipant: Participant;
  unreadCount: number;
  listing?: ChatListing;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Avatar({ participant, size = 40 }: { participant: Participant; size?: number }) {
  const s = `${size}px`;
  if (participant.profilePhoto) {
    return (
      <Image
        src={participant.profilePhoto} alt={participant.name ?? ''}
        width={size} height={size}
        className="rounded-full object-cover shrink-0"
        unoptimized
      />
    );
  }
  const initial = (participant.name ?? participant.phone).charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-[#F5A623] text-white font-bold flex items-center justify-center shrink-0 text-sm"
      style={{ width: s, height: s }}
    >
      {initial}
    </div>
  );
}

function formatMsgTime(str: string) {
  try {
    const d = new Date(str);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const MSG_LIMIT = 50;

export default function ChatPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('chatId');

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotal, setMsgTotal] = useState(0);
  const msgPages = Math.ceil(msgTotal / MSG_LIMIT);

  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [input, setInput] = useState('');
  const lastTypingEmit = useRef(0);

  const [showMobileMessages, setShowMobileMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  // ── Scroll helpers ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  // ── Load messages ───────────────────────────────────────────────────────
  const loadMessages = useCallback(async (chatId: string, pg = 1, prepend = false) => {
    setMsgsLoading(true);
    try {
      const res = await getChatMessages(chatId, pg, MSG_LIMIT);
      const newMsgs = res.data ?? [];
      if (prepend) {
        setMessages((prev) => [...newMsgs, ...prev]);
      } else {
        setMessages(newMsgs);
        scrollToBottom();
      }
      setMsgPage(pg);
      setMsgTotal(res.total);
    } catch { /* ignore */ }
    finally { setMsgsLoading(false); }
  }, [scrollToBottom]);

  // ── Select chat ─────────────────────────────────────────────────────────
  const selectChat = useCallback((chat: Chat) => {
    // Leave previous
    if (activeChatIdRef.current && activeChatIdRef.current !== chat.id) {
      leaveChat(activeChatIdRef.current);
    }
    setActiveChat(chat);
    activeChatIdRef.current = chat.id;
    setMessages([]);
    setMsgPage(1);
    setMsgTotal(0);
    setShowMobileMessages(true);

    joinChat(chat.id);
    markChatRead(chat.id).catch(() => {});
    // Clear unread in list
    setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    loadMessages(chat.id, 1, false);
  }, [loadMessages]);

  // ── Socket setup ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectChatSocket() ?? getChatSocket();
    if (!socket) return;

    const handleNewMessage = ({ chatId, message }: { chatId: string; message: Message }) => {
      setChats((prev) => prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: chatId === activeChatIdRef.current ? 0 : c.unreadCount + 1,
            }
          : c
      ));
      if (chatId === activeChatIdRef.current) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          return exists ? prev : [...prev, message];
        });
        scrollToBottom();
      }
    };

    const handleTyping = (userId: string) => {
      if (userId === user?.id) return;
      setOtherTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3000);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [user?.id, scrollToBottom]);

  // ── Load chat list on mount ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      setChatsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await getChats() as any;
        if (!mounted) return;
        const list: Chat[] = Array.isArray(data) ? data : data?.data ?? [];
        setChats(list);
        if (initialChatId) {
          const found = list.find((c) => c.id === initialChatId);
          if (found) selectChat(found);
        }
      } catch { /* ignore */ }
      finally { if (mounted) setChatsLoading(false); }
    }
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeChat) return;
    sendChatMessage(activeChat.id, text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeChat) return;
    const now = Date.now();
    if (now - lastTypingEmit.current > 2000) {
      lastTypingEmit.current = now;
      emitTyping(activeChat.id);
    }
  };

  // ── Back on mobile ──────────────────────────────────────────────────────
  const handleBack = () => {
    if (activeChatIdRef.current) leaveChat(activeChatIdRef.current);
    setActiveChat(null);
    activeChatIdRef.current = null;
    setShowMobileMessages(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="flex overflow-hidden bg-[#F9F9F9]"
      style={{ height: 'calc(100dvh - 64px)' }}
      dir="rtl"
    >
      {/* ── Chat list ───────────────────────────────────────────────────── */}
      <div className={`
        w-full lg:w-80 lg:flex flex-col shrink-0
        border-e border-gray-100 bg-white
        ${showMobileMessages ? 'hidden' : 'flex'}
      `}>
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#222222]">المحادثات</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
              <span className="text-5xl">💬</span>
              <p className="text-sm font-bold text-[#222222]">لا توجد محادثات بعد</p>
              <p className="text-xs text-[#717171]">ابدأ محادثة من صفحة أي إعلان</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              const name = chat.otherParticipant.name ?? chat.otherParticipant.phone;
              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right border-e-2 transition-all ${
                    isActive
                      ? 'bg-orange-50 border-[#F5A623]'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <Avatar participant={chat.otherParticipant} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-[#222222] truncate">{name}</p>
                      {chat.lastMessageAt && (
                        <p className="text-[10px] text-[#717171] shrink-0">
                          {timeAgo(chat.lastMessageAt)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-[#717171] truncate mt-0.5">
                      {chat.lastMessage ?? 'ابدأ المحادثة'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {chat.listing?.coverPhoto && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                        <Image src={chat.listing.coverPhoto} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Messages panel ──────────────────────────────────────────────── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${showMobileMessages || !activeChat ? 'flex' : 'hidden lg:flex'}
      `}>
        {!activeChat ? (
          <div className="hidden lg:flex flex-1 items-center justify-center flex-col gap-3 text-center px-6">
            <span className="text-6xl opacity-30">💬</span>
            <p className="text-base font-bold text-[#222222]">اختر محادثة</p>
            <p className="text-sm text-[#717171]">اختر محادثة من القائمة لعرض الرسائل</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              {/* Back on mobile */}
              <button onClick={handleBack} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={20} className="text-[#222222]" />
              </button>

              <Avatar participant={activeChat.otherParticipant} size={38} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#222222] truncate">
                  {activeChat.otherParticipant.name ?? activeChat.otherParticipant.phone}
                </p>
                {activeChat.listing && (
                  <p className="text-xs text-[#717171] truncate">{activeChat.listing.title}</p>
                )}
              </div>

              {activeChat.listing?.coverPhoto && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={activeChat.listing.coverPhoto} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {/* Load earlier */}
              {msgPage < msgPages && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={() => loadMessages(activeChat.id, msgPage + 1, true)}
                    disabled={msgsLoading}
                    className="text-xs text-[#F5A623] font-medium border border-[#F5A623] px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors"
                  >
                    {msgsLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </button>
                </div>
              )}

              {msgsLoading && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <span className="animate-spin rounded-full h-6 w-6 border-2 border-[#F5A623] border-t-transparent" />
                </div>
              )}

              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-start' : 'items-end'}`}>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                        isMine
                          ? 'bg-[#F5A623] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-[#717171] mt-0.5 px-1">
                        {formatMsgTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherTyping && (
                <div className="flex justify-end">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0 mb-14 lg:mb-0">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالة..."
                  className="flex-1 h-11 px-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-full bg-[#F5A623] hover:bg-[#E09400] disabled:opacity-50 flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={18} className="text-white rotate-180" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
