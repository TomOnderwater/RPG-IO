// //this should be linked to a database
// const bcrypt = require('bcrypt');
// const saltRounds = 10

// bcrypt.hash(yourPassword, saltRounds, (err, hash) => {
//     // Now we can store the password hash in db.
//     console.log(hash)
//     let pass = ''
//     bcrypt.compare(pass, hash, function(err, res) {
//         if (res == true) console.log('password matched')
//         else console.log('wrong password')
//       })
//   })

module.exports = class AccountManager {
    constructor() {
        //some database linked here

        this.accounts = []
    }
    addAccount() 
    {
        let account = 
        {
            name: 'guest',
            key: "", 
            session: this.createSessionID()
        }
        console.log("new account: ", account)
        this.accounts.push(account)
        return account
    }
    updateKey(session, key)
    {
        let account = this.accounts.find(user => user.session === session)
        if (account) account.key = key
    }
    updateName(session, name)
    {
        let account = this.accounts.find(user => user.session === session)
        //console.log(' testing: ,', account, name)
        if (account) account.name = name
    }
    getAccount(session) {
        let found =  this.accounts.find(user => user.session === session)
        if (found) return found
        else return this.addAccount()
    }
    getAccounts() {
        return this.accounts
    }
    createSessionID()
    {
        return  '_' + Math.random().toString(36).substr(2, 9)
    }
}