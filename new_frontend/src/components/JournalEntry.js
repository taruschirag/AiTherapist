// src/components/JournalEntry.js
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const JournalEntry = ({ onSave }) => {
    const [entry, setEntry] = useState('');
    const [questions, setQuestions] = useState([
        { id: 1, question: 'Tell Me About Your Day, Chirag', answer: '' },
        { id: 2, question: 'What are some Positive and Negative things that happened today?', answer: '' },
        { id: 3, question: 'Anything Else You want to share with me?', answer: '' },
    ]);

    const handleQuestionChange = (id, text) => {
        const updatedQuestions = questions.map(q =>
            q.id === id ? { ...q, answer: text } : q
        );
        setQuestions(updatedQuestions);
    };

    const handleSave = () => {
        const journalData = {
            questions: questions.map(q => ({ question: q.question, answer: q.answer })),
        };
        onSave(journalData);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chirag's Journal</Text>

            {questions.map((q) => (
                <View key={q.id} style={styles.questionContainer}>
                    <Text style={styles.questionText}>{q.question}</Text>
                    <TextInput
                        style={styles.input}
                        multiline
                        value={q.answer}
                        onChangeText={(text) => handleQuestionChange(q.id, text)}
                        placeholder="Write your thoughts here..."
                        placeholderTextColor={colors.lightText}
                    />
                </View>
            ))}

            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Finish Entry</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.m,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.l,
        textAlign: 'center',
    },
    questionContainer: {
        marginBottom: spacing.l,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.medium,
        padding: spacing.m,
        minHeight: 100,
        color: colors.text,
        ...shadows.small,
    },
    button: {
        backgroundColor: colors.secondary,
        padding: spacing.m,
        borderRadius: borderRadius.medium,
        alignItems: 'center',
        marginTop: spacing.l,
        ...shadows.small,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default JournalEntry;