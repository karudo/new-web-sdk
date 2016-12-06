const levels: {[key: string]: number} = {
  error: 1,
  info: 2,
  debug: 3
};

export function logError(error: any) {

}

export function logDebug(mess: any) {

}

let numLevel = 2;

interface ILogger {
  setLevel(level: string): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  [key: string]: any;
}

const Logger: ILogger = {
  setLevel(level) {
    if (!levels[level]) {
      level = 'info';
    }
    numLevel = levels[level];
  }
} as ILogger;

Object.keys(levels).forEach((k: string) => {
  const n = levels[k];
  Logger[k] = (...args: any[]) => {
    if (n <= numLevel) {
      console.info(k, ...args);
      console.trace('trace');
    }
  };
});

export default Logger;
