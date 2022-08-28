const mongoose=require('mongoose');
const police = require('../models/police');
const policeDetails = require('./policeDetails');

mongoose.connect('mongodb://localhost:27017/road-violation')

const db=mongoose.connection;

db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
    console.log("Database conected");
})


const policeDB=async()=>{
    await police.deleteMany({})
    for(let i=0;i<policeDetails.length;i++){
        const pol=new police({
            name:policeDetails[i]['name'],
            email:policeDetails[i]['email'],
            isPolice:policeDetails[i]['isPolice']
        })
        await pol.save();
    }
}



policeDB().then(()=>{
    mongoose.connection.close()
})