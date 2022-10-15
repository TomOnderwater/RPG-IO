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
    select(id)
    {
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
            if (slot.ammo) 
                slot.item.count += count
        }
    }
    add(item)
    {
        if (item.type === AMMO)
            return this.addAmmo(item.count)
            
        for (let slot of this.slots)
        {
            if (slot.item.type === item.type) 
            {
                slot.item.count += item.count
                break
            }
            if (slot.item.count === 0 && slot.item.type === NONE)
            {
                slot.item.type = item.type
                slot.item.count += item.count
                slot.item.persistent = item.persistent
                slot.ammo = item.ammo
                break
            }
        }

    }
}

class Slot
{
    constructor(id)
    {
        this.id = id
        this.item = {type: NONE, count: 0}
        this.persistent = true
        this.selected = false
        this.ammo = false
    }
    empty()
    {
        //console.log('emptying slot')
        this.item = {type: NONE, count: 0}
        this.ammo = false
        this.persistent = true
    }
}