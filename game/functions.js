const TWOPI = Math.PI * 2

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

function divide(a, factor) {
    return {
        x: a.x / factor,
        y: a.y / factor
    }
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

  function rotatingBounce(v1, v2, b)
  {
      return {mag: bounce(v1.mag, v2.mag, b), rot: convergeAngle(v1.rot, v2.rot, b)}
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

module.exports = {
    getTarget, convergeAngle, dist, getAngleTo, onField, getAngle,
    add, subtract, multiply, divide, sqDist,
    TWOPI, sqMag, magnitude, bounce, rotatingBounce,
    squareBounce, isAbout, fixNumber, inRange
}