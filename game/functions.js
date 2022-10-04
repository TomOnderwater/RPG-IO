const TWOPI = Math.PI * 2

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// binary to string lookup table
const b2s = alphabet.split('')

// string to binary lookup table
// 123 == 'z'.charCodeAt(0) + 1
const s2b = new Array(123);
for (let i = 0; i < alphabet.length; i++) {
  s2b[alphabet.charCodeAt(i)] = i
}

// number to base64
const toBase64 = (number) => {
  if (number < 0) return `-${ntob(-number)}`;

  let lo = number >>> 0;
  let hi = (number / 4294967296) >>> 0;

  let right = '';
  while (hi > 0) {
    right = b2s[0x3f & lo] + right;
    lo >>>= 6;
    lo |= (0x3f & hi) << 26;
    hi >>>= 6;
  }

  let left = '';
  do {
    left = b2s[0x3f & lo] + left;
    lo >>>= 6;
  } while (lo > 0);

  return left + right;
}

function fixNumber(n, digits)
{
    return Number(n.toFixed(digits))
}

function subtract(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    }
}

function add(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}

function multiply(a, factor) {
    return {
        x: a.x * factor,
        y: a.y * factor
    }
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min
}

function divide(a, factor) {
    return {
        x: a.x / factor,
        y: a.y / factor
    }
}

function getVector(angle, mag)
{
    return {x: Math.cos(angle) * mag, y: Math.sin(angle) * mag}
}

function onField(p, area)
{
    return (p.x > area.x1 && p.x < area.x2 && p.y > area.y1 && p.y < area.y2)
}

function inRange(pos, target, range)
{
    return (pos.x > target.x - range && pos.x < target.x + range && pos.y > target.y - range && pos.y < target.y + range)
}

function getTarget(pos, angle, len)
{
    return {x: pos.x + Math.cos(angle) * len, y: pos.y + Math.sin(-angle) * len}
}

function getAngleTo(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

function getAngle(v)
{
    return Math.atan2(-v.y, v.x)
}

function getRelativeAngle(a, b) 
{
    return (((a + b) % TWOPI) + TWOPI) % TWOPI
  }

function sqMag(v)
{
    return Math.pow(v.x, 2) + Math.pow(v.y, 2)
}
function magnitude(v)
{
    return (Math.sqrt(sqMag(v)))
}

function bounce(p, t, b)
{
    return p + ((t - p) * b)
}

function convergeAngle(a1, a2, mult) 
{
    let anglebetween = getRelativeAngle(a2, a1)
      let a = a1
      if (anglebetween > Math.PI) {
        let f = TWOPI - anglebetween
        a += f * mult
      } else {
        let f = anglebetween
        a -= (anglebetween) * mult
      }
      return a %= TWOPI
  }

function fixPos(pos, digits)
{
    let n = digits || 2
    return {x: fixNumber(pos.x, n), y: fixNumber(pos.y, n)}
}
  function rotatingBounce(v1, v2, b)
  {
      return {mag: bounce(v1.mag, v2.mag, b), rot: convergeAngle(v1.rot, v2.rot, b)}
  }

  function constrain(val, min, max)
  {
    if (val < min) return min
    if (val > max) return max
    return val
  }

  function squareBounce(v1, v2, b)
  {
      return {x: bounce(v1.x, v2.x, b), y: bounce(v1.y, v2.y, b)}
  }

  function isAbout(a, b, tolerance)
  {
      return (a > b - tolerance && a < b + tolerance)
  }
    function sqDist(a, b)
    {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    }
  function dist(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function constrainVector(vec, max)
{
    if (vec.x < -max) vec.x = -max
    else if (vec.x > max) vec.x = max
    if (vec.y < -max) vec.y = -max
    else if (vec.y > max) vec.y = max
    return vec
}

function zeroVector(vec)
{
    return (vec.x === 0 && vec.y === 0)
}

function calcAttack(attack)
{
    if (!attack.power) attack.power = 1
    if (attack.collision)
    {
        let speed = magnitude(attack.collision.speed)
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
                item: attack.item.type,
                target: {material: attack.collision.entity.material}
            }
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
                item: attack.item.type,
                target: {material: 'flesh', id: attack.collision.entity.id}
            }
        }
    }
    // EXPLOSION ATTACK
}

function circleOnCircle(circle1, circle2)
{
   return (sqDist(circle1.pos, circle2.pos) <= Math.pow(circle1.rad + circle2.rad, 2))
}


module.exports = {
    getTarget, convergeAngle, dist, getAngleTo, onField, getAngle,
    add, subtract, multiply, divide, sqDist,
    TWOPI, sqMag, magnitude, bounce, rotatingBounce,
    squareBounce, isAbout, fixNumber, inRange, getRandom,
    getVector, fixPos, constrainVector, zeroVector, calcAttack, circleOnCircle, 
    constrain, toBase64
}