const bcrypt = require('bcrypt');
const User = require('../models/user');
const { ProctoredExam, OnlineClass, OnlineExam, AtiModule } = require('../config/db');
const redisClient = require('../config/redis');

const saltRounds = 10;

class UserService {
    static async createUser(userData) {
        const { name, email, phone, role, password } = userData;
        // 1. Generate salt and hash using await
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // 2. Create user instance
        const addedUser = new User({ name, email, phone, role, password: passwordHash });
        // 3. Await the save and return the result
        return await addedUser.save();
    };

    static async getUser(email, password) {
        try {
            // find user by email
            const user = await User.findOne({ email });
            // if no user found, return null
            if (!user) return null;
            // check password
            const isMatch = await bcrypt.compare(password, user.password);
            // if password is wrong, return null
            if (!isMatch) return null;
            // return user if everything matches
            return user;
        } catch (err) {
            throw err;
        }
    }

    static async getAllServices() {
        const CACHE_KEY = 'landing_page_services';
        const CACHE_DURATION = 3600; // cache for 1 hour

        try {
            // Check Redis Cache
            const cachedData = await redisClient.get(CACHE_KEY);

            if (cachedData) {
                console.log('⚡ Serving Landing Page data from Redis Cache');
                return JSON.parse(cachedData);
            }

            console.log('⏳ Fetching Landing Page data from MongoDB...');
            const proctoredExams = await ProctoredExam.find({});
            const onlineExams = await OnlineExam.find({});
            const atiModules = await AtiModule.find({});
            const onlineClasses = await OnlineClass.find({});

            const result = {
                proctoredExams,
                onlineExams,
                atiModules,
                onlineClasses,
            };

            // Save to Redis for next time
            await redisClient.set(CACHE_KEY, JSON.stringify(result), {
                EX: CACHE_DURATION
            });

            return result;

        } catch (err) {

        }
    }
};

module.exports = UserService;
