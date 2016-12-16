import {getPushToken, generateHwid, getPublicKey, getAuthToken, urlB64ToUint8Array} from '../functions'

const applicationServerPublicKey = 'BCW6JPG-T7Jx0bYKMhAbL6j3DL3VTTib7dwvBjQ' +
  'C_496a12auzzKFnjgFjCsys_YtWkeMLhogfSlyM0CaIktx7o';
const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

declare const Notification: {
  permission: 'granted' | 'denied' | 'default'
};

type TWorkerDriverParams = {
  serviceWorkerUrl: string
}

class WorkerDriver implements IPWDriver {
  constructor(private params: TWorkerDriverParams) {
    this.initWorker();
  }

  private async initWorker() {
    let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration || serviceWorkerRegistration.installing == null) {
      await navigator.serviceWorker.register(this.params.serviceWorkerUrl);
    }
  }

  async getPermission() {
    return Notification.permission === 'default' ? 'prompt' : Notification.permission;
  }

  async isSubscribed() {
    let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      return false;
    }
    let subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  async askSubscribe() {
    let serviceWorkerRegistration = await navigator.serviceWorker.ready;
    let subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: applicationServerKey})
    }
    return subscription;
  }

  async getAPIParams(applicationCode: string) {
    let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      throw new Error('No service worker registration');
    }
    serviceWorkerRegistration = await navigator.serviceWorker.ready;

    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

    const pushToken = getPushToken(subscription);
    return {
      hwid: generateHwid(applicationCode, pushToken),
      pushToken: pushToken,
      publicKey: getPublicKey(subscription),
      authToken: getAuthToken(subscription),
    };
  }
}

export default WorkerDriver;
