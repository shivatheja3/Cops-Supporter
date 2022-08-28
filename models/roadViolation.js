const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const roadViolationSchema=new Schema({
    title:String,
    image:[
        {
            url:String,
            filename:String
        }
    ],
    veh_num:String,
    location:String,
    uploader_name:String,
    uploader_email:String,
    statusOfChallan:Number,
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
});

module.exports=mongoose.model('roadViolation',roadViolationSchema);
