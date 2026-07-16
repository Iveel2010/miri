import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherClientEnabled = Boolean(KEY && CLUSTER);

type Listener = (data: unknown) => void;

export function useRealtime(channel: string, event: string, onMessage: Listener) {
  useEffect(() => {
    if (!pusherClientEnabled) return;

    let pusher: import("pusher-js").default | null = null;
    let channelInstance: import("pusher-js").Channel | null = null;

    const handler = (data: unknown) => {
      onMessage(data);
    };

    const init = async () => {
      const PusherModule = (await import("pusher-js")).default;
      pusher = new PusherModule(KEY!, {
        cluster: CLUSTER!,
      });

      channelInstance = pusher.subscribe(channel);

      channelInstance.bind(event, handler);
    };

    init();

    return () => {
      if (channelInstance && pusher) {
        channelInstance.unbind(event, handler);
        pusher.unsubscribe(channel);
        pusher.disconnect();
      }
    };
  }, [channel, event, onMessage]);
}

export function useRealtimeAdmin(onEvent: (event: string, data: unknown) => void) {
  useEffect(() => {
    if (!pusherClientEnabled) return;

    let pusher: import("pusher-js").default | null = null;
    let channelInstance: import("pusher-js").Channel | null = null;

    const init = async () => {
      const PusherModule = (await import("pusher-js")).default;
      pusher = new PusherModule(KEY!, {
        cluster: CLUSTER!,
      });

      channelInstance = pusher.subscribe("private-admin");

      const events = [
        "new-purchase-request",
        "new-contact-message",
        "new-order",
        "stats-update",
      ];

      events.forEach((evt) => {
        channelInstance!.bind(evt, (data: unknown) => {
          onEvent(evt, data);
        });
      });
    };

    init();

    return () => {
      if (channelInstance && pusher) {
        channelInstance.unbind_all?.();
        pusher.unsubscribe("private-admin");
        pusher.disconnect();
      }
    };
  }, [onEvent]);
}
