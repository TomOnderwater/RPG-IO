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
            fill(100, 100, 200, 200)
        else
            fill(100, 150)
        stroke(0)
        strokeWeight(2)
        //if (this.doubleclicked) fill(0, 0, 255, 100)
        rect(this.pos.x, this.pos.y, this.size, this.size, 10)
        if (this.item.type !== NONE) {
            let pos = p5.Vector.add(this.pos, createVector(this.size / 2, this.size / 2))
            drawItem(this.item.type, pos, this.size * 0.5)
            //text(this.item.type, pos.x, pos.y)
            pos.add(createVector(this.size / 3, this.size / 3))
            //noStroke() //strokeWeight(1)
            fill(255)
            stroke(255)
            strokeWeight(0.3)
            textAlign(CENTER, CENTER)
            if (this.item.count > 0)
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


class Settings
{ // draw on the top left corner
// includes sound settings,mu
    constructor()
    {

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