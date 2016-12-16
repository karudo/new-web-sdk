import EventEmitter from './EventEmitter';
import API from './API';
import {
  isSafariBrowser,
  getDeviceName,
  getBrowserVersion,
  canUseServiceWorkers,
  getPushwooshUrl,
  shallowEqual, getVersion
} from './functions';
import {
  defaultServiceWorkerUrl,
  keyApiParams,
  keyInitParams,
  keySDKVerion,
  keyLastSentAppOpen
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
  language?: string;
  logLevel?: string;
  userId?: string;
  tags?: {Language?: string, [key: string]: any}
}

interface IInitParamsWithDefauls extends IInitParams {
  language: string;
  autoSubscribe: boolean;
  serviceWorkerUrl: string;
  pushwooshUrl: string;
}

class Pushwoosh {
  private params: IInitParamsWithDefauls;
  private _initParams: IInitParams;
  private _ee: EventEmitter = new EventEmitter();
  private _onLoadPromise: Promise<any>;
  private api: API;

  public driver: IPWDriver;

  constructor() {
    this._onLoadPromise = new Promise(resolve => this._ee.once('event-onload', resolve));
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
      language: navigator.language || 'en',
      serviceWorkerUrl: defaultServiceWorkerUrl,
      pushwooshUrl: getPushwooshUrl(applicationCode),
      ...params
    };

    if (canUseServiceWorkers()) {
      this.driver = new WorkerDriver({serviceWorkerUrl: this.params.serviceWorkerUrl as string});
    }

    this._ee.emit('event-onload');

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
    if (typeof cmd === 'function') {
      this._runCmd(() => cmd());
    }
    else if (Array.isArray(cmd)) {
      switch (cmd[0]) {
        case 'init':
          this.init(cmd[1]);
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

    const driverApiParams = await this.driver.getAPIParams(this.params.applicationCode);
    const {params} = this;
    let apiParams: TPWAPIParams = {
      ...driverApiParams,
      applicationCode: params.applicationCode,
      language: params.language,
    };
    if (params.userId) {
      apiParams.userId = params.userId
    }
    const func = createDoApiXHR(params.pushwooshUrl);
    this.api = new API(func, apiParams);
  }

  async register() {
    if (!this.api) {
      throw new Error('not subscribed');
    }
    await this.api.registerDevice();
    await Promise.all([
      this.api.setTags({
        'Language': this.params.language,
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

    const apiParams = await this.driver.getAPIParams(this.params.applicationCode);
    let {tags: savedTags, ...savedInitParamsWOTags} = savedInitParams || {} as TPWAPIParams;
    let {tags, ...initParamsWOTags} = this.params;

    const shouldRegister = !(
      getVersion() === savedSDKVersion &&
      shallowEqual(savedApiParams, apiParams) &&
      shallowEqual(savedInitParamsWOTags, initParamsWOTags) &&
      JSON.stringify(savedTags) === JSON.stringify(tags)
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
    if ((curTime - lastSentTime) > 3600000) {
      await Promise.all([
        keyValue.set(keyLastSentAppOpen, curTime),
        this.api.applicationOpen()
      ]);
    }
  }

  private _runCmd(func: any) {
    return this._onLoadPromise.then(func);
  }
}

export default Pushwoosh;
