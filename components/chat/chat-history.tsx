import {ChevronLeft, MessageSquare, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {SUBJECTS} from "./subject-config";
import React from "react";

interface ChatHistoryProps {
    chats: any[];
    activeChat: any;
    onChatSelect: (chat: any) => void;
    onNewChat: () => void;
    subject: string;
    onClose: () => void;
}

export const ChatHistory = ({
                                chats,
                                activeChat,
                                onChatSelect,
                                onNewChat,
                                subject,
                                onClose,
                            }: ChatHistoryProps) => {
    const config = SUBJECTS[subject];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-800">Chat History</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                        <ChevronLeft className="w-4 h-4"/>
                    </Button>
                </div>
                <Button
                    onClick={onNewChat}
                    className={`w-full bg-gradient-to-r ${config.gradient} hover:opacity-90`}
                >
                    <Plus className="w-4 h-4 mr-2"/>
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2">
                    {chats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => {
                                onChatSelect(chat.id);
                                onClose();
                            }}
                            className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                                activeChat === chat.id
                                    ? `bg-gradient-to-r ${config.gradient} text-white`
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0"/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{chat.title}</p>
                                    <p className={`text-xs mt-1 ${
                                        activeChat === chat.id ? 'text-white/80' : 'text-gray-500'
                                    }`}>
                                        {chat.timestamp}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
