// Middleware to ensure user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'Please login to continue.');
        return res.redirect('/login');
    }

    if (req.session.user.role !== 'admin') {
        req.flash('error', 'Access denied. Admins');
        // redirect based on user actual role
        if (req.session.user.role === 'writer') return res.redirect('/writer/dashboard');
        return res.redirect('/profile');
    }
    next();
};

// ensure user is a tutor/writer
const requireWriter = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'Please login first.');
        return res.redirect('/login');
    }

    if (req.session.user.role !== 'writer') {
        req.flash('error', 'Access denied. Tutors only.');
        // Redirect them to their correct dashboard
        if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
        return res.redirect('/profile');
    }
    next();
};

// ensure user is a student
const requireStudent = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'Please login first.');
        return res.redirect('/login');
    }
    // if not student, redirect them to their specific dashboard
    if (req.session.user.role !== 'student') {
        if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
        if (req.session.user.role === 'writer') return res.redirect('/writer/dashboard');
    }

    next();
}

// middleware to ensure user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // user is not logged in
        req.flash('error', 'Please login to place an order.');
        return res.redirect('/login');
    }
    // User is logged in -> proceed
    next();
};

module.exports = { requireAdmin, requireWriter, requireStudent, requireLogin };
