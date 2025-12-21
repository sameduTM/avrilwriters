require('dotenv').config();

// --- IMPORTS ---
const compression = require('compression');
const { doubleCsrf } = require('csrf-csrf');
const express = require('express');
const flash = require('express-flash');
const { format } = require('date-fns');
const helmet = require('helmet');
const path = require('path');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const nunjucks = require('nunjucks');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoute');
const authRouter = require('./routes/authRoute');
const orderRouter = require('./routes/orderRoute');
const paymentRouter = require('./routes/paymentRoute');
const adminRouter = require('./routes/adminRoute');
const writerRouter = require('./routes/writerRoute');
const messageRouter = require('./routes/messageRoute');

// --- ENV CHECK ---
if (!process.env.SESSION_SECRET) {
    console.error("❌ FATAL ERROR: SESSION_SECRET is not defined.");
    process.exit(1);
}

// --- DB CONNECTION ---
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// --- SECURITY HEADERS ---
app.use(helmet({
    contentSecurityPolicy: false,
}));

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'views/static')));
app.use('/uploads', express.static('uploads'));

// --- TEMPLATE ENGINE ---
const env = nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app,
    watch: true,
});

env.addFilter('date', (date, formatStr) => {
    if (!date) return "N/A";
    return format(new Date(date), formatStr || 'MMM d, yyyy');
});

app.set('view engine', 'html');
app.engine('html', nunjucks.render);

// --- MIDDLEWARE ---
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(flash());
app.use(compression());

// --- SESSION ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorsonDB' }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
    }
}));

// CSRF handler
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => process.env.SESSION_SECRET,
    getSessionIdentifier: (req) => req.session.id,
    cookieName: "x-csrf-token",
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
});

app.use((req, res, next) => {
    res.locals.csrfToken = generateCsrfToken(req, res);
    next();
});

// Apply CSRF protection only to routes that require it (exclude public auth routes)
app.use((req, res, next) => {
    // Skip CSRF validation for public auth routes and API endpoints
    if (req.path === '/login' || req.path === '/signup' || req.path === '/forgot-password' || req.path === '/reset-password' || req.path === '/orders/api/place-order' || req.path === '/messages/api/check-messages' || req.path === '/messages/api/send') {
        return next();
    }
    doubleCsrfProtection(req, res, next);
});


// --- ROUTES ---
// Mount specific routers first to prevent conflicts
app.use('/admin', adminRouter);
app.use('/writer', writerRouter);
app.use(authRouter);
app.use(messageRouter);
app.use(orderRouter);
app.use(paymentRouter);
app.use(userRouter); // Usually handles "/" so keep it last or ensure it doesn't block others

// --- ERROR HANDLING ---
app.use((req, res) => {
    res.status(404);
    try {
        return res.render('404.html', { images: { logo: '/images/medical-team.png' } });
    } catch (e) {
        return res.send("404 - Page Not Found");
    }
});


app.use((err, req, res, next) => {
    // CSRF Error Handler
    if (err.code === 'EBADCSRFTOKEN') {
        console.warn("⚠️ CSRF Validation Failed");
        req.flash('error', 'Form session expired. Please try again.');
        return res.redirect('back');
    }

    console.error("Server Error:", err.stack);
    res.status(500);
    try {
        return res.render('500.html', {
            images: { logo: '/images/medical-team.png' },
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        });
    } catch (e) {
        return res.send("500 - Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port:${PORT}`);
});
