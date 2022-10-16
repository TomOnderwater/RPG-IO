const PhysicalBody = require("./hitboxes")
const Func = require('./functions.js')


module.exports = class Hand
{
    constructor(owner, item, pos)
    {
        this.owner = owner
        this.level = owner.level
        this.item = item
        this.body = new PhysicalBody({type: 'circle', pos, rad: 0.15})
        this.moving = false
        this.handbounce = {x: 0, y: 0}
        this.hand = {x: 0, y: 0}
        this.primed = false
        this.shotfired = false
    }
    update(level, colliders)
    {
        this.level = level

        this.handleAction()

        // IF ITEM IS PHYSICAL WE CAN DO DAMAGE
        if (this.moving && this.item.physical)
        {
            let closebodies = level.closeBodies(this.body.pos, colliders, 1)
            let collisions = this.body.update(closebodies, this.owner.body) // except owner body
            if (collisions)
            {
                if (collisions.length)
                {
                    for (let collision of collisions)
                    {
                        if (collision.entity.health !== undefined)
                            level.addEvent(Func.calcAttack({
                                collision, 
                                item: this.item, 
                                attacker: this.owner.id, 
                                power: 1 + (this.owner.status.strength * 0.2)}))
                    }
                }
            }
        }
    }
    handleAction()
    {
        //if (Func.magnitude)
        let item = this.item
        let owner = this.owner
        let inventory = owner.inventory

        if (inventory.isUpdated(item))
            this.resetItem(inventory.getSelectedType())

        // what to do when input turns to zero physical ends after this loop
        if (Func.zeroVector(this.hand)) 
        {
            if (this.moving)
            { //hand was moving, what to do?
                if (item.type === BOW)
                    this.shoot(2)
                if (item.type === STAFF)
                {
                    let dir = Func.subtract(this.body.pos, Func.subtract(owner.body.pos, owner.body.speed))
                    this.shoot(0.5, dir)
                }
            }
            this.moving = false
            this.handbounce = {x: 0, y: 0}
            this.body.pos = owner.body.pos // follow player pos
            return
        }
        // spawn a new item
        if (!this.moving) 
            {
                let bounce = item.bounce
                this.body = new PhysicalBody({type: 'circle', pos: owner.body.pos, rad: item.rad, mass: item.mass, bounce})
                this.moving = true
            }
        // set target
        if (!item.physical)
        {
            //console.log(input, item.bounce)
            let target = Func.multiply(this.hand, item.reach)
            this.handbounce = Func.squareBounce(this.handbounce, target, item.bounce)
            this.body.pos = Func.add(owner.body.pos, this.handbounce)
        }
        else 
        {
            let target = Func.add(owner.body.pos, Func.multiply(this.hand, item.reach))
            this.body.target(target)
        }
        if (item.building)
            this.level.build(this) // will try to build

            // Full draw of the bow or full charge of the staff
        if (item.type === BOW || item.type === STAFF)
        {
            let treshold = item.reach * 127
            let draw = Func.magnitude(Func.subtract(owner.body.pos, this.body.pos))
            if (draw > treshold && !item.primed) 
                {
                    this.primed = true // MARKER -> SIGNAL TO CLIENT
                    item.primed = true
                }
            else if (draw < treshold) item.primed = false
        }
        //console.log(this.hand.body.pos)
    }
    shoot(power, _dir)
    {
        let item = this.item
        let owner = this.owner
        let inventory = owner.inventory
        // check ammo before shooting:
        let _d = _dir || Func.subtract(Func.subtract(owner.body.pos, owner.body.speed), this.body.pos)

        let dir = Func.multiply(_d, power)
        // for debug purposes

        if (Func.magnitude(dir) > item.minimumdraw)
        {
            if (!inventory.canRemove({type: item.type, count: 1}))
                return
            // remove ammo (based on shot type)
            inventory.remove({type: item.type, count: 1})
            this.level.addRangedAttack(
                {
                    owner, 
                    pos: owner.body.pos, 
                    item, 
                    dir, rad: 0.1, mass: 2,
                    type: item.projectile
                })
                this.shotfired = true
            }
    }
    resetItem(type)
    {
        this.item = createItem(type)
        this.hand.moving = false
    }

    updateInput(hand)
    {
        this.hand = Func.constrainVector(hand, 128)
    }

    data()
    {
        return {
            i: this.id, 
            t: this.item.type, 
            p: Func.fixPos(this.body.pos, 2),
            m: this.moving, 
            o: this.owner.id}
    }
}