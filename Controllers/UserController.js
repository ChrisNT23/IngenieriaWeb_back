import asyncHandler from "express-async-handler";
import User from "../Models/UserModels.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/Auth.js";

//@desc Register user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, image } = req.body;
    try {
        const userExists = await User.findOne({ email });
        //chequeamos que el usuario exista
        if (userExists) {
            res.status(400);
            throw new Error("El usuario ya existe");
        }
        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Creacion del usuario en base de datos
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            image,
        });

        //Si el usuario fue creado con exito enviar la data y el token al  cliente=front
        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error("Información de usuario incorrecta");
        }

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Login user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        //encontrar el usuario en la base de datos
        const user = await User.findOne({ email });
        // si el usuario existe lo comparamos con la contraseña hashed y luego con el user data y el token del cliente
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
            //si el usuario no es encontrado o la contraseña no coincide enviamos un mensaje de error

        } else {
            res.status(401);
            throw new Error("Contraseña o correo invalidos");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// *******CONTROLADORES PRIVADOS******************

//@desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, email, image } = req.body;
    try {
        //Buscamos el usuario en la base de datos
        const user = await User.findById(req.user._id);
        //Si el usuario existe lo actualixamos y lo guardamos en la base de datos
        if (user) {
            user.fullName = fullName || user.fullName;
            user.email = email || user.email;
            user.image = image || user.image;

            const updatedUser = await user.save();

            //enviamos la data actualizada y el token al cliente
            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                image: updatedUser.image,
                isAdmin: updatedUser.isAdmin,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error("Usuario no encontrado");
        }
        // 
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// @desc Delete user profile
// @route DELETE /api/users
// @access Private
const deleteUserProfile = asyncHandler(async (req, res) => {
    try {
        //buscamos el usuario en la base de datos
        const user = await User.findById(req.user._id);
        // si el usuario existe lo borramos de la base de datos
        if (user) {
            if (user.isAdmin) {
                res.status(400);
                throw new Error("No se puede eliminar un usuario administrador");
            }
            // caso contrario borramos el usuario de la base de datos
            //await user.remove();
            await User.findByIdAndRemove(req.user._id);
            res.json({ message: "Usuario eliminado con éxito" });
        }
        //caso contrario mandamos un mensaje de error
        else {
            res.status(404);
            throw new Error("Usuario no encontrado");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Change user password
// @route PUT /api/users/password
// @access Private
const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        //buscamos el usuario en la base de datos
        const user = await User.findById(req.user._id);
        // si el usuario existe comparamos la contraseña antigua con la contraseña actual y actualizamos la contraseña y la guardamos en la base de datos 
        if (user && (await bcrypt.compare(oldPassword, user.password))) {
            //hash la nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
            await user.save();
            res.json({ message: "Contraseña cambiada correctamente" });
        }
        // caso contrario enviamos un errror
        else {
            res.status(401);
            throw new Error("Contraseña antigua incorrecta");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc Get all liked movies
// @route GET /api/users/favorites
// @access Private
const getLikedMovies = asyncHandler(async (req, res) => {
    try {
        //encontramos el usuario en la base de datos
        //const user = await User.findById(req.user._id).lean();
        const user = await User.findById(req.user._id).populate("likedMovies");
        //const user = await User.findById(req.user._id).populate({ path: 'likedMovies', model: 'Movie' });

        console.log(user)
        // si el usuario existe enviamos las peliculas likeadas al front
        if (user) {
            res.json(user.likedMovies);
        }
        // caso contrario enviamos mensajes de error
        else {
            res.status(404);
            throw new Error("Usuario no encontrado");

        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

// @desc Add movie to liked movies
// @route POST /api/users/favorites
// @access Private 
const addLikedMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.body;
    try {
        //encontramos el usuario en la base de datos 
        const user = await User.findById(req.user._id);
        //Comprobacion de que estamos jalando el usuario
        console.log("User:", user)
        //console.log(req.user)
        // si el usuario existe añadimos la pelicula a liked movies y lo guardamos en la base de datos
        if (user) {
            // verificamos que la pelicula ya esta likeada

            // si la pelicula ya esta likeada enviamos un mensaje de error
            if (user.likedMovies.includes(movieId)) {
                res.status(400);
                throw new Error("La pelicula ya fue dada me gusta");
            }
            // caso contrario añadimos la pelicula y la guardamos
            user.likedMovies.push(movieId);
            await user.save();
            res.json(user.likedMovies);
        }
        //caso contrario enviamos mensajes de error
        else {
            res.status(404);
            throw new Error("Pelicula no encontrada");

        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

// @desc Delete all liked movies
// @route DELETE /api/users/favorites
// @access Private 
const deleteLikedMovies = asyncHandler(async (req, res) => {
    try {
        //buscamos el usuario en la BD
        const user = await User.findById(req.user._id);
        // si el usuario existe vamos a borrar todas las peliculas con like
        if(user) {
            user.likedMovies =[];
            await user.save();
            res.json({message: "Todas tus peliculas con like han sido eliminadas con exito"});
        }
        // caso contrario enviamos mensajes de error
        else {
            res.status(404);
            throw new Error ("Usuario no encontrado");
        }
    } catch (error) {
        res.status(400).json({message: error.message});
    }

});

/*********Controlladores ADMIN********/

// @desc Get todos los usuarios
// @route POST /api/users/
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    try{
        //buscamos todos los usuarios en la BD
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(400).json({message : error.message});
    }
});

// @desc delete todos los usuarios
// @route POST /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        // si el usuario existe lo borramos de la BD
        if(user) {
            // si el usuario es admin mandajmos un mensaje de errors
            if(user.isAdmin){
                res.status(400);
                throw new Error ("No se puede eliminar un usuario administrador");
            }
            //caso contrario eliminar el usuario de la BD
            //await user.remove();
            await User.findByIdAndRemove(req.params.id);
            res.json({message : "Usuario borrado con éxito"});
            
        }
        else {
            res.status(404);
            throw new Error("Usuario no encontrado");
        }
    } catch (error) {
       res.status(400).json({message: error.message});
    }
});

export {
    registerUser,
    loginUser,
    updateUserProfile,
    deleteUserProfile,
    changeUserPassword,
    getLikedMovies,
    addLikedMovie,
    deleteLikedMovies,
    getUsers,
    deleteUser

};