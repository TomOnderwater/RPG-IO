console.log('loading tf')
const tf = require('@tensorflow/tfjs-node')
console.log('loaded')

module.exports = class Brain
{
    constructor(config)
    {
        this.config = config
        this.xs = config.xs
        this.ys = config.ys
        this.hiddennodes = config.hiddennodes
        this.memory = config.memory
    }
    predict(input)
    {
        return 0
    }
}