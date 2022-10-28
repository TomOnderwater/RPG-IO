class SoundManager {
    constructor()
    {
        this.backgroundmusic = new Howl({src: [soundfolder + 'ukulele.mp3'], looping: true, volume: 0.1})
        this.volume = 1
        this.fade =  2
        this.activesounds = []

        this.swordwoosh = new Howl({src: [soundfolder + 'swoosh1.mp3'], sprite: {wooshing: [200, 1000]}})
        this.fistwooshsound = new Howl({src: [soundfolder + 'fistwoosh.mp3']})
        this.lowwooshsound = new Howl({src: [soundfolder + 'low_woosh.mp3']})

        this.bowsound = new Howl({src: [soundfolder + 'bow_shoot.mp3']})
        this.fireballsound = new Howl({src: [soundfolder + 'fireballshot.mp3'], sprite: {firing: [200, 1200]}})
        this.explosionsound = new Howl({src: [soundfolder + 'fire_explosion.wav'], 
        sprite: {exploding: [0, 1200]}})
        this.fireburningsound = new Howl({src: [soundfolder + 'fireburning.wav'], 
            sprite: {burning: [1200, 4200, true]},
            looping: true})
        this.splashimpactsound = new Howl({src: [soundfolder + 'splashimpact.mp3']})
        this.basicimpactsound = new Howl({src: [soundfolder + 'basicimpact.mp3']})
    }
    stop()
    {
        this.fireburningsound.stop()
    }
    musicVolume(volume)
    {
        this.backgroundmusic.volume(volume)
    }
    playMusic()
    {
        if (!this.backgroundmusic.playing())
            this.backgroundmusic.play()
    }
    stopMusic()
    {
        this.backgroundmusic.stop()
    }
    getStereoPos(pos)
    {
        if (!player) return {x: 0, y: 0}
        let d = cam.getRelativePos(pos)
        return multiply(d, this.fade)
    }
    globalVolume(volume)
    {
        Howler.volume(volume)
    }
    removeSound(id)
    {
        for (let i =  this.activesounds.length - 1; i >= 0; i--)
        {
            if (this.activesounds[i].id === id) 
            {
                this.activesounds.splice(i, 1)
                return
            }
        }
    }
    fistwoosh(id, speed, pos)
    {
        //console.log('woosh')
        let s = getFromList(id, this.activesounds)
        let p = this.getStereoPos(pos)
        if (!s) 
        {
            let s_id = this.fistwooshsound.play()
            this.fistwooshsound.pos(p.x, p.y, s_id)
            this.fistwooshsound.rate(speed, s_id)
            this.activesounds.push({id, s_id})
        } else this.fistwooshsound.pos(p.x, p.y, 0, s.s_id)
    }
    lowwoosh(id, speed, pos)
    {
        //console.log('woosh')
        let s = getFromList(id, this.activesounds)
        let p = this.getStereoPos(pos)
        let playsound = false
        if (s)
        {
            if (!this.lowwooshsound.playing())
            {
                this.removeSound(id)
                this.playsound = true
            }
        }
        if (!s || playsound) 
        {
            let s_id = this.lowwooshsound.play()
            this.lowwooshsound.pos(p.x, p.y, s_id)
            this.lowwooshsound.rate(speed * 2, s_id)
            this.activesounds.push({id, s_id})
        } else this.lowwooshsound.pos(p.x, p.y, 0, s.s_id)
    }
    woosh(id, speed, pos)
    {
        //console.log('woosh')
        let s = getFromList(id, this.activesounds)
        let p = this.getStereoPos(pos)
        if (!s) 
        {
            let s_id = this.swordwoosh.play('wooshing')
            this.swordwoosh.pos(p.x, p.y, s_id)
            this.swordwoosh.rate(speed, s_id)
            this.activesounds.push({id, s_id})
        } else this.swordwoosh.pos(p.x, p.y, 0, s.s_id)
    }
    playFire(id, pos)
    {
        let s = getFromList(id, this.activesounds)
        let p = this.getStereoPos(pos)
        if (!s)
        {
            let s_id = this.fireburningsound.play('burning')
            this.fireburningsound.pos(p.x, p.y, 0, s_id)
            this.fireburningsound.volume(0.3)
            this.activesounds.push({id, s_id})
        }
        else 
            this.fireburningsound.pos(p.x, p.y, 0, s.s_id)
    }
    stopFire(id)
    {
        let s = getFromList(id, this.activesounds)
        if (s) this.fireburningsound.stop(s.s_id)
        this.removeSound(id)
    }
    bowshot(pos)
    {
        let p = this.getStereoPos(pos)
        this.bowsound.pos(p.x, p.y)
        this.bowsound.play()
    }  
    splashimpact(pos, damage)
    {
        let p = this.getStereoPos(pos)
        this.splashimpactsound.pos(p.x, p.y)
        let id = this.splashimpactsound.play()
        this.splashimpactsound.volume(constrain(damage * 0.05, 0, 1), id)
    }
    basicimpact(pos, damage)
    {
        let p = this.getStereoPos(pos)
        this.basicimpactsound.pos(p.x, p.y)
        let id = this.basicimpactsound.play()
        this.basicimpactsound.volume(constrain(damage * 0.05, 0, 1), id)
    }
    fireball(pos)
    {
        let p = this.getStereoPos(pos)
        this.fireballsound.pos(p.x, p.y)
        let id = this.fireballsound.play('firing')
        this.fireballsound.volume(0.5, id)
    }
    explosion(pos, size)
    {
        let p = this.getStereoPos(pos)
        this.explosionsound.pos(p.x, p.y)
        let id = this.explosionsound.play('exploding')
        this.explosionsound.fade(1, 0, 500 + (size * 100), id)
        this.explosionsound.volume(0.5 + (size * 0.1))
    }   
}