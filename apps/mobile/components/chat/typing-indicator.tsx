import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { FitColors as T } from '@/constants/theme';

export function TypingIndicator() {
    const dot0 = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const makeBounce = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
                    Animated.delay(400 - delay),
                ]),
            );

        const animations = [makeBounce(dot0, 0), makeBounce(dot1, 160), makeBounce(dot2, 320)];
        animations.forEach((a) => a.start());
        return () => animations.forEach((a) => a.stop());
    }, [dot0, dot1, dot2]);

    const dotStyle = (dot: Animated.Value) => ({
        opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
    });

    return (
        <View style={s.row}>
            <Animated.View style={[s.dot, dotStyle(dot0)]} />
            <Animated.View style={[s.dot, dotStyle(dot1)]} />
            <Animated.View style={[s.dot, dotStyle(dot2)]} />
        </View>
    );
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 3,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: T.muted,
    },
});
