const parse = require("./parser")

function stateMatchesStringAtIndex(state, str, i) {
    // check if index is outside bounds of the string
    if (i >= str.length) {
        return [false, 0]
    }

    // wildcards always match
    if (state.type === 'wildcard') {
        return [true, 1]
    }
    // check for element literal 
    if (state.type == 'element') {
        const match = state.value === str[i];
        return [match, match ? 1 : 0];
    }

    // check for group element match
    if (state.type == 'groupElement') {
        return test(state.states, str.slice(i));
    }

    throw new Error('Unsupported element type')
}

function test(states, str) {
    const queue = states.slice()
    let i = 0;
    const backtrackStack = [];
    // get 0th state 
    let currentState = queue.shift()

    const backtrack = () => {
        // going backup the queue of states
        queue.unshift(currentState)
        let couldBacktrack = false;
        while (backtrackStack.length) {
            const { isBacktrackable, state, consumptions } = backtrackStack.pop()
            if (isBacktrackable) {
                if (consumptions.length === 0) {
                    // if it's unconsumed it' not backtrackable and leave it back in the queue
                    queue.unshift(state);
                    continue;
                }
                // remove that num of chars from the index moving it backwards
                const n = consumptions.pop()
                i -= n;
                backtrackStack.push({ isBacktrackable, state, consumptions })
                couldBacktrack = true
                break;
            }
            queue.unshift(state)
            // move index back to as many chars as it consumed if it can't backtrack
            consumptions.forEach(n => {
                i -= n
            });
        }

        if(couldBacktrack){
            currentState = queue.shift();
        }
        return couldBacktrack
    }

    while (currentState) {
        switch (currentState.quantifier) {
            case 'exactlyOne': {
                // check the match and consume result
                [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i)
                if (!isMatch) {
                    const indexBeforeBacktracking = i;
                    const couldBacktrack = backtrack()
                    if (!couldBacktrack) {
                        return [false, indexBeforeBacktracking];
                    }
                    continue;
                }
                // this is not backtrackable b/c it's matched exactly once
                backtrackStack.push({
                    isBacktrackable: false,
                    state: currentState,
                    consumptions: [consumed]
                })
                // if matched increment i by consumed numbers
                // and shift queue to the next state
                i += consumed;
                currentState = queue.shift()
                continue
            }
            case 'zeroOrOne': {
                // if we find the end of input
                // means element is optional so we just consider this a match
                if (i >= str.length) {
                    backtrackStack.push({
                        isBacktrackable: false,
                        state: currentState,
                        consumptions: [0]
                    })
                    currentState = queue.shift()
                    continue;
                }
                // if not reached to the end
                [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i)
                i += consumed
                // push to backtrack
                backtrackStack.push({
                    isBacktrackable: isMatch && consumed > 0,
                    state: currentState,
                    consumptions: [consumed]
                })
                currentState = queue.shift()
                continue
            }
            case 'zeroOrMore': {
                // backtrackable state reference
                const backtrackState = {
                    isBacktrackable: true,
                    state: currentState,
                    consumptions: []
                }
                while (true) {
                    if (i >= str.length) {
                        // reached end of loop
                        if (backtrackState.consumptions.length === 0) {
                            backtrackState.consumptions.push(0)
                            backtrackState.isBacktrackable = false
                        }
                        backtrackStack.push(backtrackState)
                        currentState = queue.shift();
                        break;
                    }

                    const [isMatch, consumed] = stateMatchesStringAtIndex(currentState, str, i)
                    if (!isMatch || consumed === 0) {
                        if (backtrackState.consumptions.length === 0) {
                            backtrackState.consumptions.push(0)
                            backtrackState.isBacktrackable = false
                        }
                        backtrackStack.push(backtrackState)
                        currentState = queue.shift()
                        break;
                    }

                    backtrackState.consumptions.push(consumed)
                    i += consumed;
                }
                continue;
            }
            default: {
                throw new Error('Unsupported operation')
            }
        }
    }
    // end of while
    return [true, i];
}

const regex = 'a.*c';
const states = parse(regex);
const examplString = 'aasdflqkjW!@#$!c$#ASDF'
const result = test(states, examplString)
console.log("Regex Engine result: ", result)