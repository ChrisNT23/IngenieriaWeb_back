import mongoose from 'mongoose';

const UserSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Por favor añade el nombre completo'],

        },
        email: {
            type: String,
            required: [true, 'Por favor añada un correo electronico'],
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Por favor añada una contraseña'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres']

        },
        image: {
            type: String,

        },

        isAdmin: {
            type: Boolean,
            default: false,
        },

        likedMovies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Movies",
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("User", UserSchema);