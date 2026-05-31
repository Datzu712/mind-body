import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

import { FitColors as T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useApiClient } from '@/lib/api/client';
import { PROFILE_QUERY_KEY, useProfile } from '@/hooks/use-profile';
import { keycloakAccountUrls } from '@/lib/auth/keycloak-account';

export default function PersonalInfoScreen() {
    const { user } = useAuth();
    const apiFetch = useApiClient();
    const queryClient = useQueryClient();
    const { data: profile, isPlaceholderData } = useProfile();

    // Initialize from placeholder (JWT claims), then sync once real backend data arrives
    const [firstName, setFirstName] = useState(profile?.firstName ?? '');
    const [lastName, setLastName] = useState(profile?.lastName ?? '');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (profile && !isPlaceholderData) {
            setFirstName(profile.firstName ?? '');
            setLastName(profile.lastName ?? '');
        }
    }, [isPlaceholderData]);

    const mutation = useMutation({
        mutationFn: (data: { firstName: string; lastName: string }) =>
            apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: async (response) => {
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setFeedback({ type: 'error', message: data?.message ?? 'No se pudo guardar los cambios.' });
                return;
            }

            await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
            setFeedback({ type: 'success', message: 'Informacion actualizada correctamente.' });
        },
        onError: () => {
            setFeedback({ type: 'error', message: 'Error de red. Intenta nuevamente.' });
        },
    });

    function handleSave() {
        setFeedback(null);
        mutation.mutate({ firstName, lastName });
    }

    const saving = mutation.isPending;
    const hasChanges = firstName !== (profile?.firstName ?? '') || lastName !== (profile?.lastName ?? '');

    return (
        <SafeAreaView style={s.root} edges={['bottom']}>
            <Stack.Screen options={{ title: 'Informacion Personal' }} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar placeholder */}
                    <View style={s.avatarWrap}>
                        <View style={s.avatar}>
                            <Text style={s.avatarText}>
                                {(firstName[0] ?? profile?.firstName?.[0] ?? user?.username?.[0] ?? 'U').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Campos */}
                    <View style={s.fields}>
                        <View style={s.fieldGroup}>
                            <Text style={s.fieldLabel}>NOMBRE</Text>
                            <TextInput
                                style={s.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Tu nombre"
                                placeholderTextColor={T.muted}
                                autoCapitalize="words"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={s.fieldLabel}>APELLIDO</Text>
                            <TextInput
                                style={s.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Tu apellido"
                                placeholderTextColor={T.muted}
                                autoCapitalize="words"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={s.fieldLabel}>CORREO</Text>
                            <View style={[s.input, s.inputDisabled]}>
                                <Text style={s.inputDisabledText}>{profile?.email ?? '—'}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => WebBrowser.openBrowserAsync(keycloakAccountUrls.accountConsole)}
                            >
                                <Text style={s.fieldLink}>Cambiar correo desde tu cuenta →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Feedback */}
                    {feedback && (
                        <View style={[s.feedback, feedback.type === 'success' ? s.feedbackSuccess : s.feedbackError]}>
                            <Text
                                style={[
                                    s.feedbackText,
                                    feedback.type === 'success' ? s.feedbackTextSuccess : s.feedbackTextError,
                                ]}
                            >
                                {feedback.message}
                            </Text>
                        </View>
                    )}

                    {/* Boton guardar */}
                    <TouchableOpacity
                        style={[s.saveBtn, (!hasChanges || saving) && s.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={!hasChanges || saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={T.bg} />
                        ) : (
                            <Text style={s.saveBtnText}>GUARDAR CAMBIOS</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 32 },

    avatarWrap: { alignItems: 'center', paddingVertical: 28 },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 32, fontWeight: '900', color: T.bg },

    fields: { gap: 16 },
    fieldGroup: { gap: 6 },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: T.muted,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: T.white,
    },
    inputDisabled: {
        justifyContent: 'center',
    },
    inputDisabledText: {
        fontSize: 15,
        color: T.muted,
    },
    fieldHint: {
        fontSize: 11,
        color: T.muted,
        marginTop: 2,
    },
    fieldLink: {
        fontSize: 11,
        color: T.yellow,
        marginTop: 6,
    },

    feedback: {
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
    },
    feedbackSuccess: { backgroundColor: T.green + '18', borderWidth: 1, borderColor: T.green + '44' },
    feedbackError: { backgroundColor: T.red + '18', borderWidth: 1, borderColor: T.red + '44' },
    feedbackText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    feedbackTextSuccess: { color: T.green },
    feedbackTextError: { color: T.red },

    saveBtn: {
        backgroundColor: T.yellow,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 28,
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: {
        color: T.bg,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});
