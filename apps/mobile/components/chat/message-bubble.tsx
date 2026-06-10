import { StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { FitColors as T } from '@/constants/theme';
import type { ChatMessage } from '@/lib/api/chat';
import { TypingIndicator } from './typing-indicator';

interface Props {
    message: ChatMessage;
}

const markdownStyles = {
    body: { color: T.white, fontSize: 14, lineHeight: 20 },
    paragraph: { marginTop: 0, marginBottom: 4 },
    strong: { color: T.yellow, fontWeight: '800' as const },
    em: { color: T.white },
    code_inline: {
        backgroundColor: T.card3,
        color: T.yellow,
        fontSize: 12,
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    fence: {
        backgroundColor: T.card3,
        borderRadius: 8,
        padding: 10,
        marginVertical: 6,
    },
    code_block: {
        backgroundColor: T.card3,
        borderRadius: 8,
        padding: 10,
    },
    bullet_list_icon: { color: T.yellow, marginTop: 4 },
    ordered_list_icon: { color: T.yellow },
    link: { color: T.blue },
};

export function MessageBubble({ message }: Props) {
    if (message.role === 'user') {
        return (
            <View style={s.userRow}>
                <View style={s.userBubble}>
                    <Text style={s.userText}>{message.content}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={s.assistantRow}>
            <View style={s.assistantBubble}>
                {message.streaming && message.content === '' ? (
                    <TypingIndicator />
                ) : (
                    <Markdown style={markdownStyles}>{message.content}</Markdown>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    userRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    userBubble: {
        backgroundColor: T.yellow,
        borderRadius: 18,
        borderTopRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '80%',
    },
    userText: {
        color: T.bg,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    assistantRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    assistantBubble: {
        backgroundColor: T.card2,
        borderRadius: 18,
        borderTopLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '85%',
    },
});
