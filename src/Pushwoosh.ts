import EventEmitter from './EventEmitter';
import API from './API';
import {
  isSafariBrowser,
  getDeviceName,
  getBrowserVersion,
  canUseServiceWorkers,
  getPushwooshUrl,
  shallowEqual,
  getVersion
} from './functions';
import {
  defaultServiceWorkerUrl,
  keyApiParams,
  keyInitParams,
  keySDKVerion,
  keyLastSentAppOpen,
  periodSendAppOpen
} from './constants';
import Logger from './logger'
import WorkerDriver from './drivers/worker';
import createDoApiXHR from './createDoApiXHR';
import {keyValue} from './storage';

interface IInitParams  {
  applicationCode: string;
  safariWebsitePushID?: string;
  serviceWorkerUrl?: string;
  autoSubscribe?: boolean;
  pushwooshUrl?: string;
  logLevel?: string;
  userId?: string;
  tags?: {[key: string]: any};
}

interface IInitParamsWithDefauls extends IInitParams {
  autoSubscribe: boolean;
  serviceWorkerUrl: string;
  pushwooshUrl: string;
  tags: {Language: string, [key: string]: any}
}

const eventOnLoad = 'event-onLoad';
const eventOnReady = 'event-onReady';

class Pushwoosh {
  private params: IInitParamsWithDefauls;
  private _initParams: IInitParams;
  private _ee: EventEmitter = new EventEmitter();
  private _onLoadPromise: Promise<any>;
  private _onReadyPromise: Promise<any>;

  public api: API;
  public driver: IPWDriver;

  constructor() {
    this._onLoadPromise = new Promise(resolve => this._ee.once(eventOnLoad, resolve));
    this._onReadyPromise = new Promise(resolve => this._ee.once(eventOnReady, resolve));
  }

  init(params: IInitParams) {
    this._initParams  = params;
    if (!((isSafariBrowser() && getDeviceName() === 'PC') || canUseServiceWorkers())) {
      Logger.info('This browser does not support pushes');
      return;
    }
    const {applicationCode} = params;
    if (!applicationCode) {
      throw new Error('no application code');
    }

    this.params = {
      autoSubscribe: false,
      serviceWorkerUrl: defaultServiceWorkerUrl,
      pushwooshUrl: getPushwooshUrl(applicationCode),
      ...params,
      tags: {
        Language: navigator.language || 'en',
        ...params.tags
      }
    };

    if (canUseServiceWorkers()) {
      this.driver = new WorkerDriver({
        applicationCode: applicationCode,
        serviceWorkerUrl: this.params.serviceWorkerUrl
      });
    }

    this._ee.emit(eventOnLoad);

    if (this.params.autoSubscribe) {
      this.driver.getPermission().then(permission => {
        if (permission === 'denied') {
          Logger.info('Permission denied');
        }
        else {
          this.subscribeAndRegister().catch(e => console.log(e));
        }
      });
    }
  }

  push(cmd: any) {
    /*if (typeof cmd === 'function') {
      this._runOnLoad(() => cmd());
    }
    else */
    if (Array.isArray(cmd)) {
      switch (cmd[0]) {
        case 'init':
          this.init(cmd[1]);
          break;
        case 'onLoad':
          this._onLoadPromise.then(cmd[1]);
          break;
        case 'onReady':
          this._onReadyPromise.then(cmd[1]);
          break;
        default:
          throw new Error('unknown command');
      }
    }
    else {
      throw new Error('invalid command');
    }
  }

  async subscribe() {
    let issubs = await this.driver.isSubscribed();
    if (!issubs) {
      await this.driver.askSubscribe();
    }

    const driverApiParams = await this.driver.getAPIParams();
    const {params} = this;
    let apiParams: TPWAPIParams = {
      ...driverApiParams,
      applicationCode: params.applicationCode,
      language: params.tags.Language,
    };
    if (params.userId) {
      apiParams.userId = params.userId
    }
    const func = createDoApiXHR(params.pushwooshUrl);
    this.api = new API(func, apiParams);
    this._ee.emit(eventOnReady);
    if (this.driver.onApiReady) {
      this.driver.onApiReady(this.api);
    }
  }

  async register() {
    if (!this.api) {
      throw new Error('not subscribed');
    }
    await this.api.registerDevice();
    await Promise.all([
      this.api.setTags({
          ...this.params.tags,
        'Device Model': getBrowserVersion(),
      }),
      this.params.userId && this.api.registerUser()
    ]);
  }

  async subscribeAndRegister() {
    await this.subscribe();

    const {
      [keySDKVerion]: savedSDKVersion,
      [keyApiParams]: savedApiParams,
      [keyInitParams]: savedInitParams
    } = await keyValue.getAll();

    const apiParams = await this.driver.getAPIParams();

    const shouldRegister = !(
      getVersion() === savedSDKVersion &&
      shallowEqual(savedApiParams, apiParams) &&
      JSON.stringify(savedInitParams) === JSON.stringify(this.params)
    );

    if (shouldRegister) {
      await Promise.all([
        this.register(),
        keyValue.set(keyApiParams, apiParams),
        keyValue.set(keyInitParams, this.params),
        keyValue.set(keySDKVerion, getVersion())
      ]);
    }

    const val = await keyValue.get(keyLastSentAppOpen);
    let lastSentTime = Number(val);
    if (isNaN(lastSentTime)) {
      lastSentTime = 0;
    }
    const curTime = Date.now();
    if ((curTime - lastSentTime) > periodSendAppOpen) {
      await Promise.all([
        keyValue.set(keyLastSentAppOpen, curTime),
        this.api.applicationOpen()
      ]);
    }
  }

  private _runOnLoad(func: any) {
    return this._onLoadPromise.then(func);
  }
}

export default Pushwoosh;
