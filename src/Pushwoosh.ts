import EventEmitter from './EventEmitter';

type TInitParams = {
  applicationCode: string;
  safariWebsitePushID?: string;
  autoSubscribe?: boolean;
};

class Pushwoosh {
  private _ee: EventEmitter = new EventEmitter();
  private _commands = [];

  init(params: TInitParams) {

  }

  push(cmd: any) {
    if (typeof cmd === 'function') {
      this._runOrPush(() => cmd(this.api));
    }
    else if (Array.isArray(cmd)) {
      switch (cmd[0]) {
        case 'init':
          this._cmdInit(cmd[1]);
          break;
        case 'subscribe':
          this._runOrPush(() => {
            cmd[1](this._initer.initSubscribe());
          });
          break;
        case 'unsubscribe':
          this._runOrPush(() => {
            cmd[1](this._initer.unsubscribe());
          });
          break;
        default:
          throw new Error('unknown command');
      }
    }
    else {
      throw new Error('invalid command');
    }
  }

}

export default Pushwoosh;
