import Pusher from "pusher";

const APP_ID = process.env.PUSHER_APP_ID;
const KEY = process.env.PUSHER_KEY;
const SECRET = process.env.PUSHER_SECRET;
const CLUSTER = process.env.PUSHER_CLUSTER;

export const pusherEnabled = Boolean(APP_ID && KEY && SECRET && CLUSTER);

export const pusher = pusherEnabled
  ? new Pusher({
      appId: APP_ID,
      key: KEY,
      secret: SECRET,
      cluster: CLUSTER,
      useTLS: true,
    } as Pusher.Options)
  : null;

export async function trigger(channel: string, event: string, data: unknown) {
  if (!pusher) return;
  try {
    await pusher.trigger(channel, event, data);
  } catch {
    // silently ignore trigger errors
  }
}
