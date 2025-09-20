import { useState, useEffect, useRef } from 'react';
import { Search, Archive, Flag, Plus, Send, Image, Smile, Users, Phone, Video, Trash2, MoreVertical, UserPlus, Settings, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { getSession } from '../utils/Session';
import axios from 'axios';
import { showToast } from '../utils/toast';

const InboxPage = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = getSession('user');
  const currentUserId = user?.id || user?._id;
  const authToken = getSession('token');

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  useEffect(() => {
    if (!currentUserId || !authToken) {
      console.error('User not authenticated');
      return;
    }

    initializeSocket();
    fetchConversations();

    if (location.state?.startConversationWith) {
      const user = location.state.startConversationWith;
      setTimeout(() => {
        createDirectConversation(user._id);
      }, 100);
    }

    const checkNotificationState = () => {
      setNotificationOpen(!!window.notificationModalOpen || !!window.profileMenuOpen);
    };
    
    const interval = setInterval(checkNotificationState, 100);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(interval);
    };
  }, [currentUserId, authToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: authToken },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('newMessage', (data) => {
      const { message, conversationId } = data;
      console.log('New message received:', message);

      setMessages(prev => {
        const localIndex = prev.findIndex(m => 
          m._id.startsWith('local_') && 
          m.sender._id === message.sender._id &&
          ((m.content && m.content === message.content) || 
           (m.messageType === 'image' && message.messageType === 'image'))
        );
        
        if (localIndex !== -1) {
          const updated = [...prev];
          updated[localIndex] = { ...message, status: 'sent' };
          return updated;
        }
        
        if (message.sender._id !== currentUserId) {
          const exists = prev.some(m => m._id === message._id);
          if (!exists) {
            return [...prev, { ...message, status: 'delivered' }];
          }
        }
        
        return prev;
      });

      updateConversationLastMessage(conversationId, message);
    });

    socketRef.current.on('userTyping', (data) => {
      const { userId, conversationId, isTyping, userName } = data;
      if (selectedChat?.id === conversationId && userId !== currentUserId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(`${userId}:${userName}`);
          } else {
            [...newSet].forEach(entry => {
              if (entry.startsWith(`${userId}:`)) {
                newSet.delete(entry);
              }
            });
          }
          return newSet;
        });
      }
    });

    socketRef.current.on('userOnline', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    socketRef.current.on('userOffline', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socketRef.current.on('reactionUpdate', (data) => {
      const { messageId, reactions } = data;
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });

    socketRef.current.on('conversationDeleted', (data) => {
      const { conversationId } = data;
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedChat?.id === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }
    });

    socketRef.current.on('participantsAdded', (data) => {
      const { conversationId, addedUsers, message } = data;
      if (selectedChat?.id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      fetchConversations();
    });
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/messages/conversations');

      if (response.data.success) {
        setConversations(response.data.data);
        if (response.data.data.length > 0 && !selectedChat) {
          selectConversation(response.data.data[0]);
        }
      }
    } catch (error) {
      showToast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);

      if (response.data.success) {
        const messagesWithStatus = response.data.data.map(msg => ({
          ...msg,
          status: msg.sender._id === currentUserId ? 'read' : 'delivered'
        }));
        setMessages(messagesWithStatus);
      }
    } catch (error) {
      showToast.error('Failed to load messages');
    }
  };

  const selectConversation = (conversation) => {
    if (selectedChat?.id) {
      socketRef.current?.emit('leaveConversation', { conversationId: selectedChat.id });
    }

    setSelectedChat(conversation);
    setMessages([]);
    setTypingUsers(new Set());
    setShowChatOptions(false);

    socketRef.current?.emit('joinConversation', { conversationId: conversation.id });
    fetchMessages(conversation.id);
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && !selectedImage) || !selectedChat) return;

    const messageData = {
      _id: `local_${Date.now()}`,
      content: messageInput.trim(),
      sender: { _id: currentUserId, name: user.name },
      createdAt: new Date().toISOString(),
      messageType: selectedImage ? 'image' : 'text',
      attachments: selectedImage ? [{ fileName: selectedImage.name, filePath: URL.createObjectURL(selectedImage) }] : [],
      status: 'sending'
    };

    setMessages(prev => [...prev, messageData]);
    
    const currentInput = messageInput;
    setMessageInput('');
    setSelectedImage(null);

    try {
      const formData = new FormData();
      if (currentInput.trim()) {
        formData.append('content', currentInput.trim());
      }
      if (selectedImage) {
        formData.append('attachments', selectedImage);
      }

      await api.post(`/messages/conversations/${selectedChat.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


    } catch (error) {
      showToast.error('Failed to send message');
      setMessages(prev => prev.map(m => 
        m._id === messageData._id ? { ...m, status: 'failed' } : m
      ));
      setMessageInput(currentInput);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await api.delete(`/messages/conversations/${conversationId}`);

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedChat?.id === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }

      setShowDeleteModal(false);
      setConversationToDelete(null);
    } catch (error) {
      showToast.error('Failed to delete conversation');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!selectedChat) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        conversationId: selectedChat.id,
        isTyping: true,
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('typing', {
        conversationId: selectedChat.id,
        isTyping: false,
      });
    }, 1000);
  };

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/messages/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      showToast.error('Failed to search users');
    }
  };

  const createDirectConversation = async (userId) => {
    try {
      const existingConv = conversations.find(conv => 
        !conv.isGroup && 
        conv.participants?.length === 2 &&
        conv.participants.some(p => (p._id || p.id) === userId) &&
        conv.participants.some(p => (p._id || p.id) === currentUserId)
      );
      
      if (existingConv) {
        selectConversation(existingConv);
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      const response = await api.post('/messages/conversations/direct', {
        recipientId: userId,
      });

      if (response.data.success) {
        const newConversation = response.data.data;
        const stillExists = conversations.find(conv => 
          conv.id === newConversation.id || conv._id === newConversation.id
        );
        
        if (!stillExists) {
          setConversations(prev => [newConversation, ...prev]);
        }
        selectConversation(newConversation);
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      showToast.error('Failed to create conversation');
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const response = await api.post('/messages/conversations/group', {
        name: groupName.trim(),
        description: groupDescription.trim(),
        participantIds: selectedUsers.map(user => user._id)
      });

      if (response.data.success) {
        const newConversation = response.data.data;
        setConversations(prev => [newConversation, ...prev]);
        selectConversation(newConversation);
        setShowCreateGroup(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      showToast.error('Failed to create group');
    }
  };

  const addMemberToGroup = async (userId) => {
    if (!selectedChat?.isGroup || selectedChat.admin !== currentUserId) return;

    try {
      await api.post(`/messages/conversations/${selectedChat.id}/participants`, {
        userIds: [userId]
      });
      
      setShowUserSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
    } catch (error) {
      showToast.error('Failed to add member');
    }
  };

  const handleUserSelect = (user) => {
    if (showCreateGroup) {
      if (selectedUsers.find(u => u._id === user._id)) {
        setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
      } else {
        setSelectedUsers(prev => [...prev, user]);
      }
    } else if (selectedChat?.isGroup && selectedChat.admin === currentUserId) {
      addMemberToGroup(user._id);
    } else {
      createDirectConversation(user._id);
    }
  };

  const updateConversationLastMessage = (conversationId, message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessage: {
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt,
            messageType: message.messageType,
          },
          lastActivity: message.createdAt,
        };
      }
      return conv;
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const filteredConversations = conversations
    .filter(conv => conv.lastMessage)
    .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((conv, index, arr) => {
      if (!conv.isGroup) {
        const otherUser = conv.participants?.find(p => (p._id || p.id) !== currentUserId);
        if (otherUser) {
          const firstIndex = arr.findIndex(c => {
            if (c.isGroup) return false;
            const otherUserInC = c.participants?.find(p => (p._id || p.id) !== currentUserId);
            return otherUserInC && (otherUserInC._id || otherUserInC.id) === (otherUser._id || otherUser.id);
          });
          return firstIndex === index;
        }
      }
      return true;
    });

  const getTypingText = () => {
    const typingUserNames = Array.from(typingUsers).map(entry => entry.split(':')[1]);
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length > 1) {
      return `${typingUserNames.slice(0, -1).join(', ')} and ${typingUserNames[typingUserNames.length - 1]} are typing...`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <div className={`w-full sm:w-1/2 lg:w-1/3 bg-black border-r border-white flex flex-col ${notificationOpen ? '-z-10' : ''} ${selectedChat ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-3 lg:p-4 border-b border-white">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h1 className="text-lg lg:text-xl font-semibold text-white">Messages</h1>
            <div className="flex space-x-1 lg:space-x-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 text-white hover:bg-white hover:text-black rounded-full"
              >
                <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2 text-white hover:bg-white hover:text-black rounded-full"
              >
                <Users className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-3 w-3 lg:h-4 lg:w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 lg:pl-10 pr-4 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white placeholder-white text-sm lg:text-base"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.filter(conv => conv.isGroup).length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-white opacity-70 uppercase tracking-wide">
                Groups
              </div>
              {filteredConversations.filter(conv => conv.isGroup).map((conversation, index) => (
                <div
                  key={`group-${conversation.id}-${index}`}
                  onClick={() => selectConversation(conversation)}
                  className={`p-3 lg:p-4 border-b border-white cursor-pointer hover:bg-white hover:text-black ${
                    selectedChat?.id === conversation.id ? 'bg-white text-black' : 'text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="relative">
                      <img
                        src={conversation.avatar || '/default-avatar.png'}
                        alt={conversation.name}
                        className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                        <Users className="h-2 w-2 lg:h-3 lg:w-3 text-black" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs lg:text-sm font-medium truncate">
                          {conversation.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs opacity-70">
                            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs lg:text-sm opacity-70 truncate">
                          {conversation.lastMessage?.messageType === 'image' 
                            ? '📷 Image' 
                            : conversation.lastMessage?.content || 'No messages yet'
                          }
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 lg:px-2 py-1 text-xs font-bold leading-none text-black bg-white rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {filteredConversations.filter(conv => !conv.isGroup).length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-white opacity-70 uppercase tracking-wide">
                Direct Messages
              </div>
              {filteredConversations.filter(conv => !conv.isGroup).map((conversation, index) => (
                <div
                  key={`direct-${conversation.id}-${index}`}
                  onClick={() => selectConversation(conversation)}
                  className={`p-4 border-b border-white cursor-pointer hover:bg-white hover:text-black ${
                    selectedChat?.id === conversation.id ? 'bg-white text-black' : 'text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={conversation.avatar || '/default-avatar.png'}
                        alt={conversation.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {conversation.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs opacity-70">
                            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm opacity-70 truncate">
                          {conversation.lastMessage?.messageType === 'image' 
                            ? '📷 Image' 
                            : conversation.lastMessage?.content || 'No messages yet'
                          }
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black bg-white rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

      </div>

      <div className={`flex-1 flex flex-col ${notificationOpen ? '-z-10' : ''} ${selectedChat ? 'flex' : 'hidden sm:flex'}`}>
        {selectedChat ? (
          <>
            <div className="bg-black border-b border-white p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="sm:hidden p-1 text-white hover:bg-white hover:text-black rounded"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <img
                    src={selectedChat.avatar || '/default-avatar.png'}
                    alt={selectedChat.name}
                    className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-base lg:text-lg font-semibold text-white">
                      {selectedChat.name}
                    </h2>
                    {selectedChat.isGroup && (
                      <p className="text-xs lg:text-sm text-white opacity-70">
                        {selectedChat.participants?.length} members
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowChatOptions(!showChatOptions)}
                      className="p-2 text-white hover:bg-white hover:text-black rounded-full"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {showChatOptions && (
                      <div className="absolute right-0 mt-2 w-48 bg-black border border-white rounded-md shadow-lg z-10">
                        {selectedChat.isGroup && selectedChat.admin === currentUserId && (
                          <>
                            <button 
                              onClick={() => {
                                setShowUserSearch(true);
                                setShowChatOptions(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black"
                            >
                              <UserPlus className="inline h-4 w-4 mr-2" />
                              Add Members
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setConversationToDelete(selectedChat.id);
                            setShowDeleteModal(true);
                            setShowChatOptions(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black"
                        >
                          <Trash2 className="inline h-4 w-4 mr-2" />
                          Delete Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4 bg-black">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 lg:px-4 py-2 rounded-lg ${
                      message.sender._id === currentUserId
                        ? 'bg-white text-black'
                        : 'bg-black border border-white text-white'
                    }`}
                  >
                    {message.sender._id !== currentUserId && selectedChat.isGroup && (
                      <p className="text-xs font-semibold mb-1">
                        {message.sender.name}
                      </p>
                    )}
                    
                    {message.messageType === 'image' && message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2">
                        <img
                          src={message.attachments[0].filePath.startsWith('blob:') 
                            ? message.attachments[0].filePath 
                            : `${import.meta.env.VITE_API_URL}${message.attachments[0].filePath}`
                          }
                          alt="Shared image"
                          className="max-w-full h-auto rounded-lg cursor-pointer"
                          style={{ maxHeight: '300px' }}
                          onClick={() => window.open(
                            message.attachments[0].filePath.startsWith('blob:') 
                              ? message.attachments[0].filePath 
                              : `${import.meta.env.VITE_API_URL}${message.attachments[0].filePath}`,
                            '_blank'
                          )}
                        />
                      </div>
                    )}
                    
                    {message.content && (
                      <p className="text-xs lg:text-sm">{message.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {message.sender._id === currentUserId && (
                        <div className="flex items-center text-xs opacity-70 ml-2 space-x-1">
                          <span>
                            {message.status === 'sending' && '🕐'}
                            {message.status === 'sent' && '✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'read' && '✓✓'}
                            {message.status === 'failed' && '❌'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-black border border-white text-white px-4 py-2 rounded-lg">
                    <p className="text-sm italic">{getTypingText()}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-black border-t border-white p-3 lg:p-4">
              {selectedImage && (
                <div className="mb-2 p-2 bg-black border border-white rounded-lg flex items-center justify-between">
                  <span className="text-xs lg:text-sm text-white">Image selected: {selectedImage.name}</span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:bg-white hover:text-black px-2 py-1 rounded text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-white hover:bg-white hover:text-black rounded-full"
                >
                  <Image className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
                <button className="hidden sm:block p-2 text-white hover:bg-white hover:text-black rounded-full">
                  <Smile className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-3 lg:px-4 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white resize-none placeholder-white text-sm lg:text-base"
                    rows={1}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() && !selectedImage}
                  className="p-2 bg-white text-black rounded-full hover:bg-black hover:text-white hover:border hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-black">
            <div className="text-center p-4">
              <h3 className="text-base lg:text-lg font-medium text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-white opacity-70 text-sm lg:text-base">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {showUserSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {selectedChat?.isGroup && selectedChat.admin === currentUserId 
                ? 'Add Members' 
                : 'Start New Conversation'
              }
            </h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full px-3 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white placeholder-white"
              />
            </div>
            <div className="space-y-2">
              {searchResults.map((user, index) => (
                <div
                  key={`search-${user._id}-${index}`}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center space-x-3 p-2 hover:bg-white hover:text-black rounded-lg cursor-pointer text-white"
                >
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm opacity-70">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowUserSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-4 py-2 text-white hover:bg-white hover:text-black border border-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-white">Create Group</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white placeholder-white mb-3"
              />
              <textarea
                placeholder="Group description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white placeholder-white resize-none"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full px-3 py-2 bg-black border border-white text-white rounded-lg focus:ring-2 focus:ring-white placeholder-white"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-white mb-2">Selected ({selectedUsers.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user, index) => (
                    <div key={`selected-${user._id}-${index}`} className="flex items-center bg-white text-black px-2 py-1 rounded text-sm">
                      <span>{user.name}</span>
                      <button
                        onClick={() => setSelectedUsers(prev => prev.filter(u => u._id !== user._id))}
                        className="ml-2 text-black hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {searchResults.filter(user => !selectedUsers.find(u => u._id === user._id)).map((user, index) => (
                <div
                  key={`filtered-${user._id}-${index}`}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center space-x-3 p-2 hover:bg-white hover:text-black rounded-lg cursor-pointer text-white"
                >
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs opacity-70">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setGroupDescription('');
                  setSelectedUsers([]);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-4 py-2 text-white hover:bg-white hover:text-black border border-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-4 py-2 bg-white text-black rounded hover:bg-black hover:text-white hover:border hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Delete Conversation</h3>
            <p className="text-white mb-4">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConversationToDelete(null);
                }}
                className="px-4 py-2 text-white hover:bg-white hover:text-black border border-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversation(conversationToDelete)}
                className="px-4 py-2 bg-white text-black rounded hover:bg-black hover:text-white hover:border hover:border-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default InboxPage;