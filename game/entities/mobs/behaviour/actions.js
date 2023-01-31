const Attack = require('./attacking.js')
const Walk = require('./walking.js')
const Func = require('../../../util/functions.js')

function getResponse(responses)
{
    let sum = Func.vector()
    if (!responses.length) return sum
    for (let response of responses)
    {
        sum = Func.add(sum, response)
    }
    return Func.divide(sum, responses.length)
} 

module.exports = 
{
    Attack, Walk, getResponse
}
