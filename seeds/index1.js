const mongoose=require('mongoose');
const registerDetails=require('./registerDetails');
const registrations=require('../models/registrations');

mongoose.connect('mongodb://localhost:27017/road-violation')

const db=mongoose.connection;

db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
    console.log("Database conected");
})


const registrationDB=async()=>{
    await registrations.deleteMany({});
    for(let i=0;i<registerDetails.length;i++){
        const reg=new registrations({
            veh_num:registerDetails[i]['veh_num'],
            name:registerDetails[i]['name'],
            email:registerDetails[i]['email'],
            address:registerDetails[i]['address']
        })
        await reg.save();
    }
}

registrationDB().then(()=>{
    mongoose.connection.close()
})

