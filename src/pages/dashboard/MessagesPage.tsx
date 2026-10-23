import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Send, MoreVertical, CheckCheck, ArrowLeft, Paperclip, MessageSquare, Ban, User, FileText } from 'lucide-react';
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
import { formatBytes, formatTime, timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

export function MessagesPage() {
  usePageTitle('Messages');
  const { user, conversations, sendMessage, markConversationRead, toggleBlock } = useApp();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get('c'));
  const [showChat, setShowChat] = useState(!!params.get('c'));
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSend = () => {
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

  const listPane = (
    <div className={`border-r dark:border-violet-700 ${showChat ? 'hidden lg:block' : 'block'}`}>
      <div className="p-4 border-b dark:border-violet-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            aria-label="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 dark:bg-violet-700 dark:border-violet-600"
          />
        </div>
      </div>

      <div className="overflow-y-auto" style={{ height: 'calc(100% - 73px)' }}>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No conversations match your search</p>
        )}
        {filtered.map((conv) => {
          const unread = unreadFor(conv.id);
          const last = conv.messages[conv.messages.length - 1];
          return (
            <button
              key={conv.id}
              onClick={() => open(conv.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-violet-700/50 transition-colors ${
                selected?.id === conv.id ? 'bg-violet-50 dark:bg-violet-700/50' : ''
              }`}
            >
              <Avatar>
                <AvatarImage src={conv.otherAvatar} />
                <AvatarFallback>{conv.otherName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{conv.otherName}</h4>
                  {last && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{timeAgo(last.createdAt)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {last ? (last.attachment && !last.content ? `📎 ${last.attachment.name}` : last.content) : 'Say hello'}
                </p>
              </div>
              {unread > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-6">
          Messages
        </h1>

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
            className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden"
            style={{ height: 'calc(100vh - 200px)', minHeight: 420 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {listPane}

              {/* Chat Area */}
              {selected && (
                <div className={`lg:col-span-2 flex-col h-full min-h-0 ${showChat ? 'flex' : 'hidden lg:flex'}`}>
                  <div className="p-4 border-b dark:border-violet-700 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Back to conversations"
                        onClick={() => setShowChat(false)}
                        className="lg:hidden dark:text-gray-300 px-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="lg:hidden">
                        <AvatarImage src={selected.otherAvatar} />
                        <AvatarFallback>{selected.otherName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{selected.otherName}</h3>
                        {selected.listingTitle && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            About:{' '}
                            {selected.listingId ? (
                              <Link to={`/listing/${selected.listingId}`} className="hover:underline">
                                {selected.listingTitle}
                              </Link>
                            ) : (
                              selected.listingTitle
                            )}
                          </p>
                        )}
                      </div>
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

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selected.messages.length === 0 && (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                        No messages yet. Send the first one below.
                      </p>
                    )}
                    {selected.messages.map((msg) => {
                      const mine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] lg:max-w-[70%] px-4 py-2 rounded-2xl ${
                              mine
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-100 dark:bg-violet-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            {msg.attachment && (
                              <div className={`flex items-center gap-2 mb-1 text-sm ${mine ? 'text-white/90' : ''}`}>
                                <FileText className="w-4 h-4" />
                                <span className="truncate">{msg.attachment.name}</span>
                                <span className="opacity-70 shrink-0">{formatBytes(msg.attachment.size)}</span>
                              </div>
                            )}
                            {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                            <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : ''}`}>
                              <span className="text-xs opacity-70">{formatTime(msg.createdAt)}</span>
                              {mine && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  <div className="p-4 border-t dark:border-violet-700">
                    {selected.blocked ? (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        You blocked this person.{' '}
                        <button onClick={() => toggleBlock(selected.id)} className="text-violet-600 dark:text-amber-400 underline">
                          Unblock
                        </button>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input ref={fileRef} type="file" className="hidden" onChange={handleAttach} />
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Attach a file"
                          onClick={() => fileRef.current?.click()}
                          className="dark:text-gray-300 px-2"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          aria-label="Message"
                          className="flex-1 dark:bg-violet-700 dark:border-violet-600"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        />
                        <Button
                          onClick={handleSend}
                          disabled={!newMessage.trim()}
                          aria-label="Send message"
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
