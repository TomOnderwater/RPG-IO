function createKey(len) // creates some random key to display on screen
{
    let str = ""
    for (let i = 0; i < len; i++)
    {
        let char = String.fromCharCode(Math.floor((Math.random() * 26)) + 97)
        str += char
    }
    return str
}

//97 - 122
console.log(createKey(5))