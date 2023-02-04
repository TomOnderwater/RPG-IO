/****
 * params:
 * difficulties: peaceful, easy, normal, hard
 * gamemodes: survival, arena
 * 
 */

const testing = {
    port: 3000, host: 'localhost', 
    reset: 1000 * 3600 * 24, 
    difficulty: 'easy',
    title: 'MobFight',
    basedungeons: [
        {key: 'world', mode: 'survival', difficulty: 'normal', size: {width: 100, height: 100}},
        {key: 'arena', mode: 'arena', difficulty: 'easy'}
    ]}

const deployment = {
    port: 3000, host: 'localhost', 
    //reset: 1000 * 3600 * 24, 
    difficulty: 'normal',
    title: 'MobFight',
    basedungeons: [
        {key: 'world', mode: 'survival', difficulty: 'normal', size: {width: 100, height: 100}},
        {key: 'arena', mode: 'arena', difficulty: 'easy'}
    ]}

// no bears, 1 main level standard
const flawk = {
        port: 3000, host: 'localhost', 
        difficulty: 'peaceful',
        title: 'Flawk IO',
        basedungeons: [
            {key: 'world', mode: 'survival', difficulty: this.difficulty, size: {width: 100, height: 100}}
        ]}

// change to no bear: 'peaceful'
const baskin = {
    port: 3000, host: 'localhost', 
    difficulty: 'peaceful',
    title: 'Baskin',
    basedungeons: [
        {key: 'world', mode: 'survival', difficulty: this.difficulty, size: {width: 100, height: 100}}
    ]}

module.exports = {testing, deployment, flawk, baskin}