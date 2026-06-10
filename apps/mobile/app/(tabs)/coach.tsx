import React, { useCallback, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { MessageBubble } from '@/components/chat/message-bubble';
import { useChatStream, type ChatMessage } from '@/lib/api/chat';

// ── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
    'Crea una rutina para principiantes',
    '¿Qué comer después de entrenar?',
    '¿Cómo mejorar mi sentadilla?',
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CoachScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const { sendMessage } = useChatStream();

    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }, []);

    const handleSend = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isStreaming) return;

            setInput('');

            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: trimmed,
            };
            const assistantMsgId = (Date.now() + 1).toString();
            const assistantMsg: ChatMessage = {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                streaming: true,
            };

            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            setIsStreaming(true);
            scrollToBottom();

            sendMessage(
                trimmed,
                (token) => {
                    setMessages((prev) =>
                        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + token } : m)),
                    );
                    scrollToBottom();
                },
                () => {
                    setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)));
                    setIsStreaming(false);
                },
                (error) => {
                    setMessages((prev) =>
                        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: error, streaming: false } : m)),
                    );
                    setIsStreaming(false);
                },
            );
        },
        [isStreaming, sendMessage, scrollToBottom],
    );

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <KeyboardAvoidingView style={s.flex} behavior="padding">
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.eyebrow}>ASISTENTE</Text>
                        <Text style={s.title}>COACH IA</Text>
                    </View>
                    <View style={s.headerIconWrap}>
                        <Ionicons name="sparkles" size={22} color={T.yellow} />
                    </View>
                </View>

                {/* Messages / Empty state */}
                <ScrollView
                    ref={scrollRef}
                    style={s.flex}
                    contentContainerStyle={messages.length === 0 ? s.emptyContainer : s.messagesContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {messages.length === 0 ? (
                        <EmptyState onSuggestion={handleSend} />
                    ) : (
                        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                    )}
                </ScrollView>

                <View style={s.inputBar}>
                    <TextInput
                        style={s.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Pregunta a tu coach..."
                        placeholderTextColor={T.muted}
                        multiline
                        maxLength={1000}
                        editable={!isStreaming}
                    />
                    <TouchableOpacity
                        style={[s.sendBtn, (!input.trim() || isStreaming) && s.sendBtnDisabled]}
                        onPress={() => handleSend(input)}
                        disabled={!input.trim() || isStreaming}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-up" size={18} color={!input.trim() || isStreaming ? T.muted : T.bg} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
    return (
        <View style={e.root}>
            <View style={e.iconWrap}>
                <Ionicons name="sparkles" size={36} color={T.yellow} />
            </View>
            <Text style={e.title}>Tu coach personal</Text>
            <Text style={e.sub}>Pregunta sobre rutinas, nutrición, técnica o cualquier duda de entrenamiento.</Text>
            <View style={e.chips}>
                {SUGGESTIONS.map((suggestion) => (
                    <TouchableOpacity
                        key={suggestion}
                        style={e.chip}
                        onPress={() => onSuggestion(suggestion)}
                        activeOpacity={0.8}
                    >
                        <Text style={e.chipText}>{suggestion}</Text>
                        <Ionicons name="arrow-forward" size={14} color={T.muted} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    flex: { flex: 1 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },
    headerIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyContainer: { flex: 1, justifyContent: 'center' },
    messagesContainer: { paddingTop: 16, paddingBottom: 8 },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: T.border,
        backgroundColor: T.bg,
    },
    input: {
        flex: 1,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        color: T.white,
        fontSize: 14,
        maxHeight: 100,
        lineHeight: 20,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sendBtnDisabled: {
        backgroundColor: T.card3,
    },
});

const e = StyleSheet.create({
    root: { alignItems: 'center', paddingHorizontal: 32 },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: T.white,
        marginBottom: 8,
        textAlign: 'center',
    },
    sub: {
        fontSize: 13,
        color: T.muted,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 24,
    },
    chips: { gap: 8, alignSelf: 'stretch' },
    chip: {
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chipText: {
        color: T.white,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
});
