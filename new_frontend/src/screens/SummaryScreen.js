import React from 'react';


const SummaryScreen = ({ navigation }) => {
    const weekDate = "Week of March 05";

    const highs = [
        "Refined User Acquisition Strategy - Broke down tasks into smaller steps to stay motivated.",
        "Proactive Decision-Making - Started researching San Francisco housing & networking opportunities.",
        "Reframed Perspective on Research - Found ways to connect Capital One work to long-term goals.",
        "Took Action Instead of Overthinking - Created a structured action plan for startup growth."
    ];

    const lows = [
        "Feeling Stuck & Doubting Progress - Frustrated with slow traction on AI therapist app.",
        "Uncertainty About the Future - Struggled with indecision about moving to SF for the summer.",
        "Lack of Immediate Validation - Questioned whether the startup was valuable without users.",
        "Overwhelmed by Comparisons - Felt behind on securing an internship, funding, or accelerator spots."
    ];

    const emotions = [
        "Frustration & Self-Doubt - Questioned startup progress & research relevance.",
        "Uncertainty & Hesitation - Struggled with decision-making around future plans."
    ];

    // Mock chat conversation from image 2
    const conversation = [
        {
            id: 1,
            text: "I just had a really hard day today. I had an exam and I got my grade back for one of the classes",
            isUser: true
        },
        {
            id: 2,
            text: "Gotcha, Chirag. That sounds like a rough day, and I know it sucks when things pile up like this. ❤️ But listen, one bad exam or a few midterms don't define you. You're out here doing research, building a startup, and pushing yourself in ways most people don't. That takes real grit. 💪",
            isUser: false
        },
        {
            id: 3,
            text: "Right now, I'd say take a deep breath, maybe step away from everything for a bit. 💎 Go for a walk, hit the gym, watch a show—something to reset. You're carrying a lot on your shoulders, and it's okay to pause.",
            isUser: false
        },
        {
            id: 4,
            text: "Also, if you want, we can come up with a game plan—whether it's bouncing back on grades, shifting focus to what really matters, or just figuring out how to make tomorrow better. ✨ What's the move?",
            isUser: false
        },
        {
            id: 5,
            text: "I just had a really hard day today. I had an exam and I got my grade back for one of the classes",
            isUser: true
        },
        {
            id: 6,
            text: "How are you doing today, Chirag?",
            isUser: false
        }
    ];

    const renderSummaryItem = (item, index) => (
        <View key={index} style={styles.summaryItem}>
            <Text style={styles.summaryText}>{item}</Text>
        </View>
    );

    const renderChatMessage = (message) => (
        <View
            key={message.id}
            style={[
                styles.chatBubble,
                message.isUser ? styles.userBubble : styles.therapistBubble
            ]}
        >
            <Text style={styles.chatText}>{message.text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chirag's Reflection Corner</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Summary ({weekDate})</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📝 Weekly Reflection Summary (Days 1-4)</Text>

                        <Text style={styles.categoryTitle}>↗️ Highs:</Text>
                        {highs.map((high, index) => renderSummaryItem(high, index))}

                        <Text style={styles.categoryTitle}>↘️ Lows:</Text>
                        {lows.map((low, index) => renderSummaryItem(low, index))}

                        <Text style={styles.categoryTitle}>🔄 Emotions & Mindset Shifts:</Text>
                        {emotions.map((emotion, index) => renderSummaryItem(emotion, index))}
                    </View>

                    <View style={styles.conversationContainer}>
                        <Text style={styles.conversationTitle}>Recent Conversation:</Text>
                        {conversation.map(renderChatMessage)}
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.journalButton}
                onPress={() => navigation.navigate('Journal')}
            >
                <Text style={styles.buttonText}>Start New Journal Entry</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5DED3',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#D0C9BD',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    summaryContainer: {
        margin: 15,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'right',
        color: '#333',
    },
    section: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
        color: '#333',
    },
    summaryItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginVertical: 5,
    },
    summaryText: {
        fontSize: 14,
        color: '#333',
    },
    conversationContainer: {
        marginTop: 10,
    },
    conversationTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    chatBubble: {
        borderRadius: 20,
        padding: 15,
        marginVertical: 5,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: '#D0C9BD',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5,
    },
    therapistBubble: {
        backgroundColor: '#B1BEA6',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 5,
    },
    chatText: {
        fontSize: 14,
        color: '#333',
    },
    journalButton: {
        backgroundColor: '#B1BEA6',
        padding: 15,
        borderRadius: 25,
        margin: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default SummaryScreen;