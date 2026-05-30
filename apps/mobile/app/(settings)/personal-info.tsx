import { Stack } from 'expo-router';
import { useState } from 'react';
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

export default function PersonalInfoScreen() {
    const { user, session } = useAuth();

    const [firstName, setFirstName] = useState(user?.givenName ?? '');
    const [lastName, setLastName] = useState(user?.familyName ?? '');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    async function handleSave() {
        if (!session) return;

        setSaving(true);
        setFeedback(null);

        try {
            // TODO: reemplazar con la URL real del backend cuando este disponible
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ firstName, lastName }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setFeedback({ type: 'error', message: data?.message ?? 'No se pudo guardar los cambios.' });
                return;
            }

            // El token se actualizara en el proximo ciclo del refresh timer (60s)
            setFeedback({ type: 'success', message: 'Informacion actualizada correctamente.' });
        } catch {
            setFeedback({ type: 'error', message: 'Error de red. Intenta nuevamente.' });
        } finally {
            setSaving(false);
        }
    }

    const hasChanges = firstName !== (user?.givenName ?? '') || lastName !== (user?.familyName ?? '');

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
                                {(firstName[0] ?? user?.givenName?.[0] ?? user?.username?.[0] ?? 'U').toUpperCase()}
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
                                <Text style={s.inputDisabledText}>{user?.email ?? '—'}</Text>
                            </View>
                            <Text style={s.fieldHint}>El correo se gestiona desde la cuenta del IdP.</Text>
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
