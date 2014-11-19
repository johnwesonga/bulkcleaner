 /**
   * rateLimitExpBackoff()
   * @param {function} callBack some function to call that might return rate limit exception
   * @param {number} sleepFor optional amount of time to sleep for on the first failure in missliseconds
   * @param {number} maxAttempts optional maximum number of amounts to try
   * @param {number} attempts optional the attempt number of this instance - usually only used recursively and not user supplied
   * @return {object} results of the callback 
   **/
  
  function rateLimitExpBackoff ( callBack, sleepFor ,  maxAttempts, attempts  ) {

    // can handle multiple error conditions by expanding this list
    function errorQualifies (errorText) {
      return ["Exception: Service invoked too many times",
              "Exception: Rate Limit Exceeded"].some(function(e){
                return errorText.toString().slice(0,e.length) == e;
              });
    }
    
    
    // sleep start default is  2 seconds
    sleepFor = Math.abs(sleepFor || 2000);
    
    // attempt number
    attempts = Math.abs(attempts || 1);
    
    // maximum tries before giving up
    maxAttempts = Math.abs(maxAttempts || 5);

    // check properly constructed
    if (!callBack || typeof(callBack) !== "function") {
      throw ("you need to specify a function for rateLimitBackoff to execute");
    }
    
    // try to execute it
    else {

      try {
        return callBack();
      }
      catch(err) {
        // failed due to rate limiting
        if (errorQualifies(err)) {
          
          //give up?
          if (attempts > maxAttempts) {
            throw (err + " (tried backing off " + (attempts-1) + " times");
          }
          else {
            
            // wait for some amount of time based on how many times we've tried plus a small random bit to avoid races
            Utilities.sleep (Math.pow(2,attempts)*sleepFor) + (Math.round(Math.random() * sleepFor));

            // try again
            return self.rateLimitExpBackoff ( callBack, sleepFor ,  maxAttempts , attempts+1);
          }
        }
        else {
          // some other error
          throw (err);
        }
      }
    }
  };