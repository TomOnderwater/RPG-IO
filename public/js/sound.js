class SoundManager {
    constructor()
    {
        this.volume = 1
        this.fade =  2
        this.activesounds = []
        this.swordwoosh = new Howl({src: [soundfolder + 'swoosh1.mp3']})
        this.bowsound = new Howl({src: [soundfolder + 'bow_shoot.mp3']})
        this.fireballsound = new Howl({src: [soundfolder + 'fireballshot.mp3'], sprite: {firing: [200, 1200]}})
        this.explosionsound = new Howl({src: [soundfolder + 'heavyimpact.mp3']})
        this.fireburningsound = new Howl({src: [soundfolder + 'fireburning.wav'], 
            sprite: {burning: [1000, 6000]},
            looping: true})
    }
    getStereoPos(pos)
    {
        let d = cam.getRelativePos(pos)
        return multiply(d, this.fade)
    }
    globalVolume(volume)
    {
        Howler.volume(volume)
        console.log('setting volume')
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
    woosh(id, speed, pos)
    {
        //console.log('woosh')
        let s = getFromList(id, this.activesounds)
        let p = this.getStereoPos(pos)
        if (!s) 
        {
            this.swordwoosh.pos(p.x, p.y)
            this.swordwoosh.rate(speed)
            let s_id = this.swordwoosh.play()
            this.activesounds.push({id, s_id, touched: true})
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
            this.activesounds.push({id, s_id, touched: true})
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
    fireball(pos)
    {
        let p = this.getStereoPos(pos)
        this.fireballsound.pos(p.x, p.y)
        this.fireballsound.play('firing')
    }
    explosion(pos)
    {
        let p = this.getStereoPos(pos)
        this.explosionsound.pos(p.x, p.y)
        this.explosionsound.play()
    }   
}