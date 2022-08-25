const Noise = require("./noise.js")
const Tile = require('./tile.js')
const Func = require('./functions.js')

module.exports = class LevelGenerator
{
    constructor(level)
    {
        this.noise = new Noise()
        this.noise.seed(Math.random())
        this.tiles = this.generateTiles(level)
        this.drawBorder(level)
        //console.log(this.tiles)
    }
    getTiles()
    {
        return this.tiles
    }
    generateTiles(level)
    {
        let tiles = []
        for (let x = 0; x < level.width; x++)
        {
            let col = []
            for (let y = 0; y < level.height; y++)
            {
                col.push(new Tile(x, y))
            }
            tiles.push(col)
        }
        // map layers
        let watermap = this.generatePerlinNoiseMaps(level, {h: 1, h_delta: 0.2, v: 10, v_delta: 5, iters: 5, bias: 0.5})
        let terrainmap = this.generatePerlinNoiseMaps(level, {h: 1, h_delta: 0.2, v: 3, v_delta: 3, iters: 6, bias: 0.5})
        let structuremap = this.generatePerlinNoiseMaps(level, {h: 1, h_delta: -0.2, v: 5, v_delta: 10, iters: 3, bias: 0.5})
        //console.log(watermap)
        let vegetationbias = level.stone + 0.2
        let stepsize = (1 - vegetationbias) / 6 
        //console.log(vegetationbias, stepsize)
        for (let x = 0; x < level.width; x++)
        {
            for (let y = 0; y < level.height; y++)
            {
                let terrainval = terrainmap[x][y]
                let structval = structuremap[x][y]
                let waterval = watermap[x][y]
                let surface = STONE
                // check surface
                if (terrainval > vegetationbias && terrainval < vegetationbias + stepsize) surface = GRAVEL
                else if (terrainval > vegetationbias + stepsize && terrainval < vegetationbias + stepsize * 2) surface = DIRT
                else surface = GRASS
                if (waterval < level.water) surface = WATER
                else 
                {
                    if (waterval > level.water && waterval < level.water + 0.05) surface = SAND
                    else 
                    { /////// STRUCTURES STRUCTURES STRUCTURES
                        // not sand, and not water. Plant trees and rocks maybe?
                        if (structval < level.structurerate && Math.random() < 0.7) // random check
                        {
                            if (surface == GRASS) tiles[x][y].addStructure({id: TREE, type: 'circle', pos: {x: x + 0.5, y: y + 0.5}, rad: 0.2, static: true})
                        }
                    }
                }
                tiles[x][y].surface = surface
            }
        }
        //console.log(tiles)
        return tiles
    }
    generatePerlinNoiseMaps(level, config)
    {
    let layers = []
        for (let i = 0; i < config.iters; i ++)
        {
            let h = config.h + i * config.h_delta
            let v = config.v + i * config.v_delta
            let bias = config.bias || 0
            layers.push(this.generatePerlinNoiseMap(level, h, v, bias, Math.random()))
        }
    return this.addMaps(layers, level)
    }
    addMaps(maps, specs)
    {
        let rows = []
        for (let x = 0; x < specs.width; x++)
        {
            let col = []
            for (let y = 0; y < specs.height; y++)
            {
                col.push(0)
            }
            rows.push(col)
        }
        let div = 1 / maps.length
        for (let map of maps)
        {
            for (let x = 0; x < specs.width; x++)
            {
                for (let y = 0; y < specs.height; y++)
                {
                    rows[x][y] += map[x][y] * div
                }
            }
        }
        return rows
    }
    generatePerlinNoiseMap(level, h, v, bias, seed)
    {
        this.noise.seed(seed)
        let rows = []
        for (let x = 0; x < level.width; x++)
        {
            let col = []
            for (let y = 0; y < level.height; y++)
            {
                let val = this.noise.perlin2(x / v, y / v) + bias
                val *= h
                col.push(val)
            }
            rows.push(col)
        }
        return rows
    }
    drawBorder(level)
    {
    // loop through edges of the level
    let padding = level.padding || 1

    for (let x = 0; x < level.width; x++)     // bottom, top
        {
            for (let y = 0; y < padding; y++)
            {  //top row
                this.tiles[x][y].addStructure({id: WALL, type: 'rect', pos: {x, y}, width: 1, height: 1, static: true})
            }
            for (let y = level.height - 1; y >= level.height - (1 + padding); y--)
            {  //bottom row
                this.tiles[x][y].addStructure({id: WALL, type: 'rect', pos: {x, y}, width: 1, height: 1, static: true})
            }
        }
        for (let y = 0; y < level.height; y++)     // left, right
        {
            for (let x = 0; x < padding; x++)
            {  //top row
                this.tiles[x][y].addStructure({id: WALL, type: 'rect', pos: {x, y}, width: 1, height: 1, static: true})
            }
            for (let x = level.width - 1; x >= level.width - (1 + padding); x--)
            {  //bottom row
                this.tiles[x][y].addStructure({id: WALL, type: 'rect', pos: {x, y}, width: 1, height: 1, static: true})
            }
        }
    }
}