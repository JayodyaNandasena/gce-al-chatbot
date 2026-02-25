"use client"

import React, {useEffect, useRef, useState} from "react";
import {Menu, Send} from "lucide-react";
import {SUBJECTS} from "@/components/chat/subject-config.js";
import {ChatHistory} from "@/components/chat/chat-history.js";
import {Button} from "@/components/ui/button.js";
import {ScrollArea} from "@/components/ui/scroll-area.js";
import {Message} from "@/components/chat/message.js";
import {TypingIndicator} from "@/components/chat/typing-indicator.js";
import {Textarea} from "@/components/ui/textarea.js";
import {SuggestedQuestions} from "@/components/chat/suggested-questions.js";

// Define message type with sources
type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
};

type Chat = {
    id: number;
    title: string;
    timestamp: string;
    subject: string;
    messages: ChatMessage[];
};

const MultiSubjectChatbot = () => {
    const [subject, setSubject] = useState('biology');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chats, setChats] = useState<Chat[]>([
        {
            id: 1,
            title: 'Photosynthesis Discussion',
            timestamp: '2 hours ago',
            subject: 'biology',
            messages: []
        },
        {
            id: 2,
            title: 'Cell Division Explained',
            timestamp: 'Yesterday',
            subject: 'biology',
            messages: []
        }
    ]);
    const [activeChat, setActiveChat] = useState(1);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const config = SUBJECTS[subject];
    const Icon = config.icon;

    useEffect(() => {
        // Initialize with greeting message
        setMessages([
            {
                role: 'assistant',
                content: config.greeting,
                sources: []
            }
        ]);
    }, [activeChat, subject, config.greeting]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            sources: []
        };
        setMessages(prev => [...prev, userMessage]);

        // Update chat title if it's the first message
        if (messages.length === 1) {
            setChats(prev => prev.map(chat =>
                chat.id === activeChat
                    ? { ...chat, title: input.slice(0, 30) + (input.length > 30 ? '...' : '') }
                    : chat
            ));
        }

        setInput('');
        setIsTyping(true);

        try {
            // Call the API with streaming
            const response = await fetch('http://localhost:3000/api/chat/biology', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: input,
                    chatHistory: []
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Create assistant message placeholder
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: '',
                sources: []
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Read the stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let fullResponse = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Check if tokens-ended marker hit
                    if (chunk.includes('tokens-ended')) {
                        // Stop processing when hit the marker
                        const beforeMarker = chunk.split('tokens-ended')[0];
                        fullResponse += beforeMarker;

                        // Update final message
                        setMessages(prev =>
                            prev.map((msg, idx) =>
                                idx === prev.length - 1
                                    ? { ...msg, content: fullResponse.trim() }
                                    : msg
                            )
                        );
                        break;
                    }

                    fullResponse += chunk;

                    // Update the message in real-time
                    setMessages(prev =>
                        prev.map((msg, idx) =>
                            idx === prev.length - 1
                                ? { ...msg, content: fullResponse }
                                : msg
                        )
                    );
                }
            }

        } catch (error) {
            console.error('Error calling API:', error);

            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                sources: []
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (question: string) => {
        setInput(question);
        textareaRef.current?.focus();
    };

    const handleNewChat = () => {
        const newChat: Chat = {
            id: Date.now(),
            title: 'New Chat',
            timestamp: 'Just now',
            subject: subject,
            messages: []
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat.id);
        setMessages([
            {
                role: 'assistant',
                content: config.greeting,
                sources: []
            }
        ]);
    };

    const handleSubjectChange = (newSubject: string) => {
        setSubject(newSubject);
        const subjectChats = chats.filter(chat => chat.subject === newSubject);
        if (subjectChats.length > 0) {
            setActiveChat(subjectChats[0].id);
        } else {
            handleNewChat();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-20 h-full`}>
                <ChatHistory
                    chats={chats.filter(chat => chat.subject === subject)}
                    activeChat={activeChat}
                    onChatSelect={setActiveChat}
                    onNewChat={handleNewChat}
                    subject={subject}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className={`flex flex-col flex-1 bg-gradient-to-br ${config.bgGradient}`}>
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-4 py-4 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        <div className={`bg-gradient-to-br ${config.gradient} p-2 rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-gray-800">
                                {config.name} Learning Assistant
                            </h1>
                            <p className="text-sm text-gray-500">Your AI tutor for {config.name.toLowerCase()}</p>
                        </div>

                        {/* Subject Switcher */}
                        <div className="flex gap-2">
                            {Object.keys(SUBJECTS).map((subjectKey) => {
                                const SubjectIcon = SUBJECTS[subjectKey].icon;
                                return (
                                    <Button
                                        key={subjectKey}
                                        variant={subject === subjectKey ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleSubjectChange(subjectKey)}
                                        className={subject === subjectKey ? `bg-gradient-to-r ${SUBJECTS[subjectKey].gradient}` : ''}
                                    >
                                        <SubjectIcon className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">{SUBJECTS[subjectKey].name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea ref={scrollRef} className="h-full">
                        <div className="max-w-4xl mx-auto px-4 py-6">
                            {messages.map((message, index) => (
                                <Message
                                    key={index}
                                    message={message}
                                    sources={message.sources || []}
                                    config={config}
                                />
                            ))}

                            {isTyping && <TypingIndicator config={config} />}

                            {messages.length === 1 && (
                                <SuggestedQuestions
                                    suggestions={config.suggestions}
                                    onSelect={handleSuggestionClick}
                                    config={config}
                                />
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 shadow-lg">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <Textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Ask a ${config.name.toLowerCase()} question...`}
                                    className={`min-h-[52px] max-h-32 resize-none rounded-xl ${config.borderColor} focus:${config.borderColor} pr-12`}
                                    rows={1}
                                />
                            </div>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className={`h-[52px] w-[52px] rounded-xl bg-gradient-to-br ${config.gradient} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Press Enter to send, Shift + Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiSubjectChatbot;