const createItem = require('./item.js')

module.exports = class Inventory {
    constructor(slotcount)
    {
        this.slots = this.initSlots(slotcount)
        this.updated = true
    }
    initSlots(count)
    {
        let slots = []
        for (let i = 0; i < count; i++)
        {
            slots.push(new Slot(i))
        }
        return slots
    }
    updates()
    {
        if (this.updated)
        {
            //console.log('inventory updated, selection:', this.getSelectedSlot())
            let inventory = {}
            inventory.items = []
            for (let slot of this.slots)
            {
                inventory.items.push(slot.item)
            }
            inventory.selection = this.getSelectedSlot().id
            
            this.updated = false
            return inventory
        }
        return null
    }
    getSelectedType()
    {
        // returns the item
        return this.getSelectedSlot().item.type
    }
    getSlotByID(id)
    {
        for (let slot of this.slots)
        {
            if (slot.id === id) return slot
        }
    }
    getSelectedSlot() // returns id
    {
        for (let slot of this.slots)
        {
            if (slot.selected) return slot
        }
        return this.slots[0]
    }
    isUpdated(item)
    {
        return (this.getSelectedSlot().item.type !== item.type)
    }
    getAll()
    {
        let out = []
        for (let slot of this.slots)
        {
            if (slot.item.type !== NONE) 
            {
                out.push(slot.getContent())
                slot.empty()
            }
        }
        return out
    }
    swap(swapping)
    {
        if (swapping.a === NONE)
        {
            let b = this.getSlotByID(swapping.b)
            if (b.item.type === NONE) return false
            let b_data = b.getContent()
            b.empty()
            return b_data
        }
        let a = this.getSlotByID(swapping.a)
        let a_data = a.getContent()
        let b = this.getSlotByID(swapping.b)
        let b_data = b.getContent()
        a.setContent(b_data)
        b.setContent(a_data)
        this.select(swapping.a)
        return false
    }
    select(id)
    {
        //console.log('selecting:', id)
        this.slots.forEach(slot => slot.selected = false)
        this.slots[id].selected = true
        //console.log(this.slots)
    }
    canRemove(item)
    {
        for (let slot of this.slots)
        {
            if (slot.item.type === item.type)
            {
                return (slot.item.count - item.count >= 0)
            }
        }
        return false
    }
    remove(item)
    {
        for (let slot of this.slots)
        {
            if (slot.item.type === item.type)
                {
                    slot.item.count -= item.count
                    if (slot.item.count <= 0 && !slot.item.persistent) 
                        slot.empty()
                    this.updated = true
                    break
                }
        }
    }
    getAmmo()
    {
        let slot = this.getSelectedSlot()
        return {t: slot.item.type, c: slot.item.count}
    }
    addAmmo(count)
    {
        for (let slot of this.slots)
        {
            if (slot.item.ammo) 
                slot.item.count += count
        }
        return true
    }
    add(item)
    {
        if (item.type === AMMO)
            return this.addAmmo(item.count)
        
        // check if the item is present first
        for (let slot of this.slots)
        {
            if (slot.item.type === item.type) 
            {
                slot.item.count += item.count
                return true
            }
        }
        // check for empty slots
        for (let slot of this.slots) {
            if (slot.item.count === 0 && slot.item.type === NONE)
            {
                slot.item.type = item.type
                slot.item.count += item.count
                slot.item.persistent = item.persistent
                slot.item.ammo = item.ammo
                return true
            }
        }
        // inventory full
        return false
    }
}

class Slot
{
    constructor(id)
    {
        this.id = id
        this.empty()
        this.selected = false
    }
    empty()
    {
        //console.log('emptying slot')
        this.item = {type: NONE, count: 0, persistent: true, ammo: false}
    }
    setContent(content)
    {
        this.item = content.item
        this.selected = content.selected
    }
    getContent()
    {
        return {item: this.item, 
            selected: this.selected}
    }
}