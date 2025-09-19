import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  PaperAirplaneIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EnvelopeIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { 
  CheckIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  parent_message_id?: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  recipient: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface Conversation {
  participant: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface PrivateMessagingProps {
  className?: string;
}

export function PrivateMessaging({ className = '' }: PrivateMessagingProps) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [newMessageData, setNewMessageData] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
    fetchConversations();
    subscribeToMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all messages where user is sender or recipient
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (id, full_name, avatar_url, role),
          recipient:recipient_id (id, full_name, avatar_url, role)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      allMessages?.forEach((message) => {
        const partnerId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const partner = message.sender_id === user.id ? message.recipient : message.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            participant: partner,
            lastMessage: message,
            unreadCount: 0
          });
        }

        // Count unread messages
        if (message.recipient_id === user.id && !message.is_read) {
          const conversation = conversationMap.get(partnerId);
          if (conversation) {
            conversation.unreadCount++;
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error(t('error.fetchMessages'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (id, full_name, avatar_url, role),
          recipient:recipient_id (id, full_name, avatar_url, role)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(t('error.fetchMessages'));
    }
  };

  const markMessagesAsRead = async (participantId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', participantId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update conversations to reflect read status
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const { data: { user } } = supabase.auth.getUser();
    
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Refresh conversations and messages when new message arrives
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      // Messages will be refreshed via subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('error.sendMessage'));
    } finally {
      setSendingMessage(false);
    }
  };

  const sendNewMessage = async () => {
    if (!newMessageData.recipient_id || !newMessageData.content.trim()) {
      toast.error(t('error.fillRequiredFields'));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: newMessageData.recipient_id,
          subject: newMessageData.subject.trim() || null,
          content: newMessageData.content.trim()
        });

      if (error) throw error;

      setNewMessageData({ recipient_id: '', subject: '', content: '' });
      setShowNewMessage(false);
      setSelectedConversation(newMessageData.recipient_id);
      toast.success(t('message.sent'));
    } catch (error) {
      console.error('Error sending new message:', error);
      toast.error(t('error.sendMessage'));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedParticipant = conversations.find(conv => 
    conv.participant.id === selectedConversation
  )?.participant;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-[600px] bg-white dark:bg-neutral-800 rounded-lg shadow ${className}`}>
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('messages.title')}
            </h2>
            <Button
              size="sm"
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              {t('messages.new')}
            </Button>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder={t('messages.searchConversations')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.participant.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                  selectedConversation === conversation.participant.id
                    ? 'bg-accent-50 dark:bg-accent-900/20 border-r-2 border-accent-500'
                    : ''
                }`}
                onClick={() => setSelectedConversation(conversation.participant.id)}
              >
                <div className="flex items-start gap-3">
                  {conversation.participant.avatar_url ? (
                    <img 
                      src={conversation.participant.avatar_url} 
                      alt={conversation.participant.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-neutral-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                        {conversation.participant.full_name}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-accent-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                        {conversation.lastMessage.content}
                      </p>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conversation.participant.role === 'teacher' 
                          ? 'bg-accent-100 text-accent-800' 
                          : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                      }`}>
                        {t(`role.${conversation.participant.role}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <EnvelopeIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-neutral-600 dark:text-neutral-300">
                {searchTerm ? t('messages.noSearchResults') : t('messages.noConversations')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedParticipant ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                {selectedParticipant.avatar_url ? (
                  <img 
                    src={selectedParticipant.avatar_url} 
                    alt={selectedParticipant.full_name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-neutral-400" />
                )}
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {selectedParticipant.full_name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {t(`role.${selectedParticipant.role}`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser?.id;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg p-3 ${
                          isCurrentUser 
                            ? 'bg-accent-500 text-white' 
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                        }`}>
                          {message.subject && (
                            <div className={`font-medium mb-1 ${
                              isCurrentUser ? 'text-white' : 'text-neutral-900 dark:text-white'
                            }`}>
                              {message.subject}
                            </div>
                          )}
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown 
                              className={isCurrentUser ? 'text-white' : 'text-neutral-900 dark:text-white'}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-neutral-500 ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                          {isCurrentUser && message.is_read && (
                            <CheckIcon className="h-3 w-3 text-accent-500" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex gap-2">
                <div className="flex-1">
                  <TextareaAutosize
                    placeholder={t('messages.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none dark:bg-neutral-800 dark:text-white"
                    minRows={1}
                    maxRows={4}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {sendingMessage ? t('messages.sending') : t('messages.send')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <EnvelopeIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                {t('messages.selectConversation')}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t('messages.selectConversationDescription')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        title={t('messages.newMessage')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('messages.recipient')}
            </label>
            <select
              value={newMessageData.recipient_id}
              onChange={(e) => setNewMessageData(prev => ({ ...prev, recipient_id: e.target.value }))}
              className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-800 dark:text-white"
            >
              <option value="">{t('messages.selectRecipient')}</option>
              {users
                .filter(user => user.id !== currentUser?.id)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({t(`role.${user.role}`)})
                  </option>
                ))}
            </select>
          </div>
          
          <Input
            label={t('messages.subject')}
            placeholder={t('messages.subjectPlaceholder')}
            value={newMessageData.subject}
            onChange={(e) => setNewMessageData(prev => ({ ...prev, subject: e.target.value }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('messages.message')}
            </label>
            <TextareaAutosize
              placeholder={t('messages.messagePlaceholder')}
              value={newMessageData.content}
              onChange={(e) => setNewMessageData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none dark:bg-neutral-800 dark:text-white"
              minRows={4}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNewMessage(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={sendNewMessage}>
              {t('messages.send')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}