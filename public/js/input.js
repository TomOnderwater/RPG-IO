class MobileInput {
    constructor()
    {
        this.inventory = new Inventory(inventorySpecs)
        // check the minimum height of the joysticks
        this.joystick = new JoyStick({
            dia: 128,
            area: {x1:  0, y1: 0, x2: width / 2, y2: height
        }})
        this.handStick = new UtitlityStick({
            dia: 150,
            area: {x1: width / 2, y1: 0, x2: width, y2: height
        }})
        this.usedTouches = []
        this.stats = new Stats()
    }
    update()
    {
        this.updateTouches()

        //do the inventory first
        let actions = []
        let inventoryactions = this.inventory.update()
        if (inventoryactions !== null) 
            actions = [...actions, ...inventoryactions]

        // get joysticks
        let joyout = this.joystick.update()
        let handout = this.handStick.update()

        let pointallocations = this.stats.update()
        if (pointallocations !== null) 
            actions = [...actions, ...pointallocations]

        //print(actions)
        //print(joyout)
        return {
            joy: {x: joyout.x, y: joyout.y}, 
            hand: {x: handout.x, y: handout.y}, 
            actions}
    }
    time() //time since input was instantiated
    {
        return new Date().getTime() - this.starttime
    }
    draw()
    {
        this.joystick.draw()
        this.handStick.draw()
        this.inventory.draw()
        this.stats.draw()
    }
    isFree(t)
    {
        return !inList(t.id, this.usedTouches)
    }
    getFreeTouch()
    {
        for (let t of touches)
        {
            if (this.isFree(t)) return t
        }
        return null
    }
    addTouch(t)
    {
        this.usedTouches.push(t.id)
    }
    updateTouches()
    {
        this.handleTouchEnd()
    }
    handleTouchEnd()
    {
        for (let i = this.usedTouches.length - 1; i >= 0; i--)
        {
            let ut = this.usedTouches[i]
            let found = false
            for (let t of touches)
            {
                if (ut === t.id) 
                {
                    found = true
                    break
                }
            }
            if (!found) this.usedTouches.splice(i, 1)
        }
    }
}

class Inventory
{
    constructor(specs)
    {
        this.items = []
        this.rowcount = specs.rowcount
        this.visible = specs.visible
        //this.currentTouch = {touch: null, index: 0}
        let minimumHeight = 60
        let minimumWidth = minimumHeight * this.rowcount

        if (width / 2 < minimumWidth)
        {
            let padding = (width - minimumWidth) / 2
            this.x_start = padding
            this.x_end = width - padding
        }
        else 
        {
            let div = 1 / 4
            this.x_start = div * width
            this.x_end = div * 3 * width
        }
        this.slots = this.initslots()
        this.fill(myitems)
        this.giveSelect(0)

        // OUTPUT
        this.actions = []
        this.stack = []
        this.activetouch = null
        this.swap = null
        //this.open = false
        //this.active = null
        // demo fill
    }
    fill(items)
    {
        //console.log('filling inventory', items)
        for (let i in items)
        {
            this.slots[i].set(items[i])
        }
    }
    initslots()
    {
        let slots = []
        let slotsize = (this.x_end - this.x_start) / this.rowcount
        this.height = slotsize
        let y_start = height - this.visible * slotsize
        //top row
        let id = 0
        for (let j = 0; j < this.visible; j ++)
        {
            for (let i = 0; i < this.rowcount; i++)
            {
                //calc pos
                let y = y_start + j * slotsize
                let x = this.x_start + i * slotsize
                let pos = createVector(x, y)
                slots.push(new Slot(id, pos, slotsize))
                id ++
            }
        }
        return slots
    }
    draw()
    {
        this.slots.forEach(slot => slot.draw())
    }
    updateState() // click player to open
    {
      if (!player) return null
        let touch = player.touch()
        if (touch && input.isFree(touch))
        {
            input.addTouch(touch)
            this.open = !this.open
            return this.open ? 'inventory' : 'close'
        }
        return null
    }
    setActive(slot, touch)
    {
        this.active = slot
        this.activetouch = touch
    }
    getCurrentTouch()
    {
    if (this.activetouch === null) return null
    return getTouchById(this.activetouch.id)
    }
    addToSpread(slot)
    {
        //this.spread = []
        console.log('stack:', this.stack)
        for (let s of this.stack)
        {
            if (s.id === slot.id) return
        }
        this.stack.push(slot)
    }
    setSwap(slot)
    {
        //console.log()
        this.swap = slot
        //console.log(this.swap)
    }
    giveSelect(id)
    {
        this.slots.forEach(slot => slot.selected = false) // deselect all
        this.slots[id].selected = true
    }
    getActions()
    {
        let output = []
        this.actions.forEach(action => output.push(action))
        this.actions = []
        return output
    }
    updateInventory(inventory)
    {
        if (inventory.slots !== null) this.fill(inventory.items)
        if (inventory.selection !== null) this.giveSelect(inventory.selection)
    }
    update()
    {
        if (inventory) this.updateInventory(inventory)
        let newstate = this.updateState()
        if (newstate) //something is happening!
        {
            // do something fancy
        }
        //let newselect = this.selected
        for (let slot of this.slots)
        {
            let action = slot.update(this)
            if (action) this.actions.push(action)
        }
        let ongoingtouch = this.getCurrentTouch()
        if (!ongoingtouch && this.actions.length) return this.getActions() // action finished
        return null
    }
}

