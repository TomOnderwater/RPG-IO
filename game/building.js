const Func = require('./functions.js')

module.exports = class BuildManager
{
    constructor(level)
    {
        this.buildingevents = []
        this.level = level
    }
    build(hand)
    {
        let found = false
        // find the continued instance
        for (let buildingevent of this.buildingevents)
        {
            // same id and event
            if (buildingevent.id === hand.id &&
                buildingevent.type === hand.item.type)
                {
                    found = buildingevent
                    //console.log('continued building event')
                    break
                }
        }
        // there's a continued building event
        if (found !== false) 
        {
            //check if the pos is the same
            if (this.level.isFreeTile(hand.body.pos))
            {
                let continued = found.update(hand)
                if (!continued)
                {
                    this.endBuildingEvent(found)
                    this.addBuildingEvent(hand)
                    return
                }
            }
            else this.endBuildingEvent(found)
        }
        else this.addBuildingEvent(hand)
    }
    addBuildingEvent(hand)
    {
        // check if building is possible
        let pos = hand.body.pos
        // check if there's already a building
        //console.log('trying to add', pos)
        if (this.level.isFreeTile(pos))
        {
            //console.log('successful')
            this.buildingevents.push(new BuildingEvent({
                id: hand.id,
                pos: Func.floorPos(pos),
                type: hand.item.type
            }))
        }
    }
    endBuildingEvent(buildingevent)
    {
        for (let i = this.buildingevents.length - 1; i >= 0; i--)
        {
            if (buildingevent.id === this.buildingevents[i].id)
                    this.buildingevents.splice(i, 1)
        }
    }
    getPreviews()
    {
        let out = []
        for (let buildingevent of this.buildingevents)
        {
            out.push(buildingevent.progressData())
        }
        return out
    }
    update()
    {
        let completed = []
        for (let i = this.buildingevents.length - 1; i >= 0; i--)
        {
            let touched = this.buildingevents[i].updateTime()
            if (this.buildingevents[i].finished())
            {
                completed.push(this.buildingevents[i].getResult())
                this.buildingevents.splice(i, 1)
            }
            else if (!touched)
                this.buildingevents.splice(i, 1)
        }
        return completed
    }
}
class BuildingEvent
{
    constructor(data)
    {
        this.id = data.id
        this.type = data.type
        this.pos = data.pos
        this.ticks = 0
        this.time = data.time || 30
        this.touched = true
    }
    finished()
    {
        return (this.ticks >= this.time)
    }
    updateTime()
    {
        let out = this.touched
        if (this.touched)
            this.ticks ++
        this.touched = false
        return out
    }
    getResult()
    {
        return {pos: this.pos, type: this.type}
    }
    progressData()
    {
        let c = this.ticks / this.time
        return { 
        p: this.pos, 
        t: this.type, 
        c
    }
    }
    update(hand)
    {
        let pos = Func.floorPos(hand.body.pos)
        if (pos.x == this.pos.x && pos.y == this.pos.y)
        {
            this.touched = true
            return true
        }
        this.touched = false
        return false
    }
}