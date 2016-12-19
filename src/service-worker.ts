import {
  keyValue,
  log,
  message as messagesLog
} from './storage';
import {
  keyWorkerVerion,
  defaultNotificationTitle,
  defaultNotificationImage,
  defaultNotificationUrl
} from './constants';
import {getVersion} from './functions';

declare const caches: Cache;

console.log('sw version x');
self.Pushwoosh = [];

type TMessageInfo = {
  title: string;
  body: string;
  icon: string;
  openUrl: string;
  messageHash: string;
}

class PushwooshNotification {
  private _origMess: TMessageInfo;
  private _changedMess: TMessageInfo;
  private _canceled = false;

  constructor(info: TMessageInfo) {
    this._origMess = info;
    this._changedMess = {...info};
  }

  get title() {
    return this._changedMess.title;
  }
  set title(title: string) {
    this._changedMess.title = title;
  }

  get body() {
    return this._changedMess.body;
  }
  set body(body: string) {
    this._changedMess.body = body;
  }

  get icon() {
    return this._changedMess.icon;
  }
  set icon(icon) {
    this._changedMess.icon = icon;
  }

  get openUrl() {
    return this._changedMess.openUrl;
  }
  set openUrl(openUrl) {
    this._changedMess.openUrl = openUrl;
  }

  show() {
    if (!this._canceled) {
      const {_changedMess} = this;
      return self.registration.showNotification(_changedMess.title, {
        body: _changedMess.body,
        icon: _changedMess.icon,
        tag: JSON.stringify({
          url: _changedMess.openUrl,
          messageHash: _changedMess.messageHash
        })
      });
    }
  }

  cancel() {
    this._canceled = true;
  }

  _forLog() {
    return {
      orig: this._origMess,
      changed: this._changedMess,
      canceled: this._canceled,
    };
  }
}

async function onPush(event: PushEvent) {
  try {
    const payload = event.data.json();
    const notification = new PushwooshNotification({
      title: payload.header || defaultNotificationTitle,
      body: payload.body,
      icon: payload.i || defaultNotificationImage,
      openUrl: payload.l || defaultNotificationUrl,
      messageHash: payload.h
    });
    const callbacks = self.Pushwoosh.filter(cb => Array.isArray(cb) && cb[0] === 'onPush').map(cb => cb[1]);
    await callbacks.reduce((pr, fun) => pr.then(() => fun(notification)), Promise.resolve());
    await Promise.all([
      notification.show(),
      messagesLog.add({
        ...notification._forLog(),
        payload
      })
    ]);
  }
  catch (e) {
    await messagesLog.add({invalidPayload: event.data.text()});
  }
}

self.addEventListener('install', (event: InstallEvent) => {
  console.info('install', event);
  event.waitUntil(keyValue.set(keyWorkerVerion, getVersion()).then(() => self.skipWaiting()));
});

self.addEventListener('activate', function(event: ExtendableEvent) {
  console.info('activate', event);
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }).then(() => self.clients.claim()));
});

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(onPush(event));
});
