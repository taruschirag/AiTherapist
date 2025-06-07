// src/utils/handleOnboardingComplete.js
import { supabase } from '../services/supabase';

export const handleOnboardingComplete = async (user) => {
    localStorage.setItem('hasSeenWelcomeMessage', 'true');

    if (user) {
        const { error } = await supabase
            .from('Users')
            .update({ is_new_user: false })
            .eq('user_id', user.id);

        if (error) {
            console.error('❌ Failed to update Supabase:', error.message);
        } else {
            console.log('✅ is_new_user set to false in Supabase');
        }
    }
};
