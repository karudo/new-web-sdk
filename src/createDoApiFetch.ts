import {logError} from './logger';

function logAndThrowError(error: string) {
  const logText = new Error(error);
  logError(logText);
  throw logText;
}

export default function createDoApiFetch(pushwooshUrl: string, logger: any) {
  return function doApiFetch(methodName: string, request: any) {
    logger.debug(`Performing ${methodName} call to Pushwoosh with arguments: ${JSON.stringify(request)}`);
    const url = pushwooshUrl + methodName;
    const params = {request};

    return fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify(params)
    }).then((response) => {
      if (!response.ok) {
        logAndThrowError(response.statusText || 'response not ok');
      }
      return response.json().then((json: any) => {
        if (json.status_code != 200) {
          logAndThrowError(`Error occurred during the ${methodName} call to Pushwoosh: ${json.status_message}`);
        }
        return json.response;
      });
    });
  };
}
