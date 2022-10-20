
class MobileInput {
    constructor()
    {
        //this.inventory = new Inventory(inventorySpecs)
        this.inventory = (inventoryType === 'boxes') ?
            new Inventory() : new WeaponWheel()
        //this.weaponWheel = new WeaponWheel({})
        // check the minimum height of the joysticks
        this.joystick = new JoyStick({
            dia: 128,
            area: {x1:  0, y1: 0, x2: width / 2, y2: height
        }})
        this.handStick = new UtitlityStick({
            dia: 150,
            area: {x1: width / 2, y1: 0, x2: width, y2: height
        }})

        this.settings = new Settings()

        this.usedTouches = []
    }
    handleClick(pos)
    {
        this.settings.click(pos)
    }
    update()
    {
        this.updateTouches()

        //do the inventory first
        let actions = []
        let inventoryactions = this.inventory.update()
        if (inventoryactions !== null) 
            actions = [...inventoryactions]

        //this.weaponWheel.update()
        // get joysticks
        let dir = this.joystick.update()
        let hand = this.handStick.update()

        let moveactions = this.joystick.getActions()
        if (moveactions)
            actions = [...actions, ...moveactions]
        //print(actions)
        //print(joyout)
        return {
            dir, hand, 
            actions}
    }
    closeInventory()
    {
        this.inventory.close()
    }
    draw()
    {
        this.joystick.draw()
        this.handStick.draw()
        this.inventory.draw()
        this.settings.draw()
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


class WeaponWheel
{
    constructor()
    {
        this.open = false
        this.center = createVector(width * 0.5, height * 0.4)
        //console.log('inventory center:', this.center)
        this.dia = 75
        this.focus = createVector(width * 0.5, height * 0.5)
        this.touchid = -1
        this.weight = 50
        this.startAngle = -PI / 2
        this.margin = 0.01
        this.selection = {id: -1}
        this.updateInventory()
        this.hintcompleted = false
        this.swapping = false
    }
    close()
    {
        this.open = false
        return null
    }
    updateInventory()
    {
        //console.log('updating inventory:', inventory)
        this.sections = []
        let count = 6
        if (inventory !== undefined) 
            count = inventory.items.length

        let div = (2 * PI) / count
        let startAngle = -((PI / 2) + (PI / (count)))
        let a = startAngle
        for (let i = 0; i < count; i++)
        {
            let a1 = a + this.margin
            let a2 = (a + div) - this.margin
            let section = new Section(i, a1, a2, this)
            if (inventory !== undefined) section.fill(inventory.items[i])
            this.sections.push(section)
            a += div
        }
        if (inventory !== undefined)
            this.selection = {id: inventory.selection}
        this.select(this.selection)
    }
    drawHint()
    {
        push()
        fill(255, 0, 0, 50)
        //strokeWeight(5)
        circle(this.center.x, this.center.y, this.dia * 2)
        fill(255, 150)
        textSize(20)
        textAlign(CENTER, CENTER)
        strokeWeight(2)
        text("inventory", this.center.x, this.center.y)
        pop()
        if (this.open) this.hintcompleted = true
    }
    draw() 
    {
        if (!this.hintcompleted) this.drawHint()
        if (this.open)
            this.sections.forEach(section => section.draw())
    }
    select(selection)
    {
        //console.log('selecting:', selection)
        for (let section of this.sections)
        {
            section.deselect()
            if (section.id === selection.id)
                section.select(selection)
        }
        this.selection = selection
        return [{type: 'inventory', selection: selection.id}]
    }
    update()
    {
        let touchended = true
        for (let t of touches)
        {
            // check if it is opened and if we're pressing an entry
            let used = inList(t.id, input.usedTouches)
            if (this.open && used && this.touchid === t.id && this.swapping)
            {
                this.dragpos = createVector(t.x, t.y)
                touchended = false
            }
            if (this.open && onCircle(t, this.focus, this.dia * 1.25))
            {
                if (!used)
                {
                    let selection = this.selectSection(t)
                    input.addTouch(t)
                    if (onCircle(t, this.focus, this.dia * 0.5))
                        return this.close()
                    if (selection !== false)
                    {
                        this.swapping = selection
                        this.dragpos = createVector(t.x, t.y)
                        this.touchid = t.id
                        touchended = false
                    }
                    if (selection !== false && this.selection.id !== selection.id)
                        return this.select(selection)
                }
            }
            // on center and not opened
            if (!this.open && onCircle(t, this.center, this.dia) && !inList(t.id, input.usedTouches))
            {
                touchended = false
                this.openInventory(t)
            } 
            // existing touch
            if (this.open && t.id === this.touchid && !this.swapping)
            {
                this.pTouch = createVector(t.x, t.y)
                let selection = this.selectSection(t)
                if (selection !== false && selection.id !== this.selection.id)
                    return this.select(selection) 
            }
        }

        if (touchended && this.swapping)
        {
            let other = this.selectSection(this.dragpos)
            if (other)
            { // if other = false, drop the item on the floor FUTURE UPDATE
                if (other.id !== this.swapping.id)
                {
                    let swapping = {a: other.id, b: this.swapping.id}
                    this.swapping = false
                    this.touchid = -1
                    return [{type: 'inventory', swapping}]
                }
            } 
        }
        touchended = !inList(this.touchid, input.usedTouches)
        if (touchended && this.pTouch !== undefined)
        { // DETECT DRAG TO SWITCH
            if (!onCircle(this.pTouch, this.focus, this.dia * 0.15))
                this.open = false
            this.touchid = -1
        }
        return null
    }
    selectSection(t)
    {
        // if still on the circle
        //console.log(this.focus, t, this.dia * 0.15)
        if (onCircle(this.focus, t, this.dia * 0.15)) 
            return false
        // select the section
        let angle = posAngle(atan2(t.y - this.focus.y, t.x - this.focus.x))
        for (let section of this.sections)
        {
            let selected = section.update(angle)
            if (selected) return selected
        }
        return false
    }
    openInventory(t)
    {
        //console.log('opening inventory')
        this.focus = createVector(t.x, t.y)
        this.touchid = t.id
        this.open = true
        this.swapping = false
        input.addTouch(t)
        return false
    }
}

class Section
{
    constructor(id, a1, a2, weaponWheel)
    {
        this.id = id
        this.a1 = a1
        this.a2 = a2
        this.fieldangle = a2 - a1
        this.selected = false
        this.weaponWheel = weaponWheel
        this.width = weaponWheel.dia * 0.5
        this.item = {count: 0, type: NONE}
    }
    deselect()
    {
        this.selected = false
    }
    select(section)
    {
        this.selected = true
        navigator.vibrate(5)
        //console.log(this.id, 'is selected', this.selected)
    }
    update(angle)
    {
        //let angle = posAngle(atan2(t.y - this.weaponWheel.focus.y, t.x - this.weaponWheel.focus.y))
        let rot1 = posAngle(this.a1)
        let rot2 = posAngle(this.a2)
        if (angle < this.fieldangle) rot1 = rot2 - this.fieldangle
        else if (angle > Math.PI * 2 - this.fieldangle) rot2 = rot1 + this.fieldangle

        if (angle > rot1 && angle < rot2) 
            return {id: this.id}
        return false
    }
    fill(item)
    {
        this.item = item
        // FUTURE: further subdivide the item
    }
    draw()
    {
        let focus = this.weaponWheel.focus
        let dia = this.weaponWheel.dia
        push()
        noFill()
        stroke(150, 150)
        if (this.item.type === NONE) stroke(150, 50)
        if (this.selected) stroke(255, 150)
        strokeWeight(this.width)
        strokeCap(SQUARE)
        // section ARC
        arc(focus.x, focus.y, dia * 2, dia * 2, this.a1, this.a2)
        // DRAW ITEM ICON
        let a = (this.a1 + this.a2) * 0.5
        let itempos = {x: focus.x + cos(a) * dia, y: focus.y + sin(a) * dia}
        let itemspacing = 1.45
        let textpos = {x: focus.x + cos(a) * dia * itemspacing, y: focus.y + sin(a) * dia * itemspacing}
        if (this.item.type !== NONE)
        {
            fill(255)
            if (this.item.type === STAFF) drawItem(this.item.type, itempos, 45, PI * 0.15)
            else drawItem(this.item.type, itempos, 20)
            if (this.item.count > 0)
            {
                push()
                textSize(20)
                fill(255)
                noStroke()
                textAlign(CENTER, CENTER)
                text(this.item.count, textpos.x, textpos.y)
                pop()
            }
        }
        pop()
    }
}


class Inventory
{
    constructor()
    {
        this.items = []
        this.rowcount = 6
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
        this.updateInventory()
        this.giveSelect(0)

        // OUTPUT
        this.actions = []
        this.activetouch = null
        this.swapping = false
    }
    fill(items)
    {
        //console.log(items)
        let changed = false
        for (let i in items)
        {
            if (!this.slots[i].equals(items[i])) changed = true
            this.slots[i].set(items[i])
        }
        if (changed) rumble(5)
    }
    initslots()
    {
        let slots = []
        let slotsize = (this.x_end - this.x_start) / this.rowcount
        this.height = slotsize
        let y_start = height - slotsize
        for (let i = 0; i < this.rowcount; i++)
        {
            let y = y_start
            let x = this.x_start + i * slotsize
            let pos = createVector(x, y)
            slots.push(new Slot(i, pos, slotsize))
        }
        return slots
    }
    draw()
    {
        this.slots.forEach(slot => slot.draw())
    }
    setActive(slot, touch)
    {
        this.active = slot
        this.activetouch = touch
    }
    addTouch(touch)
    {
        this.swapping = false
        this.activetouch = touch.id
        let selected = this.getSelectedSlot(touch)
        if (selected !== false) 
        {
            this.selected = selected
            this.swapping = this.selected
        }
        //this.swapping = this.selected
    }
    giveSelect(id)
    {
        this.slots.forEach(slot => slot.selected = false) // deselect all
        this.slots[id].selected = true
        this.selected = id
        this.swapping = id
    }
    getSelectedSlot(touch)
    {
        for (let slot of this.slots)
        {
            if (slot.touched(touch)) return slot.id
        }
        if (touch.y < height - (this.height * 1.5)) return NONE
        return false
    }
    getSwap()
    {
        let output = []
        if (this.swapping !== false)
        {
            if (this.swapping !== this.selected)
            {
                //console.log('swapping!')
                let swapping = {a: this.swapping, b: this.selected}
                output.push({type: 'inventory', swapping})
            }
            this.swapping = false
        }
        this.actions = []
        return output
    }

    getActions()
    {
        let output = []
        this.actions.forEach(action => output.push(action))
        this.actions = []
        //console.log(output)
        if (!output.length) return null
        return output
    }
    updateInventory()
    {
        if (inventory === undefined) return
        if (inventory.items !== undefined) this.fill(inventory.items)
        if (inventory.selection !== undefined) this.giveSelect(inventory.selection)
    }
    update()
    {
        //if (inventory) this.updateInventory(inventory)
        
        for (let slot of this.slots)
        {
            let action = slot.update(this)
            if (action) this.actions.push(action)
        }
        for (let t of touches)
        {
            if (t.id === this.activetouch)
                this.swapping = this.getSelectedSlot(t)
        }

        let ongoingtouch = inList(this.activetouch, input.usedTouches)
        //console.log(ongoingtouch)
        if (!ongoingtouch)
            this.activetouch = false

        if (!ongoingtouch && this.swapping !== this.selected) return this.getSwap()
        if (this.actions.length) return this.getActions() // action finished
        return null
    }
    close()
    {

    }
}

class Slot
{
    constructor(id, pos, size, item)
    {
        this.pos = pos
        this.size = size
        this.id = id
        //console.log(this.id)
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

        // if ongoing touch do something special

        if (newtouch !== null) 
        {
            this.touch = newtouch
            input.addTouch(newtouch)
            inventory.addTouch(newtouch)
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
        //console.log(this)
        rect(this.pos.x, this.pos.y, this.size, this.size, 10)
        if (this.item.type !== NONE) {
            let pos = p5.Vector.add(this.pos, createVector(this.size / 2, this.size / 2))
            if (this.item.type === STAFF)
                drawItem(this.item.type, pos, 45, PI * 0.15)
            else 
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
    equals(item)
    {
        return (this.item.type === item.type && this.item.count === item.count)
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
        this.pos = createVector(30, 30)
        this.open = false
        this.sound = true
        this.volume = 50
        this.music = false
        if (this.music) sound.playMusic()
    }
    click(pos)
    {
        let gearpressed = (onCircle(pos, this.pos, 30))
        if (gearpressed)
        {
            this.open = !this.open
            if (this.open) this.showDOM()
            else this.hideDOM()
        }
        //console.log(gearpressed)
    }
    hideDOM()
    {
        this.soundCheckbox.hide()
        this.volumeSlider.hide()
        this.musicCheckbox.hide()
    }
    showDOM()
    {
        // sound checkbox
        this.soundCheckbox = createCheckbox('sound', this.sound)
        this.soundCheckbox.position(this.pos.x, this.pos.y + 30)
        this.soundCheckbox.changed(() => 
        {
            this.sound = this.soundCheckbox.checked()
            if (!this.sound) sound.globalVolume(0)
            else sound.globalVolume(1)
        })

        // volume slider
        this.volumeSlider = createSlider(0, 100, this.volume)
        this.volumeSlider.position(this.pos.x, this.pos.y + 50)
        this.volumeSlider.style('width', '100px')
        this.volumeSlider.changed(() => {
            this.volume = this.volumeSlider.value()
            sound.globalVolume(this.volume * 0.01)
        })

        // sound checkbox
        this.musicCheckbox = createCheckbox('music', this.music)
        this.musicCheckbox.position(this.pos.x, this.pos.y + 70)
        this.musicCheckbox.changed(() => 
        {
            this.music = this.musicCheckbox.checked()
            if (!this.music) sound.stopMusic()
            else sound.playMusic()
        })
    }
    draw()
    {
        push()
        imageMode(CENTER)
        image(gearicon, this.pos.x, this.pos.y, 40, 40)
        pop()
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
        this.joy = createVector(t.x, t.y)
        this.active = true
        input.closeInventory()
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
        this.mag = 0
        this.boostRange = 0.9
        this.boostdir = createVector(0, 0)
        this.boost = 0
        this.bg = color(100, 100)
        this.chargebg = color(255, 0, 0, 150)
        this.maxboost = 10
        this.hintcompleted = false
        this.actions = []
    }
    draw() 
    {
        if (!this.hintcompleted || type === 'controller') this.drawHint()
        if (!this.active) return

        push()
        fill(lerpColor(this.bg, this.chargebg, this.boosting * 0.1))
        noStroke()
        circle(this.center.x, this.center.y, this.dia + (this.boost * 2))
        fill(200, 200, 200, 150)
        circle(this.joy.x, this.joy.y, this.dia / 3)
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
        this.actions = [] // first empty any previous actions
        this.touch = null
        this.active = false
        let boost = this.getBoost()
        if (boost) this.actions.push(boost)
        return createVector(0, 0)
    }
    getActions()
    {
        if (this.actions.length > 0) 
            return this.actions
        return false
    }
    getBoost()
    {
        let out = false
        if (this.boosting)
            out = {type: 'boost', boost: this.boost, dir: this.boostdir}
        this.zeroBoost()
        return out
    }
    buildupBoost()
    {
        if (this.boost < this.maxboost) 
        {
            this.boost ++
            if (this.boost == this.maxboost) rumble(20)
        }
    }
    zeroBoost()
    {
        this.boosting = false
        this.boost = 0
    }
    updateJoy(t)
    {
        this.joy = createVector(t.x, t.y) //register pos
        let diff = p5.Vector.sub(this.joy, this.center)
        // get magnitude of diff
        this.mag = diff.mag()
        diff = diff.limit(this.dia * 0.5)// get output and limit
        this.joy = p5.Vector.add(this.center, diff) //apply limit
        diff = diff.mult(2 * this.max / this.dia) // scale diff

        if (this.mag > this.dia * this.boostRange) 
        {
            if (!this.boosting) rumble(15)
            this.boosting = true
            this.buildupBoost()
            this.boostdir = {x: diff.x, y: diff.y} 
        } else this.zeroBoost()
        return diff
    }
    place(t)
    {
        //print(t)
        this.center = createVector(t.x, t.y)
        this.joy = createVector(t.x, t.y)
        this.active = true
        this.touch = t.id
    }
}

// PC INPUT BELOW THIS LINE /////////////////////////////////////////////

class PCInput {
    constructor()
    {
        this.inventory = new PCInventory(inventorySpecs)
        // check the minimum height of the joysticks
        this.joystick = new GameKeyboard()

        this.handStick = new PCUtilityStick()
    }
    update()
    {
        this.updateTouches()

        //do the inventory first
        let actions = []
        let inventoryactions = this.inventory.update()
        if (inventoryactions !== null) 
            actions = [...inventoryactions]

        // get joysticks
        let dir = this.joystick.update()
        let hand = this.handStick.update()

        //print(actions)
        //print(joyout)
        return {
            dir, hand, 
            actions}
    }
    draw()
    {
        this.handStick.draw()
        this.inventory.draw()
    }
}

class GameKeyboard
{
    constructor()
    {

    }
    update()
    {
        return {x: 100, y: 0}
    }
}

class PCUtilityStick
{
    constructor()
    {

    }
    update()
    {
        return {x: 100, y: 0}
    }
    draw()
    {

    }
}

class PCInventory
{
    constructor(specs)
    {
        
    }
    update()
    {

    }
    draw()
    {

    }
}