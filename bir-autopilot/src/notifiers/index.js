// Notifiers share one shape: { channel, canSend(profile), send(profile, text) }.

export const consoleNotifier = {
  channel: 'console',
  canSend: () => true,
  async send(_profile, text) {
    console.log(`[reminder] ${text}`);
    return { ok: true };
  },
};

// Semaphore (semaphore.co), a Philippine SMS gateway.
export function semaphoreNotifier({ apiKey, senderName, fetchImpl = fetch }) {
  return {
    channel: 'sms',
    canSend: (profile) => Boolean(apiKey && profile.phone),
    async send(profile, text) {
      const body = new URLSearchParams({ apikey: apiKey, number: profile.phone, message: text });
      if (senderName) body.set('sendername', senderName);
      const res = await fetchImpl('https://api.semaphore.co/api/v4/messages', { method: 'POST', body });
      if (!res.ok) throw new Error(`Semaphore returned HTTP ${res.status}: ${await res.text()}`);
      return { ok: true };
    },
  };
}

// Facebook Messenger Send API. Meta only allows free-form messages within 24 hours of the
// user's last message to your Page; outside that window you need an approved message tag
// or Meta's utility/marketing message products. MESSENGER_TAG lets you configure one.
export function messengerNotifier({ pageToken, graphVersion = 'v21.0', tag, fetchImpl = fetch }) {
  return {
    channel: 'messenger',
    canSend: (profile) => Boolean(pageToken && profile.messengerPsid),
    async send(profile, text) {
      const payload = {
        recipient: { id: profile.messengerPsid },
        message: { text },
        messaging_type: tag ? 'MESSAGE_TAG' : 'UPDATE',
        ...(tag ? { tag } : {}),
      };
      const res = await fetchImpl(`https://graph.facebook.com/${graphVersion}/me/messages?access_token=${encodeURIComponent(pageToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Messenger returned HTTP ${res.status}: ${await res.text()}`);
      return { ok: true };
    },
  };
}

export function notifiersFromEnv(env = process.env) {
  const list = [];
  if (env.SEMAPHORE_API_KEY) {
    list.push(semaphoreNotifier({ apiKey: env.SEMAPHORE_API_KEY, senderName: env.SEMAPHORE_SENDER_NAME }));
  }
  if (env.FB_PAGE_TOKEN) {
    list.push(messengerNotifier({ pageToken: env.FB_PAGE_TOKEN, graphVersion: env.FB_GRAPH_VERSION, tag: env.MESSENGER_TAG }));
  }
  if (!list.length) list.push(consoleNotifier);
  return list;
}
