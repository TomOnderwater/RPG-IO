const Func = require('../../../util/functions.js')

module.exports = class AttackBehaviour 
{
    constructor(data)
    {
        this.target = false
        this.enemies = data.enemies || []
        this.aggro = 0
        this.aggroDuration = data.aggroDuration || 100
        this.force = data.force || 0.2
    }
    update(data)
    {
        if (data.enemies) this.enemies = data.enemies
        if (!data.pos) return Func.vector()
        if (!data.perception) return Func.vector()

        for (let line of data.perception)
        {
            if (this.isEnemy(line.ray.obj))
            {
                this.aggro = this.aggroDuration
                this.target = Func.add(data.pos, Func.getVector(line.a, line.ray.dist))
                let force = (line.ray.dist < this.sprintDistance) ? this.force * 2 : this.force
                return Func.getVector(line.a, force)
            }
        }
        if (this.aggro > 0) // if still aggro, return the last seen location of the target
        {
            this.aggro -= 1
            // keep walking to the target
            return Func.normalize(Func.subtract(this.target, data.pos), this.force)
        }
        return Func.vector()
    }
    isEnemy(target)
    {
        for (let i = 0; i < this.enemies.length; i++)
        {
            if (this.enemies[i] === target) return true
        }
        return false
    }
}