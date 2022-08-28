class ExpressError extends Error{
    constructor(message,statusCode){
        super();
        this.mesaage=message;
        this.statusCode=statusCode;
    }
    
}

module.exports=ExpressError;