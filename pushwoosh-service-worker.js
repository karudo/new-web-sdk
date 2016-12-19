importScripts('/worker-loader.js');
Pushwoosh.push(['onPush', function(message) {
  console.log(message);
  return new Promise((resolve) => {
    setTimeout(() => {
      message.body = 'HUI';
      //message.cancel();
      resolve();
    }, 2000);
  })
}]);
console.log(Pushwoosh);
