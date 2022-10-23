const Func = require('../util/functions.js')
const createItem = require('../items/item.js')


module.exports = class Hand
{
    constructor(owner, item, pos)
    {
        this.owner = owner
        this.level = owner.level
        this.item = item //Items.createItem(NONE)
        this.input = {x: 0, y: 0}
    }
    update(level, colliders)
    {
        this.level = level
        let inventory = this.owner.inventory

        if (inventory.isUpdated(this.item))
            this.resetItem(inventory.getSelectedType())

        this.item.update(this, colliders)
    }
    resetItem(type)
    {
        this.item = createItem(type)
    }
    updateInput(hand)
    {
        this.input = Func.constrainVector(hand, 128)
    }
    data()
    {
        let data = this.item.data()
        data.i = this.id
        return data
    }
}