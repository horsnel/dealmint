import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Send, MoreVertical, CheckCheck, ArrowLeft, Paperclip, MessageSquare, Ban, User, FileText, X } from 'lucide-react';
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
import { formatBytes, formatTime } from '@/lib/format';
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

/* --------------------------------- component --------------------------------- */

export function MessagesPage() {
  usePageTitle('Messages');
  const { user, conversations, sendMessage, markConversationRead, toggleBlock } = useApp();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get('c'));
  const [showChat, setShowChat] = useState(!!params.get('c'));
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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

  const selected = useMemo(() => {
    if (selectedId) {
      const found = conversations.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return conversations[0];
  }, [conversations, selectedId]);

  const lastMessageId = selected?.messages[selected.messages.length - 1]?.id;

  useEffect(() => {
    if (!selected) return;
    markConversationRead(selected.id);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, lastMessageId]);

  const unreadFor = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c || !user) return 0;
    return c.messages.filter((m) => m.senderId !== user.id && m.createdAt > c.lastReadAt).length;
  };

  const filtered = conversations.filter((c) => {
    const t = searchQuery.trim().toLowerCase();
    if (!t) return true;
    return (
      c.otherName.toLowerCase().includes(t) ||
      (c.listingTitle || '').toLowerCase().includes(t) ||
      c.messages.some((m) => m.content.toLowerCase().includes(t))
    );
  });

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
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close search"
              className="shrink-0 rounded-full dark:text-gray-300"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
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
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No conversations match your search</p>
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
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {conversations.length === 0 ? (
          <div className="card-white dark:bg-violet-800 dark:border-violet-700">
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
        ) : (
        <div
          className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden flex"
          style={{ height: 'calc(100vh - 10rem)', minHeight: 480 }}
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
                  className="lg:hidden dark:text-gray-300 px-2"
                >
                  <ArrowLeft className="w-4 h-4" />
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

              {/* Composer */}
              <div className="p-3 border-t dark:border-violet-700 shrink-0">
                {selected.blocked ? (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
                    You blocked this person.{' '}
                    <button onClick={() => toggleBlock(selected.id)} className="text-violet-600 dark:text-amber-400 underline">
                      Unblock
                    </button>
                  </p>
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
