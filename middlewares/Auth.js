import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../Models/UserModels.js";

// generar un token

// @desc Authenticated user & get token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
};

//protection middleware
const protect = expressAsyncHandler(async (req, res, next) => {
    let token;
    // verificamos que el token exista en los headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        //seteamos el token de Bearer en el header
        try {
            token = req.headers.authorization.split(" ")[1];
            //verificamos el token y cogemos el id del usuario
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // get del usuario id desde el decoded token
            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch(error){
            console.error(error);
            res.status(401);
            throw new Error("No autorizado, fallo el token");
        }
    }
    // si el token no existe en los headers enviamos un error
    if(!token) {
        res.status(401);
        throw new Error("No esta autorizado, no hay el token");
    }


});


// admin middleware
const admin = (req, res, next) => {
    if(req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error ("No esta autorizado como admin")
    }
};



export { generateToken, protect , admin};
