import EventEmitter from './EventEmitter';
import API from './API';
import {
  isSafariBrowser,
  getDeviceName,
  getBrowserVersion,
  canUseServiceWorkers,
  getPushwooshUrl,
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
  autoSubscribe?: boolean;
  pushwooshUrl?: string;
  logLevel?: string;
  userId?: string;
  tags?: {[key: string]: any};
  driversSettings?: {
    worker?: {
      serviceWorkerUrl?: string;
      applicationServerPublicKey?: string;
    }
  };
}

interface IInitParamsWithDefaults extends IInitParams {
  autoSubscribe: boolean;
  pushwooshUrl: string;
  tags: {Language: string, [key: string]: any};
  driversSettings: {
    worker: {
      serviceWorkerUrl: string;
      applicationServerPublicKey?: string;
    }
  };
}

const eventOnLoad = 'onLoad';
const eventOnReady = 'onReady';
const eventOnDenied = 'onDenied';
const eventOnRegister = 'onRegister';

type ChainFunction = (param: any) => Promise<any> | any;

class Pushwoosh {
  private params: IInitParamsWithDefaults;
  private _initParams: IInitParams;
  private _ee: EventEmitter = new EventEmitter();
  private _onPromises: {[key: string]: Promise<ChainFunction>};

  public api: API;
  public driver: IPWDriver;

  constructor() {
    this._onPromises = {
      [eventOnLoad]: new Promise(resolve => this._ee.once(eventOnLoad, resolve)),
      [eventOnReady]: new Promise(resolve => this._ee.once(eventOnReady, resolve)),
      [eventOnDenied]: new Promise(resolve => this._ee.once(eventOnDenied, resolve)),
      [eventOnRegister]: new Promise(resolve => this._ee.once(eventOnRegister, resolve)),
    };
  }

  init(initParams: IInitParams) {
    this._initParams  = initParams;
    if (!((isSafariBrowser() && getDeviceName() === 'PC') || canUseServiceWorkers())) {
      Logger.info('This browser does not support pushes');
      return;
    }
    const {applicationCode} = initParams;
    if (!applicationCode) {
      throw new Error('no application code');
    }

    const params = this.params = {
      autoSubscribe: false,
      pushwooshUrl: getPushwooshUrl(applicationCode),
      ...initParams,
      tags: {
        Language: navigator.language || 'en',
        ...initParams.tags
      },
      driversSettings: {
        ...initParams.driversSettings,
        worker: {
          serviceWorkerUrl: defaultServiceWorkerUrl,
          ...(initParams.driversSettings && initParams.driversSettings.worker),
        }
      }
    };

    if (canUseServiceWorkers()) {
      const {worker} = params.driversSettings;
      this.driver = new WorkerDriver({
        applicationCode: applicationCode,
        serviceWorkerUrl: worker.serviceWorkerUrl,
        applicationServerPublicKey: worker.applicationServerPublicKey,
      });
    }

    this._ee.emit(eventOnLoad);

    if (params.autoSubscribe) {
      this.driver.getPermission().then(permission => {
        if (permission === 'denied') {
          this._ee.emit(eventOnDenied);
        }
        else {
          this.subscribeAndRegister().catch(error => Logger.write('error', error));
        }
      });
    }
  }

  push(cmd: any) {
    if (typeof cmd === 'function') {
      this.push([eventOnLoad, cmd]);
    }
    else
    if (Array.isArray(cmd)) {
      const [cmdName, cmdFunc] = cmd;
      switch (cmdName) {
        case 'init':
          this.init(cmdFunc);
          break;
        case eventOnLoad:
        case eventOnReady:
        case eventOnDenied:
        case eventOnRegister:
          this._onPromises[cmdName].then(params => cmdFunc(params));
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
    const {params} = this;
    await Promise.all([
      this.api.setTags({...params.tags, 'Device Model': getBrowserVersion()}),
      params.userId && this.api.registerUser()
    ]);
    this._ee.emit(eventOnRegister, {params});
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
      JSON.stringify(savedApiParams) === JSON.stringify(apiParams) &&
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
}

export default Pushwoosh;
