// last represents top of the stack
const last = stack => stack[stack.length - 1];
function parse(re) {
    // return array of states that will be used to process input string
    // iterate through re and generate or modify state 
    const stack = [[]]
    let i = 0;
    while (i < re.length) {
        const next = re[i]
        switch (next) {
            case ".": {
                last(stack).push({
                    type: 'wildcard',
                    quantifier: 'exactlyOne'
                });
                i++
                continue;
            }
            case "?": {
                const lastElement = last(last(stack))
                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw Error('Quantifier must follow an unquantified element or group')
                }
                lastElement.quantifier = 'zeroOrOne'
                i++;
                continue
            }
            case "*": {
                const lastElement = last(last(stack))
                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw Error('Quantifier must follow an unquantified element or group')
                }
                lastElement.quantifier = 'zeroOrMore'
                i++;
                continue
            }
            case '+': {
                const lastElement = last(last(stack));

                if (!lastElement || lastElement.quantifier !== 'exactlyOne') {
                    throw new Error('Quantifer must follow an unquantified element or group');
                }

                // Split this into two operations
                // 1. exactly one of the previous quantified element
                // 2. zeroOrMore of the previous quantified element
                const zeroOrMoreCopy = { ...lastElement, quantifier: 'zeroOrMore' };
                last(stack).push(zeroOrMoreCopy);
                i++;
                continue;
            }

            // grouping logic
            case '(': {
                stack.push([]);
                i++;
                continue
            }
            case ')': {
                if (stack.length <= 1) {
                    throw new Error(`No group to close at index ${i}`)
                }
                const states = stack.pop()
                last(stack).push({
                    type: 'groupElement',
                    states,
                    quantifier: 'exactlyOne'
                })
                i++;
                continue
            }
            case '\\': {
                // specifiy wanting to match char without invoking char matching
                if (i + 1 >= re.length) {
                    throw new Error(`Bad escape char at index ${i}`)
                }
                last(stack).push({
                    type: 'element',
                    value: re[i + 1],
                    quantifier: 'exactlyOne'
                });
                // increment index by two for the extra char
                i += 2;
                continue
            }
            default: {
                last(stack).push({
                    type: 'element',
                    value: next,
                    quantifier: 'exactlyOne'
                });
                i++;
                continue;
            }
        }
    }

    if (stack.length !== 1) {
        throw new Error('Unmatched groups in regular experession')
    }
    return stack[0]
}

// const { inspect } = require('util');
// const regex = 'a?(b.*c)+d';
// console.log(inspect(parse(regex), false, Infinity))
module.exports = parse;