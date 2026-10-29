import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Send, MoreVertical, CheckCheck, ArrowLeft, Paperclip, MessageSquare, Ban, User, FileText, X, Inbox, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ChatLock } from '@/components/chat/ChatLock';
import { Logo } from '@/components/common/Logo';
import { formatBytes, formatPrice, formatTime } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

/* ---------------------------------- helpers --------------------------------- */

// Deterministic presence: stable per person, most contacts appear online.
function isOnline(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 3 !== 0;
}

// List timestamp: time for today, "Yesterday", otherwise a short date.
function listTime(iso: string) {
  const d = new Date(iso);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  if (d.getTime() >= startOfToday) return formatTime(iso);
  if (d.getTime() >= startOfToday - 86_400_000) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// Separator label between chat days.
function dayLabel(iso: string) {
  const d = new Date(iso);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  if (d.getTime() >= startOfToday) return 'Today';
  if (d.getTime() >= startOfToday - 86_400_000) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ------------------------------ presence marker ------------------------------ */

function PresenceDot({ online, className = 'w-3 h-3' }: { online: boolean; className?: string }) {
  if (!online) return null;
  return (
    <span
      aria-hidden="true"
      className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-violet-800 ${className}`}
    />
  );
}

// Quick replies: one-tap openers for common buyer/seller questions
const quickReplies = [
  'Is this still available?',
  'What is your best price?',
  'Can you deliver today?',
  'When can you start?',
  'Thanks, I will confirm shortly.',
];

/* --------------------------------- component --------------------------------- */

export function MessagesPage() {
  usePageTitle('Messages');
  const { user, conversations, sendMessage, markConversationRead, toggleBlock, toggleChatUnlock, getListing, orders } = useApp();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get('c'));
  const [showChat, setShowChat] = useState(!!params.get('c'));
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'requests'>('inbox');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Open the right thread when arriving from "Contact seller"
  useEffect(() => {
    const c = params.get('c');
    if (c && conversations.some((x) => x.id === c)) {
      setSelectedId(c);
      setShowChat(true);
    }
  }, [params, conversations]);

  const unreadFor = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c || !user) return 0;
    return c.messages.filter((m) => m.senderId !== user.id && m.createdAt > c.lastReadAt).length;
  };

  // A message request: a new contact reached out first and you have not replied yet.
  // Replying accepts the conversation, so it automatically moves to the main inbox.
  const isRequest = (c: (typeof conversations)[number]) =>
    !!user &&
    c.messages.length > 0 &&
    c.messages[0].senderId === c.otherId &&
    !c.messages.some((m) => m.senderId === user.id);

  const mainList = conversations.filter((c) => !isRequest(c));
  const requestList = conversations.filter((c) => isRequest(c));
  const requestsUnread = requestList.reduce((sum, c) => sum + unreadFor(c.id), 0);
  const baseList = tab === 'inbox' ? mainList : requestList;

  const selected = useMemo(() => {
    if (selectedId) {
      const found = conversations.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return (tab === 'requests' && requestList.length > 0 ? requestList[0] : conversations[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selectedId, tab]);

  const lastMessageId = selected?.messages[selected.messages.length - 1]?.id;

  useEffect(() => {
    if (!selected) return;
    markConversationRead(selected.id);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, lastMessageId]);

  const filtered = baseList.filter((c) => {
    const t = searchQuery.trim().toLowerCase();
    if (!t) return true;
    return (
      c.otherName.toLowerCase().includes(t) ||
      (c.listingTitle || '').toLowerCase().includes(t) ||
      c.messages.some((m) => m.content.toLowerCase().includes(t))
    );
  });

  // ---------- escrow-gated chat (Postall-style) ----------
  // Applies to request-style first contacts about task/gig listings where no
  // order exists between the two parties yet.
  const convListing = selected?.listingId ? getListing(selected.listingId) : undefined;
  const hasOrderBetween =
    !!selected &&
    !!user &&
    orders.some(
      (o) =>
        o.listingId === selected.listingId &&
        ((o.buyerId === user.id && o.sellerId === selected.otherId) ||
          (o.sellerId === user.id && o.buyerId === selected.otherId))
    );
  const isTaskOrGigChat = convListing?.type === 'task' || convListing?.type === 'gig';
  const iAmListingOwner = !!convListing && !!user && convListing.seller.id === user.id;
  // I received the request (stranger initiated) and I am not the one who would fund escrow
  const chatLocked =
    !!selected &&
    !!user &&
    isTaskOrGigChat &&
    isRequest(selected) &&
    !hasOrderBetween &&
    !selected.escrowChatUnlocked &&
    iAmListingOwner;
  // The requester (potential buyer) gets a nudge instead of a hard lock:
  // they wrote first, the seller has not replied yet and no escrow is funded.
  const iInitiated =
    !!selected &&
    !!user &&
    selected.messages.length > 0 &&
    selected.messages[0].senderId === user.id;
  const otherReplied = !!selected && selected.messages.some((m) => m.senderId === selected.otherId);
  const showEscrowNudge =
    !!selected && !!user && isTaskOrGigChat && !hasOrderBetween && !iAmListingOwner && iInitiated && !otherReplied;

  const open = (id: string) => {
    setSelectedId(id);
    setShowChat(true);
    const next = new URLSearchParams(params);
    next.set('c', id);
    setParams(next, { replace: true });
  };

  const closeChat = () => {
    setShowChat(false);
    const next = new URLSearchParams(params);
    next.delete('c');
    setParams(next, { replace: true });
  };

  const handleSend = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selected || !newMessage.trim()) return;
    if (selected.blocked) {
      toast.error('Unblock this person to send a message');
      return;
    }
    sendMessage(selected.id, newMessage.slice(0, 2000));
    setNewMessage('');
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !selected) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Attachments must be 10 MB or smaller');
      return;
    }
    if (selected.blocked) {
      toast.error('Unblock this person to send a file');
      return;
    }
    sendMessage(selected.id, '', { name: f.name, size: f.size });
    toast.success('File shared');
  };

  /* ------------------------------- inbox (list) ------------------------------- */

  const listPane = (
    <div
      className={`w-full lg:w-[360px] shrink-0 lg:border-r dark:lg:border-violet-700 flex-col min-h-0 ${
        showChat ? 'hidden lg:flex' : 'flex'
      }`}
    >
      {/* Inbox header: title + expanding search */}
      <div className="p-4 border-b dark:border-violet-700 shrink-0">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                autoFocus
                placeholder="Search conversations..."
                aria-label="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-full dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
            <button
              type="button"
              aria-label="Close search"
              className="shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-violet-700 dark:hover:bg-violet-600 text-gray-600 dark:text-gray-200 flex items-center justify-center transition-colors"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white">Messages</h2>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Search conversations"
                className="rounded-full dark:text-gray-300"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {/* Inbox / Requests tabs */}
            <div className="flex items-center gap-5 mt-3" role="tablist" aria-label="Message folders">
              <button
                role="tab"
                aria-selected={tab === 'inbox'}
                onClick={() => setTab('inbox')}
                className={`text-sm font-medium pb-1.5 border-b-2 transition-colors ${
                  tab === 'inbox'
                    ? 'border-[#6B46C1] text-gray-900 dark:text-white dark:border-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Messages
              </button>
              <button
                role="tab"
                aria-selected={tab === 'requests'}
                onClick={() => setTab('requests')}
                className={`text-sm font-medium pb-1.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  tab === 'requests'
                    ? 'border-[#6B46C1] text-gray-900 dark:text-white dark:border-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Requests
                {requestList.length > 0 && (
                  <span
                    className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-medium flex items-center justify-center ${
                      requestsUnread > 0
                        ? 'bg-[#6B46C1] text-white'
                        : 'bg-gray-100 text-gray-500 dark:bg-violet-700 dark:text-gray-300'
                    }`}
                  >
                    {requestList.length}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 && (
          <div className="p-6 text-center">
            {tab === 'requests' && requestList.length === 0 && !searchQuery ? (
              <>
                <Inbox className="w-8 h-8 text-gray-300 dark:text-violet-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No message requests</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Messages from people you have never chatted with land here first.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No conversations match your search</p>
            )}
          </div>
        )}
        {filtered.map((conv) => {
          const unread = unreadFor(conv.id);
          const last = conv.messages[conv.messages.length - 1];
          const online = isOnline(conv.otherId);
          return (
            <button
              key={conv.id}
              onClick={() => open(conv.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-violet-700/40 dark:active:bg-violet-700/60 ${
                selected?.id === conv.id ? 'bg-violet-50 dark:bg-violet-700/50' : ''
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-11 h-11">
                  <AvatarImage src={conv.otherAvatar} />
                  <AvatarFallback>{conv.otherName[0]}</AvatarFallback>
                </Avatar>
                <PresenceDot online={online} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4
                    className={`text-gray-900 dark:text-white truncate ${
                      unread ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {conv.otherName}
                  </h4>
                  {last && <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{listTime(last.createdAt)}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={`text-sm truncate ${
                      unread ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {last ? (last.attachment && !last.content ? `📎 ${last.attachment.name}` : last.content) : 'Say hello'}
                  </p>
                  {unread > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#6B46C1] text-white text-[11px] font-medium flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* --------------------------------- rendering --------------------------------- */

  return (
    <div className="h-[100dvh] flex flex-col bg-lavender dark:bg-violet-950">
      {/* Slim dedicated header — the inbox hides the global nav and runs
          chat-app style: brand logo on the left, account avatar on the right */}
      <header className="shrink-0 h-14 lg:h-16 bg-white dark:bg-violet-900 border-b border-gray-200 dark:border-violet-700 flex items-center justify-between px-4 sm:px-6 z-10">
        <Logo />
        <Link
          to="/dashboard"
          aria-label="Go to dashboard"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
        >
          <img
            src={user?.avatar || '/images/avatar_default.jpg'}
            alt={user?.name || 'Account'}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full object-cover border-2 border-amber-500"
          />
        </Link>
      </header>

      <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex">
        {conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 w-full max-w-md">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description="Start a conversation from any listing or seller profile using the Contact button."
                action={
                  <Link to="/browse">
                    <Button className="bg-violet-600 hover:bg-violet-700">Browse listings</Button>
                  </Link>
                }
              />
            </div>
          </div>
        ) : (
        <div
          className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden flex flex-1 min-h-0"
        >
          {listPane}

          {/* Active chat */}
          {selected && (
            <div className={`flex-1 min-w-0 flex-col h-full ${showChat ? 'flex' : 'hidden lg:flex'}`}>
              {/* Sticky chat header */}
              <div className="p-3 border-b dark:border-violet-700 flex items-center gap-3 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Back to conversations"
                  onClick={closeChat}
                  className="lg:hidden px-2 text-gray-600 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
                >
                  <ArrowLeft className="size-6" strokeWidth={2} />
                </Button>
                <div className="relative shrink-0">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={selected.otherAvatar} />
                    <AvatarFallback>{selected.otherName[0]}</AvatarFallback>
                  </Avatar>
                  <PresenceDot online={isOnline(selected.otherId)} className="w-2.5 h-2.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate leading-tight">{selected.otherName}</h3>
                  <p
                    className={`text-xs leading-tight mt-0.5 ${
                      isOnline(selected.otherId) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isOnline(selected.otherId) ? 'Online' : 'Offline'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Conversation options" className="dark:text-gray-300">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/seller/${selected.otherId}`}>
                        <User className="w-4 h-4 mr-2" />
                        View profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        toggleBlock(selected.id);
                        toast.success(selected.blocked ? `${selected.otherName} unblocked` : `${selected.otherName} blocked`);
                      }}
                      className={selected.blocked ? '' : 'text-red-600'}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {selected.blocked ? 'Unblock' : 'Block'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                {selected.messages.length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    No messages yet. Send the first one below.
                  </p>
                )}
                {selected.messages.map((msg, idx) => {
                  const mine = msg.senderId === user?.id;
                  const prev = selected.messages[idx - 1];
                  const next = selected.messages[idx + 1];
                  const firstOfRun = !prev || prev.senderId !== msg.senderId;
                  const lastOfRun = !next || next.senderId !== msg.senderId;
                  const firstOfDay = !prev || dayLabel(prev.createdAt) !== dayLabel(msg.createdAt);
                  return (
                    <div key={msg.id}>
                      {firstOfDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-violet-700/60 rounded-full px-3 py-1">
                            {dayLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${firstOfRun && !firstOfDay ? 'mt-3' : 'mt-1'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 text-[15px] leading-relaxed ${mine ? 'bg-[#6B46C1] text-white' : 'bg-gray-100 dark:bg-violet-700 text-gray-900 dark:text-white'} rounded-2xl ${
                            mine
                              ? `${firstOfRun ? '' : 'rounded-tr-md'} ${lastOfRun ? 'rounded-br-md' : ''}`
                              : `${firstOfRun ? '' : 'rounded-tl-md'} ${lastOfRun ? 'rounded-bl-md' : ''}`
                          }`}
                        >
                          {msg.attachment && (
                            <div className={`flex items-center gap-2 mb-1 text-sm ${mine ? 'text-white/90' : ''} min-w-0`}>
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                              <span className="opacity-70 shrink-0">{formatBytes(msg.attachment.size)}</span>
                            </div>
                          )}
                          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                          <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : ''}`}>
                            <span className="text-[10px] opacity-70">{formatTime(msg.createdAt)}</span>
                            {mine && <CheckCheck className="w-3 h-3 opacity-70" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message request notice */}
              {isRequest(selected) && !selected.blocked && (
                <div className="mx-4 mb-2 flex items-start gap-2 text-xs text-violet-800 dark:text-amber-200 bg-violet-50 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700 rounded-lg p-2.5 shrink-0">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Message request.</span> {selected.otherName} is not in your contacts yet. Reply to accept — the conversation then moves to Messages. You can also block them from the menu above.
                  </span>
                </div>
              )}

              {/* Escrow nudge for the requester on task/gig requests */}
              {showEscrowNudge && !selected.blocked && convListing && (
                <div className="mx-4 mb-2 flex items-start gap-2 text-xs text-gray-700 dark:text-gray-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 shrink-0">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span className="min-w-0">
                    <span className="font-semibold">Faster replies with escrow.</span> {selected.otherName} sees this as a request. Place an order and the chat unlocks instantly — your {formatPrice(convListing.price)} sits safely in escrow until the work is done.
                  </span>
                </div>
              )}

              {/* Composer / chat lock */}
              {chatLocked && selected && convListing ? (
                <ChatLock
                  mode="waiting"
                  otherName={selected.otherName}
                  listingTitle={selected.listingTitle || convListing.title}
                  listingId={convListing.id}
                  price={convListing.price}
                  onWaive={() => {
                    toggleChatUnlock(selected.id);
                    toast.success(`Chat unlocked — you can now reply to ${selected.otherName}`);
                  }}
                />
              ) : (
              <div className="p-3 border-t dark:border-violet-700 shrink-0">
                {selected.blocked ? (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
                    You blocked this person.{' '}
                    <button onClick={() => toggleBlock(selected.id)} className="text-violet-600 dark:text-amber-400 underline">
                      Unblock
                    </button>
                  </p>
                ) : (
                  <>
                  {!newMessage.trim() && (
                    <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Quick replies">
                      {quickReplies.map((qr) => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => setNewMessage(qr)}
                          className="shrink-0 text-xs font-medium text-violet-700 dark:text-amber-300 bg-violet-50 dark:bg-violet-900/60 border border-violet-200 dark:border-violet-700 rounded-full px-3 py-1.5 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input ref={fileRef} type="file" className="hidden" onChange={handleAttach} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Attach a file"
                      onClick={() => fileRef.current?.click()}
                      className="shrink-0 rounded-full dark:text-gray-300 px-2"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      aria-label="Message"
                      className="flex-1 min-w-0 rounded-full dark:bg-violet-700 dark:border-violet-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      aria-disabled={!newMessage.trim()}
                      aria-label="Send message"
                      className={`shrink-0 w-10 h-10 p-0 rounded-full bg-[#6B46C1] hover:bg-[#5A38A6] ${
                        !newMessage.trim() ? 'opacity-50' : ''
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  </>
                )}
              </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
