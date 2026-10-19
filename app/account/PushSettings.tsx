"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush, type FormState } from "./actions";

type Mode = "checking" | "unsupported" | "needs-install" | "denied" | "off" | "on";

function keyBytes(base64url: string) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function registration() {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export function PushSettings({ publicKey, deviceCount }: { publicKey: string | null; deviceCount: number }) {
  const [mode, setMode] = useState<Mode>("checking");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<FormState>({});

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
        setMode(ios && !installed ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setMode("denied");
      try {
        const reg = await registration();
        const sub = await reg.pushManager.getSubscription();
        setMode(sub ? "on" : "off");
      } catch {
        setMode("unsupported");
      }
    })();
  }, []);

  async function turnOn() {
    if (!publicKey) return setStatus({ error: "Notifications aren't set up on the server yet." });
    setBusy(true);
    setStatus({});
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMode(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      const result = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      if (result.error) {
        await sub.unsubscribe();
        setStatus(result);
        return;
      }
      setMode("on");
      setStatus(result);
    } catch {
      setStatus({ error: "Couldn't turn notifications on. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setStatus({});
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setMode("off");
      setStatus({ done: "Notifications are off for this device." });
    } catch {
      setStatus({ error: "Couldn't turn notifications off. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setStatus(await sendTestPush());
    setBusy(false);
  }

  return (
    <div>
      {mode === "checking" && <p className="msg">Checking this device…</p>}

      {mode === "needs-install" && (
        <div className="msg">
          <p>On iPhone, notifications only work once the app is on your home screen:</p>
          <ol className="steps">
            <li>Tap the Share button in Safari (the square with an arrow).</li>
            <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            <li>Open Album of the Day from your home screen and come back here.</li>
          </ol>
        </div>
      )}

      {mode === "unsupported" && <p className="msg">This browser can&apos;t show notifications. Try Chrome or Safari, or the app on your phone&apos;s home screen.</p>}

      {mode === "denied" && (
        <p className="msg">
          Notifications are blocked for this site. Turn them on in your phone&apos;s settings (on iPhone: Settings → Notifications → Album of the Day), then come back.
        </p>
      )}

      {(mode === "off" || mode === "on") && (
        <div className="switch">
          <div className="txt" id="push-label">
            Morning notification
            <small>Around 8am UK time, when the new album is out.</small>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              aria-labelledby="push-label"
              checked={mode === "on"}
              disabled={busy}
              onChange={(e) => (e.target.checked ? turnOn() : turnOff())}
            />
            <span />
          </label>
        </div>
      )}

      {mode === "on" && (
        <div className="inline" style={{ marginTop: 10 }}>
          <button className="btn ghost small" type="button" onClick={test} disabled={busy}>Send me a test notification</button>
        </div>
      )}

      {deviceCount > 0 && (
        <p className="msg" style={{ marginTop: 10 }}>
          On for {deviceCount} {deviceCount === 1 ? "device" : "devices"} on your account.
        </p>
      )}
      {status.error && <p className="msg err" role="alert">{status.error}</p>}
      {status.done && <p className="msg ok" role="status">{status.done}</p>}
    </div>
  );
}
