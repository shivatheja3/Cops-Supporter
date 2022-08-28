const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const policeSchema=new Schema({
    name:String,
    email:String,
    isPolice:Number
})

module.exports=mongoose.model('police',policeSchema);
