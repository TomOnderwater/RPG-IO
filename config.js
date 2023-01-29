const testing = {
    port: 3000, host: 'localhost', 
    reset: 1000 * 3600 * 24, 
    difficulty: 'easy',
    title: 'mobfight',
    basedungeons: [
        {key: 'world', mode: 'survival', difficulty: 'normal', size: {width: 100, height: 100}},
        {key: 'arena', mode: 'arena', difficulty: 'easy'}
    ]}

// change to no bear: 'peaceful'
const deployment = {
    port: 3000, host: 'localhost', 
    difficulty: 'peaceful',
    title: 'baskin',
    basedungeons: [
        {key: 'world', mode: 'survival', difficulty: 'normal', size: {width: 100, height: 100}}
    ]}

module.exports = {testing, deployment}