class Slot
{
    constructor(id, pos, size, item)
    {
        this.pos = pos
        this.size = size
        this.id = id
        this.item = item || {count: 0, type: NONE}
        this.touch = null
        this.selected = false
        this.doubleclicked = false
        this.touchtime = null
    }
    getData()
    {
        return {id: this.id, item: this.item}
    }
    empty()
    {
        this.item.count = 0
        this.item.type = NONE
    }
    update(inventory)
    {
        let newtouch = this.newTouch(inventory)
        //console.log(inventory.activetouch)
        let ongoingtouch = inventory.getCurrentTouch()

        // if ongoing touch do something special
        
        if (newtouch !== null) 
        {
            this.touch = newtouch
            input.addTouch(newtouch)
            return {type: 'inventory', selection: this.id}
        }
        return null
    }
    draw()
    {
        push()
        if (this.selected)
            fill(0, 100, 150, 100)
        else
            noFill()
        stroke(0)
        strokeWeight(2)
        //if (this.doubleclicked) fill(0, 0, 255, 100)
        rect(this.pos.x, this.pos.y, this.size, this.size, 10)
        if (this.item.type !== NONE) {
            let pos = p5.Vector.add(this.pos, createVector(this.size / 2, this.size / 2))
            drawItem(this.item.type, pos, this.size * 0.5)
            //text(this.item.type, pos.x, pos.y)
            pos.add(createVector(this.size / 3, this.size / 3))
            noStroke() //strokeWeight(1)
            fill(255)
            stroke(255)
            text(this.item.count, pos.x, pos.y)
        }
        pop()
    }
    set(item)
    {
        this.item.type = item.type
        this.item.count = item.count
    }
    pressed()
    {
        if (!this.touch) return false
        let touch = getTouch(this.touch)
        if (!touch) return false
        return this.touched(touch)
    }
    touched(touch)
    {
        return onField(
            {x: touch.x, y: touch.y}, 
            {x1: this.pos.x, y1: this.pos.y, x2: this.pos.x + this.size, y2: this.pos.y + this.size})
    }  
    newTouch()
    {
        for (let touch of touches)
        {
            if (input.isFree(touch) && this.touched(touch)) return touch
        }
        return null
    }
}

/*
class LeaderBoard
{
    constructor()
    {
        this.area = {x1:10, y1: 10, x2: 200, y2: 200}
        this.width = this.area.x2 - this.area.x1
        this.height = this.area.y2 - this.area.y1
        this.top5 = []
        this.you = {name: 'you', score: 0}
        this.intop5 = false
    }
    updateLeaderBoard(leaderboard)
    {
        this.intop5 = false
        for (let entry of leaderboard.top5)
        {
            entry.bold = false
            if (leaderboard.you.name == entry.name && leaderboard.you.score == entry.score)
            {
                entry.bold = true
                this.intop5 = true
            }
        }
        this.top5 = leaderboard.top5
        this.you = leaderboard.you
    }
    draw()
    {
        push()
        textAlign(LEFT, TOP)
        const s = 18
        let ypos = this.area.y1
        const spacing = s + 4
        textSize(s)
        fill(255)
        stroke(255)
        text('Leaderboard', this.area.x1, ypos)
        ypos += spacing
        for (let entry of this.top5)
        {
            if (entry.bold) strokeWeight(2)
            else (strokeWeight(0))
            text(entry.name + ' ' + entry.score, this.area.x1, ypos)
            ypos += spacing
        }
        if (!this.intop5) 
            text(this.you.name + ' ' + this.you.score, this.area.x1, ypos)
        pop()
    }
}

*/

class Settings
{ // draw on the top left corner
// includes sound settings,mu
    constructor()
    {

    }
}

