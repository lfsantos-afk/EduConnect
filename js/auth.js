// Authentication System with Supabase

class Auth {
    constructor() {
        this.db = db;
    }

    // Register new user
    async register(userData) {
        try {
            // Validate email
            if (!this.validateEmail(userData.email)) {
                return { success: false, message: 'Invalid email format' };
            }

            // Check if email already exists
            const existingUser = await this.db.getUserByEmail(userData.email);
            if (existingUser) {
                return { success: false, message: 'Email already registered' };
            }

            // Validate password
            if (!this.validatePassword(userData.password)) {
                return { 
                    success: false, 
                    message: 'Password must be at least 6 characters long' 
                };
            }

            // Create user
            const user = await this.db.createUser({
                name: userData.name,
                email: userData.email,
                password: userData.password, // In production, hash this!
                role: userData.role
            });

            // If tutor, create tutor profile
            if (userData.role === 'tutor') {
                await this.db.createTutor({
                    user_id: user.id,
                    name: user.name,
                    email: user.email,
                    subjects: [],
                    description: '',
                    photo: '👨‍🏫',
                    rating: 5.0,
                    total_students: 0,
                    total_reviews: 0,
                    created_at: new Date().toISOString()
                });
            }

            return { 
                success: true, 
                message: 'Registration successful!',
                user: user 
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'An error occurred during registration: ' + error.message };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const user = await this.db.getUserByEmail(email);

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (user.password !== password) {
                return { success: false, message: 'Incorrect password' };
            }

            // Set current user
            this.db.setCurrentUser(user);

            return { 
                success: true, 
                message: 'Login successful!',
                user: user 
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login: ' + error.message };
        }
    }

    // Logout user
    logout() {
        this.db.logout();
        window.location.href = 'index.html';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.db.isLoggedIn();
    }

    // Get current user
    getCurrentUser() {
        return this.db.getCurrentUser();
    }

    // Check if current user is tutor
    isTutor() {
        const user = this.getCurrentUser();
        return user && user.role === 'tutor';
    }

    // Check if current user is student
    isStudent() {
        const user = this.getCurrentUser();
        return user && user.role === 'student';
    }

    // Require authentication
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Require tutor role
    requireTutor() {
        if (!this.requireAuth()) return false;
        if (!this.isTutor()) {
            window.location.href = 'student-dashboard.html';
            return false;
        }
        return true;
    }

    // Require student role
    requireStudent() {
        if (!this.requireAuth()) return false;
        if (!this.isStudent()) {
            window.location.href = 'tutor-dashboard.html';
            return false;
        }
        return true;
    }

    // Update user profile
    async updateProfile(userId, updates) {
        try {
            const updatedUser = await this.db.updateUser(userId, updates);
            if (updatedUser) {
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.db.setCurrentUser(updatedUser);
                }
                return { success: true, user: updatedUser };
            }
            return { success: false, message: 'User not found' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'An error occurred: ' + error.message };
        }
    }

    // Validation helpers
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    // Format user display name
    getUserDisplayName(user) {
        return user ? user.name : 'User';
    }

    // Get user initials for avatar
    getUserInitials(user) {
        if (!user || !user.name) return '?';
        const names = user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    }
}

// Initialize auth
const auth = new Auth();