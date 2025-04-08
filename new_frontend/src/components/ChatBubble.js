// src/components/ChatBubble.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../styles/theme';

const ChatBubble = ({ message, isUser }) => {
    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : styles.assistantContainer
        ]}>
            <Text style={styles.messageText}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        padding: spacing.m,
        marginVertical: spacing.s,
        borderRadius: borderRadius.large,
        ...styles.medium,
    },
    userContainer: {
        backgroundColor: colors.chatBubbleUser,
        alignSelf: 'flex-end',
        marginLeft: '15%',
        borderTopRightRadius: 4,
    },
    assistantContainer: {
        backgroundColor: colors.chatBubbleAssistant,
        alignSelf: 'flex-start',
        marginRight: '15%',
        borderTopLeftRadius: 4,
    },
    messageText: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 22,
    },
});

export default ChatBubble;