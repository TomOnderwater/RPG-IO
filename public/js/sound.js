class Sound {
    constructor()
    {
        soundFormats('mp3', 'ogg', 'wav')
        this.swordswoosh = loadSound('assets/sound_effects/swoosh1.mp3')
        this.swordswoosh.onended(() => this.swooshplaying = false)
        this.swooshplaying = false

        this.bowsound = loadSound('assets/sound_effects/bow_shoot.mp3')
        this.bowsound.onended(() => this.bowshooting = false)
        this.bowshooting = false

        this.fistswoosh = loadSound('assets/sound_effects/slash1.mp3')

        //this.daggerswoosh = loadSound('assets/sound_effects/daggerwoosh.wav')
        //this.footongrass = loadSound('assets/sound_effects/footgrass1.mp3')
    }
    woosh(speed)
    {
        if (!this.swooshplaying)
        {
            this.swooshplaying = true
            this.swordswoosh.play(0, speed)
        }
    }
    bowshot(speed)
    {
        if (!this.bowshooting)
        {
            this.bowshooting = true
            this.bowsound.play(0, speed)
        }
    }
}