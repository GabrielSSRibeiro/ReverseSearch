// Require bcryptjs for password Encryption
const bcrypt = require('bcryptjs');

// Require mongoose and setup the Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {type: String, unique: true},
    email: {type: String, unique: true},
    password: String
})

let Users;

module.exports.initialize = () => {
    return new Promise ((resolve, reject) => {
        let db = mongoose.createConnection(`mongodb+srv://DB_Project:${process.env.MDB_PW}@cluster0.tc1is.mongodb.net/db_reverse?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.set('useCreateIndex', true);
        
        db.on('error', (err) => {
            reject(err)
        })

        db.once('open', () => {
            Users = db.model('user_dbs', userSchema);
            resolve()
        })

    })
}

module.exports.addUser = (data) => {
    return new Promise ((resolve, reject) => {
        
        for (let formEntry in data) {
            if (data[formEntry] == '') data[formEntry] = null;
        }

        let newUser = new Users(data);

        bcrypt.genSalt(10)
        .then(salt=>bcrypt.hash(newUser.password,salt))
        .then(hash=>{
            newUser.password = hash;
            newUser.isAdmin = false;

            newUser.save((err) => {
                if (err) {
                    console.log(`ERROR: ${err}`)
                    reject()
                }
                else {
                    console.log('User stored in database.')
                    resolve()
                }
            })
        })
        .catch(err=>{
            console.log(err); 
            reject("Hashing Error")
        });

    })
}

module.exports.getUsersByEmail = (inEmail) => {
    return new Promise ((resolve, reject) => {
        Users.find({email: inEmail})
        .exec()
        .then((returnedUsers) => {

            if(returnedUsers.length != 0) resolve(returnedUsers.map((user) => user.toObject()))
            else reject('No Users found')

        }).catch((err) => {
            console.log(`Error retrieving Users: ${err}`)
            reject(err)
        })
    })
}


module.exports.validateUser = (data) => {
    return new Promise((resolve, reject) => {
        if (data) {
            this.getUsersByEmail(data.emailLogin).then((foundUser) => {
                
                bcrypt.compare(data.passwordLogin, foundUser[0].password).then((pwMatches) => {
                    if (pwMatches) {
                        // console.log(foundUser[0])
                        resolve(foundUser)

                    } else {
                        reject("Passwords don't match")
                        return

                    }
                    
                });

            }).catch((err) => {
                reject(err)
                return
            })
        }

    })
}