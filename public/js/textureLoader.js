
// definitions of base folder
const textureFolder = 'assets/textures/'
const soundFolder = 'assets/sound_effects/'

// define which 
const defaultFolder = textureFolder + 'default/'
const iceFolder = textureFolder + 'ice/'

let defaultTextures =
{
    surfaces: [
        {name: GRASS, url: defaultFolder + 'seamless_grass1.jpg'},
        {name: STONE, url: defaultFolder + 'stonetexture.jpg'},
        {name: GRAVEL, url: defaultFolder + 'graveltexture.jpg'},
        {name: WATER, url: defaultFolder + 'watertexture1.jpg'},
        {name: SAND, url: defaultFolder + 'sandtexture1.jpg'}],
    structures: [
        {name: WALL, url: textureFolder + 'smallwalltexture.png'},
        {name: STONEWALL, url: textureFolder + 'rockwall.jpg'},
        {name: WOODWALL, url: textureFolder + 'woodwalltexture.jpg'},
        {name: ROCK, url: textureFolder + 'rocktexture.png'},
        {name: TREASURECHEST, url: textureFolder + 'treasurechest.png'}
    ],
    items: [
        {name: WOOD, url: textureFolder + 'woodicon.png'},
        {name: ROCK, url: textureFolder + 'stoneicon.png'},
        {name: AMMO, url: textureFolder + 'ammobag.png'},
        {name: STAFF, url: textureFolder + 'staff.png'},
        {name: POTION, url: textureFolder + 'potion.png'},
        {name: FLAIL, url: textureFolder + 'flail.png'}
    ]
}

function initTextures(skin)
{
    switch(skin)
    {
        default:
            return loadTextures(defaultTextures)
    }
}

function loadTextures(textureMapping)
{
    // load the textures in and store them in an image field
    textureMapping.surfaces.forEach(tex => tex.image = loadImage(tex.url))
    textureMapping.structures.forEach(tex => tex.image = loadImage(tex.url))
    textureMapping.items.forEach(tex => tex.image = loadImage(tex.url))
    return textureMapping
}
