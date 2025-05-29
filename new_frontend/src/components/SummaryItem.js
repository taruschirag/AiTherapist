// src/screens/SummaryScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SummaryItem from '../components/SummaryItem';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

const SummaryScreen = () => {
    // Mock data - In a real app, this would come from your API
    const weekSummary = {
        date: 'Week of March 05',

    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Summary (Week of March 05)</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Weekly Reflection Summary (Days 1-4)</Text>

                    <Text style={styles.categoryTitle}>📈 Highs:</Text>
                    {weekSummary.highs.map(item => (
                        <SummaryItem
                            key={item.id}
                            title={item.title}
                            description={item.description}
                            isPositive={true}
                        />
                    ))}

                    <Text style={styles.categoryTitle}>📉 Lows:</Text>
                    {weekSummary.lows.map(item => (
                        <SummaryItem
                            key={item.id}
                            title={item.title}
                            description={item.description}
                            isPositive={false}
                        />
                    ))}

                    <Text style={styles.categoryTitle}>🔄 Emotions & Mindset Shifts:</Text>
                    {weekSummary.emotions.map(item => (
                        <SummaryItem
                            key={item.id}
                            title={item.title}
                            description={item.description}
                            isPositive={false}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: colors.white,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    content: {
        padding: spacing.m,
    },
    section: {
        marginBottom: spacing.l,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.m,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
});

export default SummaryScreen;