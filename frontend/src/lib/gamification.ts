import { supabase } from './supabase';

export const LEVELS = [
    { level: 1, minXp: 0 },
    { level: 2, minXp: 100 },
    { level: 3, minXp: 300 },
    { level: 4, minXp: 600 },
    { level: 5, minXp: 1000 },
    { level: 6, minXp: 1500 },
    { level: 7, minXp: 2100 },
    { level: 8, minXp: 2800 },
    { level: 9, minXp: 3600 },
    { level: 10, minXp: 4500 },
];

export const calculateLevel = (xp: number) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXp) {
            return LEVELS[i].level;
        }
    }
    return 1;
};

export const addXP = async (userId: string, amount: number) => {
    try {
        // Get current XP
        const { data: worker, error: fetchError } = await supabase
            .from('workers')
            .select('xp')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        const currentXp = worker.xp || 0;
        const newXp = currentXp + amount;
        const newLevel = calculateLevel(newXp);

        // Update XP and Level
        const { error: updateError } = await supabase
            .from('workers')
            .update({
                xp: newXp,
                level: newLevel
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        return { newXp, newLevel };
    } catch (error) {
        console.error('Error adding XP:', error);
        return null;
    }
};
