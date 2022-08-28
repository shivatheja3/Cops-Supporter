const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const registrationSchema=new Schema({
  veh_num:String,
  name:String,
  email:String,
  address:String,
  complaints:[
    {
        type:Schema.Types.ObjectId,
        ref:'roadViolation'
    }
  ]
})

module.exports=mongoose.model("registrations",registrationSchema);