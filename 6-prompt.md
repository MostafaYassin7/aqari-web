[PASTE SESSION HEADER ABOVE FIRST]

Build the Chat feature using Socket.io.
Protected — requires login.

Install:
  npm install socket.io-client

─── STEP 1: SOCKET SERVICE ──────────────────────────────────

Create src/lib/socket.ts:

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://api.aqora.sa';

let chatSocket: Socket | null = null;

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('aqar-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

export function connectChatSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;
  if (chatSocket?.connected) return chatSocket;

  chatSocket = io(`${SOCKET_URL}/chat`, {
    transports: ['websocket'],
    auth: { token: `Bearer ${token}` },
    // token goes in auth object NOT in headers
  });

  chatSocket.on('connect', () =>
    console.log('Chat socket connected'));
  chatSocket.on('connect_error', (e) =>
    console.error('Chat socket error:', e.message));
  chatSocket.on('disconnect', () =>
    console.log('Chat socket disconnected'));

  return chatSocket;
}

export function getChatSocket() { return chatSocket; }

export function disconnectChatSocket() {
  chatSocket?.disconnect();
  chatSocket = null;
}

// Emit events
export function joinChat(chatId: string) {
  chatSocket?.emit('join_chat', chatId);
}

export function leaveChat(chatId: string) {
  chatSocket?.emit('leave_chat', chatId);
}

export function sendChatMessage(chatId: string, content: string) {
  chatSocket?.emit('send_message', { chatId, content });
}

export function emitTyping(chatId: string) {
  chatSocket?.emit('typing', chatId);
}

─── STEP 2: CONNECT AFTER LOGIN ─────────────────────────────

In the OTP verify success handler (otp/page.tsx):
After setAuth():
  import { connectChatSocket } from '@/lib/socket';
  connectChatSocket();

In logout handler (auth.store.ts or Navbar):
After logout():
  import { disconnectChatSocket } from '@/lib/socket';
  disconnectChatSocket();

─── STEP 3: CHAT API FUNCTIONS ──────────────────────────────

Add to src/lib/api.ts:

export async function getChats() {
  // Returns array of chat objects
  // Each includes otherParticipant and unreadCount
  return apiRequest<{
    id: string;
    listingId: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    otherParticipant: {
      id: string;
      name: string | null;
      profilePhoto: string | null;
      phone: string;
    };
    unreadCount: number;
    listing?: {
      id: string;
      title: string;
      coverPhoto: string | null;
      adNumber: string;
    };
  }[]>('/chats', {}, true);
}

export async function getChatMessages(
  chatId: string,
  page = 1,
  limit = 50
) {
  // Returns: { data: Message[], total, page }
  // NO pages field — calculate: Math.ceil(total/limit)
  // Order: ASC (oldest first, newest at bottom)
  return apiRequest<{
    data: {
      id: string;
      chatId: string;
      senderId: string;
      content: string;
      isRead: boolean;
      readAt: string | null;
      createdAt: string;
    }[];
    total: number;
    page: number;
  }>(`/chats/${chatId}/messages?page=${page}&limit=${limit}`,
    {}, true);
}

export async function createOrFindChat(
  participantId: string,
  listingId?: string
) {
  return apiRequest<{ id: string }>(
    '/chats',
    {
      method: 'POST',
      body: JSON.stringify(
        listingId ? { participantId, listingId }
                  : { participantId }
      ),
    },
    true
  );
}

export async function markChatRead(chatId: string) {
  return apiRequest<void>(
    `/chats/${chatId}/read`,
    { method: 'PATCH' },
    true
  );
}

─── STEP 4: CHAT PAGE ───────────────────────────────────────

Create src/app/[locale]/dashboard/chat/page.tsx:

Wrap with AuthGuard.
Connect socket on mount:
  connectChatSocket();

Layout:
  Desktop: two panels side by side
    Left: 320px chat list
    Right: flex-1 active chat
    Height: calc(100vh - navbarHeight)

  Mobile: single panel
    Default: chat list
    After selecting chat: messages panel
    Back button: returns to list

─── STEP 5: CHAT LIST ───────────────────────────────────────

On mount: getChats() → populate list

Each chat item (clickable row):
  Avatar: profilePhoto or initial letter circle
  Content:
    Name (bold) — otherParticipant.name or phone
    Last message preview (grey, 1 line, ellipsis)
    Time (small grey, relative: "منذ 5 دقائق")
  Right side:
    Listing thumbnail (if listing linked, 40x40)
    Unread badge (red circle + count, if > 0)

Active chat: bg-orange-50 border-r-2 border-[#F5A623]

On chat click:
  setActiveChat(chat)
  joinChat(chat.id)
  markChatRead(chat.id)
  Load messages

Listen for new_message socket event:
  Update lastMessage in chat list
  If not active chat: increment unreadCount

─── STEP 6: MESSAGES PANEL ──────────────────────────────────

Header:
  Avatar + name of other participant
  Listing info (if linked):
    Small thumbnail + title + adNumber

Messages area (scrollable, flex-col):
  On load: getChatMessages(chatId, page=1)
  Scroll to bottom on initial load
  Scroll to bottom on new message received

  Load earlier messages:
    "تحميل المزيد" button at top
    On click: getChatMessages(chatId, page+1)
    Prepend to messages array
    Maintain scroll position

  Message bubble:
    My messages (senderId === currentUser.id):
      Right side
      bg-[#F5A623] text-white
      rounded-2xl rounded-tr-sm

    Their messages:
      Left side
      bg-gray-100 text-gray-900
      rounded-2xl rounded-tl-sm

    Time below bubble (small grey):
      Format: HH:mm

  Typing indicator:
    Show when user_typing received
    "يكتب..." with animated dots (CSS)
    Auto-hide after 3 seconds

Input area (sticky bottom):
  Text input (full width, rounded-full)
    Placeholder: "اكتب رسالة..."
    onKeyDown Enter → send
    onInput → throttled emitTyping (once per 2s)
  Send button (→ arrow, bg-[#F5A623])
    onClick → sendChatMessage(chatId, content)
              clear input

Socket listeners (set up once on mount):
  new_message: ({ chatId, message }) →
    If message.chatId === activeChat.id:
      Append to messages
      Scroll to bottom

  user_typing: (userId) →
    If userId !== currentUser.id:
      Show typing indicator
      Set timeout 3s to hide

─── STEP 7: OPEN CHAT FROM LISTING ──────────────────────────

In /listings/[id] page contact section:
  "محادثة" button:
    If logged in:
      createOrFindChat(ownerId, listingId)
      router.push(`/dashboard/chat?chatId=${chatId}`)
    If not logged in:
      router.push('/login?redirect=/listings/' + id)

In /dashboard/chat page:
  On mount: read chatId from searchParams
  If chatId: auto-open that chat
    Find in chats list or fetch separately
    Set as active chat
    Load messages

─── TEST ────────────────────────────────────────────────────

Test with two accounts (two browser tabs):

1. Open /dashboard/chat in Tab 1
   Expected: chat list loads ✅
   Socket connects (check console) ✅

2. Click a chat
   Expected: messages load (ASC order) ✅
   Unread badge clears ✅

3. Tab 1 sends "مرحبا"
   Expected: appears right side Tab 1 ✅
             appears left side Tab 2 ✅
             instantly (Socket.io) ✅

4. Tab 2 starts typing
   Expected: Tab 1 sees "يكتب..." ✅
   Disappears after 3 seconds ✅

5. From /listings/:id click محادثة
   Expected: chat opens with listing info ✅

6. New message arrives on Tab 2 (chat not open)
   Expected: unread badge updates in list ✅