onmessage = function(work){ 
    console.log('I am working on: ' + work.data);
    setTimeout(function(){postMessage('whoop')},1000);
};
