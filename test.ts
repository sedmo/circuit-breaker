import { CircuitBreaker } from "./CircuitBreaker";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function demo() {
  try {
    // circuitbreaker instance
    const errorThreshold = 3;
    const timeWindow = 3; //in seconds
    let cb = new CircuitBreaker(errorThreshold, timeWindow);

    // demonstrate open after certain num of failures
    cb.do_call("example.com", "failure");
    cb.do_call("example.com", "failure");
    cb.do_call("example.com", "failure"); //should fail on this 3rd call
    await sleep(5000);
    //demonstrate closed and requests flow freely
    cb.do_call("example.com", "success");
    cb.do_call("example.com", "success"); // should be in closed state after running at least two passing calls in the HALF_OPEN state
  } catch (error) {
    console.error(error);
  }
}

demo();
