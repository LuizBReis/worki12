const supabase = require('../config/supabase');

const notifyUser = async (userId, event, payload) => {
    // Broadcast to 'user:{userId}' topic
    const channel = supabase.channel(`user:${userId}`);

    // We need to subscribe first? No, for sending from server (if using supabase-js in node),
    // we usually just 'send'. BUT standard supabase-js client requires subscription.
    // In a serverless/backend context, keeping open subscriptions is bad.
    // However, broadcasting *without* being a subscriber might not be supported directly by the JS client 
    // without 'subscribe()'.
    // 
    // WORKAROUND: Subscribe, Send, Unsubscribe?
    // Or send via HTTP REST API (Supabase Realtime API)?
    // Using the JS Client in Node environment:

    const subscription = channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: event,
                payload: payload
            });
            supabase.removeChannel(channel);
        }
    });
};

const emitToRoom = async (room, event, payload) => {
    const channel = supabase.channel(room);

    const subscription = channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: event,
                payload: payload
            });
            supabase.removeChannel(channel);
        }
    });
};

module.exports = {
    notifyUser,
    emitToRoom
};
