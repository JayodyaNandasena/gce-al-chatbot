import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from "react";

export function Message({ message, config }: any) {
    const Icon = config.icon;

    return (
        <div className={`flex gap-4 mb-6 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
            {message.role === 'assistant' && (
                <Avatar className={`h-8 w-8 bg-gradient-to-br ${config.gradient} flex-shrink-0`}>
                    <AvatarFallback className="bg-transparent text-white">
                        <Icon className="w-4 h-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                    ? `bg-gradient-to-br ${config.gradient} text-white`
                    : `bg-white text-gray-800 border ${config.borderColor} shadow-sm`
            }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </p>
            </div>

            {message.role === 'user' && (
                <Avatar className="h-8 w-8 bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0">
                    <AvatarFallback className="bg-transparent text-white text-xs">
                        You
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
