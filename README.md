# Circuit breaker

Circuit breaker implementation written in typescript. During half open state, there is a map keeping record of failues and succeses.
If more than 50% of calls are failues, it goes back to open state. If more than 50% of calls are succeses, it goes back to closed state.
