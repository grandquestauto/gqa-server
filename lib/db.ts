import mongoose from 'mongoose'


// Connect to MongoDB

export async function connectToDB(){
    await mongoose.connect(`mongodb+srv://grandquestauto:${process.env.DB_PASSWORD}@gqa.s82xu.mongodb.net/quest?retryWrites=true&w=majority&appName=gqa`).then(() => {
        console.log('> Connected to MongoDB')
    }).catch((err) => {
        console.log('Failed to connect to MongoDB', err)
    })
} 

