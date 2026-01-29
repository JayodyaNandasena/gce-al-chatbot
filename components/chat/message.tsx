import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { ChatGPTMessage } from "@/types";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import Balancer from "react-wrap-balancer";
import ReactMarkdown from "react-markdown";
import React from "react";
import {sanitizeAndFormatText} from "@/lib/utils";

// helper to convert newlines to <br /> tags
const convertNewLines = (text: string) =>
    text.split("\n").map((line, i) => (
        <span key={i}>
      {line}
            <br />
    </span>
    ));

interface MessageProps {
    message: any;
    sources: string[];
    config: {
        gradient: string;
        borderColor: string;
        icon: React.ElementType;
    };
}

export function Message({ message, sources, config }: MessageProps) {
    if (!message.content) return null;

    const formattedContent = convertNewLines(message.content);
    const isUser = message.role !== "assistant";
    const Icon = config.icon;

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
                <Balancer>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{formattedContent}</p>
                </Balancer>

                {/* Sources / References */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <Accordion type="single" collapsible className="mt-2 w-full">
                        {message.sources.map((source, index) => (
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
