import {logError, logDebug} from './logger';

function logAndRejectError(error: string, reject: (e: any) => void) {
  const logText = new Error(error);
  logError(logText);
  reject(logText);
}

export default function createDoApiXHR(pushwooshUrl: string) {
  return function doApiXHR(methodName: string, request: any) {
    logDebug(`Performing ${methodName} call to Pushwoosh with arguments: ${JSON.stringify(request)}`);
    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        const url = pushwooshUrl + methodName;
        const params = {request};

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
        xhr.onload = function xhrOnLoad() {
          if (this.status == 200) {
            const response = JSON.parse(this.responseText);
            if (response.status_code == 200) {
              logDebug(`${methodName} call to Pushwoosh has been successful`);
              resolve(response.response);
            }
            else {
              logAndRejectError(`Error occurred during the ${methodName} call to Pushwoosh: ${response.status_message}`, reject);
            }
          }
          else {
            logAndRejectError(`Error occurred, status code: ${this.status}`, reject);
          }
        };
        xhr.onerror = function xhrOnError(e) {
          logAndRejectError(`Pushwoosh response to ${methodName} call in not ok: ${e}`, reject);
        };
        xhr.send(JSON.stringify(params));
      }
      catch (e) {
        logAndRejectError(`Exception while ${methodName} the device: ${e}`, reject);
      }
    });
  };
}
