import { MoviesData } from "../Data/MovieData.js";
import Movie from "../Models/MoviesModel.js";
import asyncHandler from "express-async-handler";

/*******************Controlladores publicos***********************/

// @desc import movies
// @route POST /api/movies/import
// @access Public 

const importMovies = asyncHandler(async (req, res) => {
    //Nos aseguramos que la tabla de peliculas esta vacia borrando todos los documentos
    await Movie.deleteMany({});
    //luego insertamos todas las peliclas desde MOviesData = Data
    const movies = await Movie.insertMany(MoviesData);
    res.status(201).json(movies);

});

// @desc get all movies
// @route POST /api/movies
// @access Public 
const getMovies = asyncHandler(async (req, res) => {
    try {
        //filtro de peliculas por categoria, tiempo, lenguaje ,rate, y busqueda
        const { category, time, language, rate, year, search } = req.query;
        let query = {
            ...(category && { category }),
            ...(time && { time }),
            ...(language && { language }),
            ...(rate && { rate }),
            ...(year && { year }),
            ...(search && { name: { $regex: search, $options: "i" } }),
        }

        //funcionalidad para cargar mas peliculas
        const page = Number(req.query.pageNumber) || 1;  // si es que la pageNumber no es proveida por la quey la seteAMOA a 1
        const limit = 12;  //significa 2 peliculas por pagina
        const skip = (page - 1) * limit; // skip 2 peliculas por pagina

        //encontrar peliculas por query, skip y por limite

        const movies = await Movie.find(query)
           // .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // traemos el total de peliculas
        const count = await Movie.countDocuments(query);

        //enviamos respuesta con las peliculas y el total 

        res.json({
            movies,
            page,
            pages: Math.ceil(count / limit), // numero total de paginas
            totalMovies: count  // numero total de peliculas
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});


// @desc get pelicula por ID
// @route GET /api/movies/:id
// @access Public 
const getMovieById = asyncHandler(async (req, res) => {
    try {
        //buscamos la pelicula por id en la BD
        const movie = await Movie.findById(req.params.id);
        // si la pelicula es encontrada la enviamos a cliente = front
        if (movie) {
            res.json(movie);
        }
        //caso contrario enviamos error 404
        else {
            res.status(404);
            throw new Error("Pelicula no encontrada");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});


// @desc get top rated movies
// @route GET /api/movies/rated/top
// @access Public 
const getTopRatedMovies = asyncHandler(async (req, res) => {
    try {
        // encontramos las top rated movies
        const movies = await Movie.find({}).sort({ rate: -1 })
        //enviamos al front
        res.json(movies);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

// @desc get random movies
// @route GET /api/movies/random
// @access Public 
const getRandomMovies = asyncHandler(async (req, res) => {
    try {
        // encontramos random movies
        const movies = await Movie.aggregate([{ $sample: { size: 8 } }]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

/************CONTROLADORES PRIVADOS*******************/

// @desc Crear pelicula review
// @route GET /api/movies/:id/reviews
// @access Private 
// Este metodo es fundamental para el CORE

const createMovieReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    try {
        // buscamos la pelicula en la base de datos
        const movie = await Movie.findById(req.params.id);
        // si es que la pelicula fue encontrada
        if (movie) {
            //verificamos si el usuario ya ha dado su review
            const alreadyReviewed = movie.reviews.find(
                (r) => r.userId.toString() === req.user._id.toString()
            );

            // si es que ya fue reviewd enviamos error 400
            if (alreadyReviewed) {
                res.status(400);
                throw new Error("Ya se comento esta pelicula");

            }
            //caso contrario creamos una nueva review
            const review = {
                userName: req.user.fullName,
                userId: req.user._id,
                userImage: req.user.image,
                rating: Number(rating),
                comment,
            }
            // pusheamos la nueva review a un arregle
            movie.reviews.push(review);
            // aumentamos el numero de reviews
            movie.numberOfReviews = movie.reviews.length;

            //calculamos el nuevo rate de la pelicula
            movie.rate = movie.reviews.reduce((acc, item) => item.rating + acc, 0) /
                movie.reviews.length;

            // guardamos la pelicula en la base de datos
            await movie.save();
            res.status(201).json({
                message: "La review ha sido añadida con éxito",
            });
        } else {
            res.status(404);
            throw new Error("Pelicula no encontrada");
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

/*****************CONTROLADORES PARA ADMIN***********************/
// @desc Actualizar pelicula
// @route PUT /api/movies/:id
// @access Private /admin

const updateMovie = asyncHandler(async (req, res) => {
    try {
        //obtenemos la data desde request body
        const {
            name,
            desc,
            image,
            titleImage,
            rate,
            numberOfReviews,
            category,
            time,
            language,
            year,
            video,
            casts

        } = req.body;

        // encontramos la pelicula en la base de datos
        const movie = await Movie.findById(req.params.id);

        if (movie) {
            //actualizamos la data de la pelicula
            movie.name = name || movie.name;
            movie.desc = desc || movie.desc;
            movie.image = image || movie.image;
            movie.titleImage = titleImage || movie.titleImage;
            movie.rate = rate || movie.rate;
            movie.numberOfReviews = numberOfReviews || movie.numberOfReviews;
            movie.category = category || movie.category;
            movie.time = time || movie.time;
            movie.language = language || movie.language;
            movie.year = year || movie.year;
            movie.video = video || movie.video;
            movie.casts = casts || movie.casts;

            // guardamos la pelicula en la base de datos
            const updatedMovie = await movie.save();
            //enviamos la pelicula actualizada al frotn
            res.status(201).json(updatedMovie);

        } else {
            res.status(404);
            throw new Error("Pelicula no encontrada");
        }

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});

// @desc Eliminar una pelicual
// @route PUT /api/movies/:id
// @access Private /admin

const deleteMovie = asyncHandler(async (req, res) => {
    try {
        // encontramos la pelicula en la base de datos 
        //const movie = await Movie.findOne({ _id: req.params.id });
        const movie = await Movie.findById(req.params.id);
        // si la pelicula fue encontrada la borramos
        if (movie) {
            //console.log(movie)
            //await movie.remove();
            await movie.deleteOne();
            res.json({ message: "Pelicula Eliminada correctamente" });
        }
        // caso contrario enviamos un error 404
        else {
            res.status(404);
            throw new Error("Pelicula no encontrada");

        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});


// @desc Eliminar todas las peliculas
// @route PUT /api/movies
// @access Private /admin
const deleteAllMovies = asyncHandler(async (req, res) => {
    try {
        //boramos todas las peliculas
        await Movie.deleteMany({});
        res.json({message: "Todas las peliculas han sido eliminadas con éxito"});
    } catch (error) {
        res.status(400).json({message: error.message});
    }

});



// @desc Crear peliculas
// @route PUT /api/movies
// @access Private /admin
const createMovie = asyncHandler(async (req, res) => {
    try {
        //obtenemos la data desde request body
        const {
            name,
            desc,
            image,
            titleImage,
            rate,
            numberOfReviews,
            category,
            time,
            language,
            year,
            video,
            casts

        } = req.body;

        // creacion de una nueva pelicula
        const movie = new Movie({
            name,
            desc,
            image,
            titleImage,
            rate,
            numberOfReviews,
            category,
            time,
            language,
            year,
            video,
            casts,
            userId: req.user._id
        });

        // guardamos la pelicula en la base de datos
        if (movie) {
            const createMovie = await movie.save();
            res.status(201).json(createMovie);
        } else {
            res.status(400);
            throw new Error("Informacion de la pelicula erronea");
        }

    } catch (error) {
        res.status(400).json({ message: error.message });
    }

});


export {
    importMovies,
    getMovies,
    getMovieById,
    getTopRatedMovies,
    getRandomMovies,
    createMovieReview,
    updateMovie,
    deleteMovie,
    deleteAllMovies,
    createMovie,
};