import { PlatformKey } from "@/lib/types";

const DEFAULT_POPUP_WIDTH = 720;
const DEFAULT_POPUP_HEIGHT = 840;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

export interface ConnectAccountOptions {
  platform: PlatformKey;
  studioId: string;
  studioSlug?: string;
  authUrl?: string;
  popupName?: string;
  width?: number;
  height?: number;
  timeoutMs?: number;
  onPopupBlocked?: () => void;
}

export function connectAccount({
  platform,
  studioId,
  studioSlug,
  authUrl,
  popupName = "OAuthWindow",
  width = DEFAULT_POPUP_WIDTH,
  height = DEFAULT_POPUP_HEIGHT,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onPopupBlocked,
}: ConnectAccountOptions): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  const url =
    authUrl ??
    `/api/onboarding/${platform}/auth?studioId=${studioId}${studioSlug ? `&studioSlug=${encodeURIComponent(studioSlug)}` : ""}`;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const popup = window.open(
    url,
    popupName,
    `width=${width},height=${height},top=${top},left=${left}`,
  );

  if (!popup) {
    onPopupBlocked?.();
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let resolved = false;
    const cleanup = () => {
      window.clearInterval(closeCheck);
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
    };

    const finish = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(value);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (
        event.data?.type === "OAUTH_SUCCESS" &&
        event.data?.platform === platform
      ) {
        finish(true);
      }
    };

    const closeCheck = window.setInterval(() => {
      if (popup.closed) {
        finish(false);
      }
    }, 400);

    const timeoutId = window.setTimeout(() => {
      finish(false);
    }, timeoutMs);

    window.addEventListener("message", handleMessage);
    popup.focus();
  });
}
