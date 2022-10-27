const Func = require('./functions.js')

module.exports = function calcAttack(attack)
{
    if (!attack.power) attack.power = 1
    if (attack.damage !== undefined) 
    {
        attack.collision.entity.applyDamage(attack.damage)
            return {
                type: 'damage', 
                dir: attack.collision.speed, 
                pos: attack.collision.pos, 
                damage: attack.damage,
                owner: attack.attacker,
                target: {color: {r:255, g: 0, b: 0}, id: attack.collision.entity.id}
            }
    }
    if (attack.collision)
    {
        let speed = Func.magnitude(attack.collision.speed)
        //console.log('speed:', speed)
        // calc the damage based on the type of collision: destruction / attack
        if (attack.collision.entity.structure)
        {
            // wood, rock or something else
            let damage = Math.round(attack.item.destruction * speed * attack.power)
            attack.collision.entity.applyDamage(damage)
            return {
                type: 'damage', 
                dir: attack.collision.speed, 
                pos: attack.collision.pos, 
                damage,
                target: {color: {r:100, g: 100, b: 100}},
                owner: attack.attacker
            } // add a color to targets
        }
        else 
        {
            // living bodies
            let damage = Math.round(attack.item.attack * speed * attack.power)
            //console.log('damage', damage)
            attack.collision.entity.applyDamage(damage, attack.attacker)
            return {
                type: 'damage', 
                dir: attack.collision.speed, 
                pos: attack.collision.pos, 
                damage,
                target: {color: {r:255, g: 0, b: 0}, id: attack.collision.entity.id},
                owner: attack.attacker
            }
        }
    }
}