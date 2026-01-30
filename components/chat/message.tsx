import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.js";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion.js";
import Balancer from "react-wrap-balancer";
import ReactMarkdown from "react-markdown";
import {sanitizeAndFormatText} from "@/lib/utils.js";

interface MessageType {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

interface MessageProps {
    message: MessageType;
    sources: string[];
    config: {
        gradient: string;
        borderColor: string;
        icon: React.ElementType;
    };
}

export function Message({ message, sources, config }: Readonly<MessageProps>) {
    if (!message.content) return null;

    const isUser = message.role !== "assistant";
    const Icon = config.icon;

    // Use sources from props (which come from message.sources in parent)
    const displaySources = sources;

    return (
        <div className={`flex gap-4 mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
            {/* Assistant Avatar */}
            {!isUser && (
                <Avatar className={`h-8 w-8 bg-gradient-to-br ${config.gradient} flex-shrink-0`}>
                    <AvatarFallback className="bg-transparent text-white">
                        <Icon className="w-4 h-4" />
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Message Content Card */}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? `bg-gradient-to-br ${config.gradient} text-white`
                        : `bg-white text-gray-800 border ${config.borderColor} shadow-sm`
                }`}
            >
                <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    {isUser ? (
                        <Balancer>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </Balancer>
                    ) : (
                        <ReactMarkdown
                            components={{
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                ul: ({children}) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                h1: ({children}) => <h1
                                    className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                                h2: ({children}) => <h2
                                    className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({children}) => <h3
                                    className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Sources / References */}
                {!isUser && displaySources && displaySources.length > 0 && (
                    <Accordion type="single" collapsible className="mt-2 w-full">
                        {displaySources.map((source, index) => (
                            <AccordionItem value={`source-${index}`} key={index}>
                                <AccordionTrigger>{`Source ${index + 1}`}</AccordionTrigger>
                                <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                        {sanitizeAndFormatText(source)}
                                    </ReactMarkdown>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>

            {/* User Avatar */}
            {isUser && (
                <Avatar className="h-8 w-8 bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0">
                    <AvatarFallback className="bg-transparent text-white text-xs">You</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}