class Stats
{ // draw on the top right corner
    constructor()
    {
        this.area = {x1:width - 130, y1: 15, x2: width - 20, y2: 40}
        this.width = this.area.x2 - this.area.x1
        this.height = this.area.y2 - this.area.y1
        this.maxXP = 100
        this.xp = 0
        this.level = 1

        this.open = false
        this.points = 0
        this.strength = 1
        this.vitality = 1
        this.speed = 1
    }
    updateData(status)
    {
        this.xp = status.xp
        this.maxXP = status.xpnext
        if (status.level > this.level) player.levelUP()
        this.level = status.level
        this.points = status.points

        this.strength = status.strength
        this.vitality = status.vitality
        this.speed = status.speed

        this.strengthButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 20}, '1P')
        this.vitalityButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 50}, '1P')
        this.speedButton = new SimpleButton({x: this.area.x2 - 10, y: this.area.y2 + 80}, '1P')
    }
    draw()
    {
        let w = map(this.xp, 0, this.maxXP, 0, this.width)
        if (!this.open && this.points > 0) 
        {
            push()
            textAlign(RIGHT)
            stroke(0)
            fill(255)
            text('points available!', this.area.x1 - 20, (this.area.y2 + this.area.y1) * 0.5)
            noFill()
            stroke(0, 100, 255)
            strokeWeight(3)
            rect(this.area.x1 - 5, this.area.y1 - 5, this.width + 10, this.height + 10, 8)
            pop()
        }
        // XP BAR
        push()
        stroke(0)
        strokeWeight(1)
        noFill()
        rect(this.area.x1, this.area.y1, this.width, 12, 5)
        noStroke()
        fill(0, 255, 255, 100)
        rect(this.area.x1, this.area.y1, w, 12, 5)

        // TEXT
        fill(255)
        stroke(0)
        strokeWeight(1)
        textAlign(LEFT)
        text('LVL ' + this.level, this.area.x1, this.area.y2)
        textAlign(RIGHT)
        text(this.xp + '/' + this.maxXP, this.area.x2, this.area.y2)

        if (this.open) this.drawAttributes()
        pop()
    }
    drawAttributes()
    {
        textSize(16)
        textAlign(RIGHT, CENTER)
        if (this.points)
        {
            this.strengthButton.draw()
            this.vitalityButton.draw()
            this.speedButton.draw()
        }
        const offset = 30
        text('strength: ' + this.strength, this.strengthButton.pos.x - offset, this.strengthButton.pos.y)
        text('vitality: ' + this.vitality, this.vitalityButton.pos.x - offset, this.vitalityButton.pos.y)
        text('agility: ' + this.speed, this.speedButton.pos.x - offset, this.speedButton.pos.y)
    }
    toggleAttributes()
    {
        let allocations = []
        if (this.strengthButton.update()) allocations.push({type: 'allocation', attribute: 'strength'})
        if (this.speedButton.update()) allocations.push({type: 'allocation', attribute: 'speed'})
        if (this.vitalityButton.update()) allocations.push({type: 'allocation', attribute: 'vitality'})
        if (!allocations.length) return null
        return allocations
    }
    update()
    {
        for (let t of touches)
        {
            if (onField(t, this.area) && !inList(t.id, input.usedTouches))
            {
                input.addTouch(t)
                // switch to open
                this.open = !this.open
                return null
            }
        }
        if (this.open) return this.toggleAttributes()
        return null
    }
}

class SimpleButton
{
    constructor(pos, char)
    {
        this.pos = pos
        this.area = {x1: this.pos.x - 20, y1: this.pos.y - 12, x2: this.pos.x + 20, y2: this.pos.y + 12}
        this.char = char
    }
    draw()
    {
        push()
        rectMode(CORNERS)
        fill(0, 255, 0)
        noStroke()
        rect(this.area.x1, this.area.y1, this.area.x2, this.area.y2, 5)
        stroke(255)
        strokeWeight(2)
        textSize(18)
        fill(255)
        textAlign(CENTER, CENTER)
        text(this.char, this.pos.x, this.pos.y)
        pop()
    }
    update()
    {
        for (let t of touches)
        {
            if (onField(t, this.area) && !inList(t.id, input.usedTouches))
            {
                input.addTouch(t)
                // switch to open
                return true
            }
        }
        return false
    }
}

