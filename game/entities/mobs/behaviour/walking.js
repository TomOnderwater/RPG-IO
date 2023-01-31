const Func = require('../../../util/functions.js')

module.exports = class WalkBehaviour 
{
    constructor(data)
    {
        this.target = false
        this.enemies = data.enemies || []
        this.randomDirection = false
        this.wander = Func.vector()
        this.repulsion = 0.1 || data.repulsion
    }
    update(data)
    {
        if (data.enemies) this.enemies = data.enemies
        if (!data.pos) return Func.vector()
        if (!data.perception) return Func.vector()

        let wander = this.randomWalk()
        if (wander) this.wander = wander
        let repulsions = []
        for (let line of data.perception)
        {
            if (!this.isEnemy(line.ray.obj)) // if not an enemy, avoid it!
            {
                let force = this.repulsion / (line.ray.dist + 0.0001)
                let repulsion = Func.getVector(line.a + Math.PI, force)
                repulsions.push(repulsion)
            }
        }
        let sum = Func.vector()
        for (let i = 0; i < repulsions.length; i++)
        {
            sum = Func.add(sum, repulsions[i])
        }
        sum = Func.add(sum, this.wander)
        return Func.divide(sum, repulsions.length + 1)
    }
    isEnemy(target)
    {
        for (let i = 0; i < this.enemies.length; i++)
        {
            if (this.enemies[i] === target) return true
        }
        return false
    }
    randomWalk(odds = 0.1)
    {
    if (Math.random() < odds)
        return { x: Func.getRandom(-1, 1), y: Func.getRandom(-1, 1)}
    return false
    }
}