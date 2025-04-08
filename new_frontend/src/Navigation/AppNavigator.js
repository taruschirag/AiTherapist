import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import JournalScreen from '../screens/JournalScreen';
import SummaryScreen from '../screens/SummaryScreen';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator for authenticated users
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Journal') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Chat') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Summary') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4A6741',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    backgroundColor: '#F5F5F5',
                    borderTopWidth: 1,
                    borderTopColor: '#D0C9BD',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Journal" component={JournalScreen} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Summary" component={SummaryScreen} />
        </Tab.Navigator>
    );
};

// Auth stack for login/register
const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};

// Root navigator
const AppNavigator = () => {
    // Simplify for now, assume user is authenticated
    const isAuthenticated = true;

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <MainTabNavigator />
            ) : (
                <AuthStack />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;