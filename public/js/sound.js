class Sound {
    constructor()
    {
        soundFormats('mp3', 'ogg', 'wav')
        this.swordswoosh = loadSound('assets/sound_effects/bloodsplash.wav')
        this.daggerswoosh = loadSound('assets/sound_effects/daggerwoosh.wav')
        this.footongrass = loadSound('assets/sound_effects/footgrass1.mp3')
        console.log('sound: ', this.swoosh)
    }
    swoosh(spd)
    {
        let speed = spd || 1
        console.log('playing sound at', speed, 'speed')
        this.swordswoosh.play(0.1, speed)
    }
    footstep()
    {
        console.log('crunch')
        this.footongrass.play()
    }
}