class UtitlityStick
{
    constructor(data)
    {
        this.max = 128
        this.active = false
        this.dia = data.dia || 150
        this.area = data.area || {x1: 2 * (width / 3), y1: height / 3, x2: width, y2: height - 80}
        this.center = createVector(0, 0)
        this.joy = createVector(0, 0)
        this.bg = color(0, 255, 0, 100)
        this.touch = null
        this.hintcompleted = false
    }
    draw() 
    {
        if (!this.hintcompleted || type === 'controller') this.drawHint()
        if (!this.active) return

        push()
        noStroke()
        fill(100, 100, 100, 100)
        circle(this.center.x, this.center.y, this.dia)
        fill(255, 100)
        circle(this.center.x, this.center.y, this.dia * 0.25)
        strokeWeight(5)
        stroke(255, 100)
        line(this.center.x, this.center.y, this.joy.x, this.joy.y)
        noStroke()
        fill(200, 200, 200, 150)
        circle(this.joy.x, this.joy.y, this.dia * 0.33)
        pop()
    }
    drawHint()
    {
        push()
        stroke(this.bg)
        fill(this.bg)
        strokeWeight(5)
        rectMode(CORNERS)
        rect(this.area.x1, this.area.y1, this.area.x2, this.area.y2, 20)
        fill(255, 150)
        textSize(20)
        textAlign(CENTER, CENTER)
        strokeWeight(2)
        text("move hand", (this.area.x1 + this.area.x2) * 0.5, (this.area.y1 + this.area.y2) * 0.5)
        pop()
        if (this.active) this.hintcompleted = true
    }
    update()
    {
        for (let t of touches)
        {
            // new touch
            if (!this.active && onField(t, this.area) && !inList(t.id, input.usedTouches)) 
            {
                this.place(t)
                input.addTouch(t)
                return createVector(0, 0)
            }
            //existing touch
            if (this.active && t.id === this.touch) return this.updateJoy(t)
        }
        return this.cancelJoy() //no updates
    }
    cancelJoy()
    {
        this.touch = null
        this.active = false
        return createVector(0, 0)
    }
    updateJoy(t)
    {
        this.joy = createVector(t.x, t.y) //register pos
        let diff = p5.Vector.sub(this.joy, this.center).limit(this.dia / 2) // get output and limit
        this.joy = p5.Vector.add(this.center, diff) //apply limit
        return diff.mult(2 * this.max / this.dia) //scale
    }
    place(t)
    {
        //print(t)
        this.center = createVector(t.x, t.y)
        this.active = true
        this.touch = t.id
    }
}

class JoyStick 
{
    constructor(data)
    {
        this.max = 128
        this.active = false
        this.dia = data.dia || 150
        this.area = data.area || {x1:0, y1: height / 2, x2: width / 4, y2: height}
        this.center = createVector(0, 0)
        this.joy = createVector(0, 0)
        this.touch = null
        this.hintcompleted = false
    }
    draw() 
    {
        if (!this.hintcompleted || type === 'controller') this.drawHint()
        if (!this.active) return

        push()
        noStroke()
        fill(100, 100, 100, 100)
        circle(this.center.x, this.center.y, this.dia)
        fill(200, 200, 200, 150)
        circle(this.joy.x, this.joy.y, this.dia / 3)
        pop()
    }
    drawHint()
    {
        push()
        stroke(100, 100, 100, 100)
        fill(100, 100, 100, 100)
        strokeWeight(5)
        rectMode(CORNERS)
        rect(this.area.x1, this.area.y1, this.area.x2, this.area.y2, 20)
        fill(255, 150)
        textSize(20)
        textAlign(CENTER, CENTER)
        strokeWeight(2)
        text("move", (this.area.x1 + this.area.x2) * 0.5, (this.area.y1 + this.area.y2) * 0.5)
        pop()
        if (this.active) this.hintcompleted = true
    }
    update()
    {
        for (let t of touches)
        {
            // new touch
            if (!this.active && onField(t, this.area) && !inList(t.id, input.usedTouches)) 
            {
                this.place(t)
                input.addTouch(t)
                return createVector(0, 0)
            }
            //existing touch
            if (this.active && t.id === this.touch) return this.updateJoy(t)
        }
        return this.cancelJoy() //no updates
    }
    cancelJoy()
    {
        this.touch = null
        this.active = false
        return createVector(0, 0)
    }
    updateJoy(t)
    {
        this.joy = createVector(t.x, t.y) //register pos
        let diff = p5.Vector.sub(this.joy, this.center).limit(this.dia / 2) // get output and limit
        this.joy = p5.Vector.add(this.center, diff) //apply limit
        return diff.mult(2 * this.max / this.dia) //scale
    }
    place(t)
    {
        //print(t)
        this.center = createVector(t.x, t.y)
        this.active = true
        this.touch = t.id
    }
}