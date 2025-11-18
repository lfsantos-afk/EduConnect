// Storage Management System
// This file handles all data storage operations

class Storage {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize storage keys if they don't exist
        if (!this.getData('users')) {
            this.setData('users', []);
        }
        if (!this.getData('tutors')) {
            this.setData('tutors', this.getDefaultTutors());
        }
        if (!this.getData('sessions')) {
            this.setData('sessions', this.getDefaultSessions());
        }
        if (!this.getData('enrollments')) {
            this.setData('enrollments', []);
        }
        if (!this.getData('resources')) {
            this.setData('resources', this.getDefaultResources());
        }
        if (!this.getData('messages')) {
            this.setData('messages', []);
        }
        if (!this.getData('notifications')) {
            this.setData('notifications', []);
        }
        if (!this.getData('reviews')) {
            this.setData('reviews', []);
        }
        if (!this.getData('favorites')) {
            this.setData('favorites', []);
        }
    }

    // Basic CRUD operations
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    }

    clearData(key) {
        localStorage.removeItem(key);
    }

    clearAllData() {
        localStorage.clear();
        this.initializeStorage();
    }

    // User Management
    getUsers() {
        return this.getData('users') || [];
    }

    addUser(user) {
        const users = this.getUsers();
        const newUser = {
            id: Date.now(),
            ...user,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this.setData('users', users);
        return newUser;
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === parseInt(id));
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === parseInt(userId));
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.setData('users', users);
            return users[index];
        }
        return null;
    }

    // Session Management
    setCurrentUser(user) {
        this.setData('currentUser', user);
    }

    getCurrentUser() {
        return this.getData('currentUser');
    }

    logout() {
        this.clearData('currentUser');
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    // Tutor Management
    getTutors() {
        return this.getData('tutors') || [];
    }

    getTutorById(id) {
        const tutors = this.getTutors();
        return tutors.find(t => t.id === parseInt(id));
    }

    getTutorByUserId(userId) {
        const tutors = this.getTutors();
        return tutors.find(t => t.userId === parseInt(userId));
    }

    updateTutor(tutorId, updates) {
        const tutors = this.getTutors();
        const index = tutors.findIndex(t => t.id === parseInt(tutorId));
        if (index !== -1) {
            tutors[index] = { ...tutors[index], ...updates };
            this.setData('tutors', tutors);
            return tutors[index];
        }
        return null;
    }

    addTutor(tutor) {
        const tutors = this.getTutors();
        const newTutor = {
            id: Date.now(),
            ...tutor,
            createdAt: new Date().toISOString()
        };
        tutors.push(newTutor);
        this.setData('tutors', tutors);
        return newTutor;
    }

    // Tutoring Sessions Management
    getSessions() {
        return this.getData('sessions') || [];
    }

    getSessionById(id) {
        const sessions = this.getSessions();
        return sessions.find(s => s.id === parseInt(id));
    }

    getSessionsByTutor(tutorId) {
        const sessions = this.getSessions();
        return sessions.filter(s => s.tutorId === parseInt(tutorId));
    }

    addSession(session) {
        const sessions = this.getSessions();
        const newSession = {
            id: Date.now(),
            ...session,
            createdAt: new Date().toISOString()
        };
        sessions.push(newSession);
        this.setData('sessions', sessions);
        return newSession;
    }

    updateSession(sessionId, updates) {
        const sessions = this.getSessions();
        const index = sessions.findIndex(s => s.id === parseInt(sessionId));
        if (index !== -1) {
            sessions[index] = { ...sessions[index], ...updates };
            this.setData('sessions', sessions);
            return sessions[index];
        }
        return null;
    }

    deleteSession(sessionId) {
        const sessions = this.getSessions();
        const filtered = sessions.filter(s => s.id !== parseInt(sessionId));
        this.setData('sessions', filtered);
        return true;
    }

    // Enrollment Management
    getEnrollments() {
        return this.getData('enrollments') || [];
    }

    getEnrollmentsByStudent(studentId) {
        const enrollments = this.getEnrollments();
        return enrollments.filter(e => e.studentId === parseInt(studentId));
    }

    getEnrollmentsBySession(sessionId) {
        const enrollments = this.getEnrollments();
        return enrollments.filter(e => e.sessionId === parseInt(sessionId));
    }

    addEnrollment(enrollment) {
        const enrollments = this.getEnrollments();
        const newEnrollment = {
            id: Date.now(),
            ...enrollment,
            status: 'active',
            enrolledAt: new Date().toISOString()
        };
        enrollments.push(newEnrollment);
        this.setData('enrollments', enrollments);
        return newEnrollment;
    }

    // Resources Management
    getResources() {
        return this.getData('resources') || [];
    }

    addResource(resource) {
        const resources = this.getResources();
        const newResource = {
            id: Date.now(),
            ...resource,
            uploadedAt: new Date().toISOString(),
            views: 0,
            downloads: 0
        };
        resources.push(newResource);
        this.setData('resources', resources);
        return newResource;
    }

    deleteResource(resourceId) {
        const resources = this.getResources();
        const filtered = resources.filter(r => r.id !== parseInt(resourceId));
        this.setData('resources', filtered);
        return true;
    }

    incrementResourceViews(resourceId) {
        const resources = this.getResources();
        const resource = resources.find(r => r.id === parseInt(resourceId));
        if (resource) {
            resource.views++;
            this.setData('resources', resources);
        }
    }

    incrementResourceDownloads(resourceId) {
        const resources = this.getResources();
        const resource = resources.find(r => r.id === parseInt(resourceId));
        if (resource) {
            resource.downloads++;
            this.setData('resources', resources);
        }
    }

    // Messages Management
    getMessages() {
        return this.getData('messages') || [];
    }

    getConversation(user1Id, user2Id) {
        const messages = this.getMessages();
        return messages.filter(m => 
            (m.senderId === parseInt(user1Id) && m.receiverId === parseInt(user2Id)) ||
            (m.senderId === parseInt(user2Id) && m.receiverId === parseInt(user1Id))
        ).sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    }

    getConversations(userId) {
        const messages = this.getMessages();
        const userMessages = messages.filter(m => 
            m.senderId === parseInt(userId) || m.receiverId === parseInt(userId)
        );
        
        const conversationsMap = new Map();
        userMessages.forEach(msg => {
            const otherId = msg.senderId === parseInt(userId) ? msg.receiverId : msg.senderId;
            if (!conversationsMap.has(otherId) || 
                new Date(msg.sentAt) > new Date(conversationsMap.get(otherId).sentAt)) {
                conversationsMap.set(otherId, msg);
            }
        });
        
        return Array.from(conversationsMap.values()).sort((a, b) => 
            new Date(b.sentAt) - new Date(a.sentAt)
        );
    }

    sendMessage(message) {
        const messages = this.getMessages();
        const newMessage = {
            id: Date.now(),
            ...message,
            sentAt: new Date().toISOString(),
            read: false
        };
        messages.push(newMessage);
        this.setData('messages', messages);
        
        // Create notification for receiver
        this.addNotification({
            userId: message.receiverId,
            type: 'message',
            title: 'New Message',
            message: `You have a new message`,
            relatedId: message.senderId
        });
        
        return newMessage;
    }

    markMessagesAsRead(user1Id, user2Id) {
        const messages = this.getMessages();
        messages.forEach(m => {
            if (m.senderId === parseInt(user2Id) && m.receiverId === parseInt(user1Id)) {
                m.read = true;
            }
        });
        this.setData('messages', messages);
    }

    // Notifications Management
    getNotifications() {
        return this.getData('notifications') || [];
    }

    getUserNotifications(userId) {
        const notifications = this.getNotifications();
        return notifications.filter(n => n.userId === parseInt(userId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getUnreadNotifications(userId) {
        const notifications = this.getUserNotifications(userId);
        return notifications.filter(n => !n.read);
    }

    addNotification(notification) {
        const notifications = this.getNotifications();
        const newNotification = {
            id: Date.now(),
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        };
        notifications.push(newNotification);
        this.setData('notifications', notifications);
        return newNotification;
    }

    markNotificationAsRead(notificationId) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === parseInt(notificationId));
        if (notification) {
            notification.read = true;
            this.setData('notifications', notifications);
        }
    }

    markAllNotificationsAsRead(userId) {
        const notifications = this.getNotifications();
        notifications.forEach(n => {
            if (n.userId === parseInt(userId)) {
                n.read = true;
            }
        });
        this.setData('notifications', notifications);
    }

    // Reviews Management
    getReviews() {
        return this.getData('reviews') || [];
    }

    getTutorReviews(tutorId) {
        const reviews = this.getReviews();
        return reviews.filter(r => r.tutorId === parseInt(tutorId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    addReview(review) {
        const reviews = this.getReviews();
        const newReview = {
            id: Date.now(),
            ...review,
            createdAt: new Date().toISOString()
        };
        reviews.push(newReview);
        this.setData('reviews', reviews);
        
        // Update tutor rating
        this.updateTutorRating(review.tutorId);
        
        return newReview;
    }

    updateTutorRating(tutorId) {
        const reviews = this.getTutorReviews(tutorId);
        if (reviews.length === 0) return;
        
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const tutor = this.getTutorById(tutorId);
        
        if (tutor) {
            this.updateTutor(tutorId, { 
                rating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews.length
            });
        }
    }

    hasUserReviewedTutor(userId, tutorId) {
        const reviews = this.getReviews();
        return reviews.some(r => r.userId === parseInt(userId) && r.tutorId === parseInt(tutorId));
    }

    // Favorites Management
    getFavorites() {
        return this.getData('favorites') || [];
    }

    getUserFavorites(userId) {
        const favorites = this.getFavorites();
        return favorites.filter(f => f.userId === parseInt(userId));
    }

    addFavorite(userId, tutorId) {
        const favorites = this.getFavorites();
        
        // Check if already favorited
        const exists = favorites.some(f => 
            f.userId === parseInt(userId) && f.tutorId === parseInt(tutorId)
        );
        
        if (exists) return null;
        
        const newFavorite = {
            id: Date.now(),
            userId: parseInt(userId),
            tutorId: parseInt(tutorId),
            createdAt: new Date().toISOString()
        };
        
        favorites.push(newFavorite);
        this.setData('favorites', favorites);
        return newFavorite;
    }

    removeFavorite(userId, tutorId) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(f => 
            !(f.userId === parseInt(userId) && f.tutorId === parseInt(tutorId))
        );
        this.setData('favorites', filtered);
        return true;
    }

    isFavorite(userId, tutorId) {
        const favorites = this.getUserFavorites(userId);
        return favorites.some(f => f.tutorId === parseInt(tutorId));
    }

    getTutorFavoritesCount(tutorId) {
        const favorites = this.getFavorites();
        return favorites.filter(f => f.tutorId === parseInt(tutorId)).length;
    }

    // Default Data
    getDefaultTutors() {
        return [
            {
                id: 1,
                userId: null,
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@educonnect.com',
                subjects: ['Mathematics', 'Physics'],
                description: 'PhD in Mathematics with 10+ years of teaching experience. Specializing in calculus and advanced mathematics.',
                photo: '👩‍🏫',
                rating: 4.9,
                totalStudents: 156
            },
            {
                id: 2,
                userId: null,
                name: 'Prof. Michael Chen',
                email: 'michael.chen@educonnect.com',
                subjects: ['Programming', 'Computer Science'],
                description: 'Software engineer and educator passionate about teaching coding to beginners and advanced students.',
                photo: '👨‍💻',
                rating: 4.8,
                totalStudents: 203
            },
            {
                id: 3,
                userId: null,
                name: 'Emma Williams',
                email: 'emma.williams@educonnect.com',
                subjects: ['English', 'Literature'],
                description: 'English literature expert with a focus on creative writing and essay composition.',
                photo: '👩‍🎓',
                rating: 4.9,
                totalStudents: 134
            },
            {
                id: 4,
                userId: null,
                name: 'Dr. James Rodriguez',
                email: 'james.rodriguez@educonnect.com',
                subjects: ['Chemistry', 'Biology'],
                description: 'Biochemistry professor making science fun and accessible for all students.',
                photo: '👨‍🔬',
                rating: 4.7,
                totalStudents: 98
            },
            {
                id: 5,
                userId: null,
                name: 'Lisa Anderson',
                email: 'lisa.anderson@educonnect.com',
                subjects: ['History', 'Geography'],
                description: 'History enthusiast bringing the past to life through engaging storytelling.',
                photo: '👩‍🏫',
                rating: 4.8,
                totalStudents: 87
            },
            {
                id: 6,
                userId: null,
                name: 'David Kim',
                email: 'david.kim@educonnect.com',
                subjects: ['Spanish', 'French'],
                description: 'Polyglot language teacher with immersive teaching methods.',
                photo: '👨‍🎓',
                rating: 4.9,
                totalStudents: 176
            }
        ];
    }

    getDefaultSessions() {
        return [
            {
                id: 1,
                tutorId: 1,
                title: 'Introduction to Calculus',
                subject: 'Mathematics',
                description: 'Learn the fundamentals of calculus including limits, derivatives, and integrals.',
                date: '2024-12-01',
                time: '14:00',
                duration: '60 minutes',
                maxStudents: 10,
                currentStudents: 3,
                status: 'upcoming'
            },
            {
                id: 2,
                tutorId: 1,
                title: 'Advanced Algebra',
                subject: 'Mathematics',
                description: 'Master complex algebraic concepts and problem-solving techniques.',
                date: '2024-12-03',
                time: '15:00',
                duration: '90 minutes',
                maxStudents: 8,
                currentStudents: 5,
                status: 'upcoming'
            },
            {
                id: 3,
                tutorId: 2,
                title: 'Python for Beginners',
                subject: 'Programming',
                description: 'Start your programming journey with Python basics and hands-on projects.',
                date: '2024-12-02',
                time: '16:00',
                duration: '120 minutes',
                maxStudents: 15,
                currentStudents: 12,
                status: 'upcoming'
            },
            {
                id: 4,
                tutorId: 2,
                title: 'Web Development Fundamentals',
                subject: 'Programming',
                description: 'Learn HTML, CSS, and JavaScript to build your first website.',
                date: '2024-12-05',
                time: '14:00',
                duration: '90 minutes',
                maxStudents: 12,
                currentStudents: 8,
                status: 'upcoming'
            },
            {
                id: 5,
                tutorId: 3,
                title: 'Essay Writing Masterclass',
                subject: 'English',
                description: 'Improve your essay writing skills with structured techniques and feedback.',
                date: '2024-12-04',
                time: '13:00',
                duration: '60 minutes',
                maxStudents: 10,
                currentStudents: 7,
                status: 'upcoming'
            },
            {
                id: 6,
                tutorId: 4,
                title: 'Organic Chemistry Basics',
                subject: 'Chemistry',
                description: 'Understand organic compounds, reactions, and molecular structures.',
                date: '2024-12-06',
                time: '15:00',
                duration: '90 minutes',
                maxStudents: 10,
                currentStudents: 4,
                status: 'upcoming'
            }
        ];
    }

    getDefaultResources() {
        return [
            {
                id: 1,
                authorId: 1,
                authorName: 'Dr. Sarah Johnson',
                title: 'Calculus Fundamentals Guide',
                description: 'Complete guide covering limits, derivatives, and integrals with examples.',
                subject: 'Mathematics',
                fileType: 'PDF',
                fileName: 'calculus-guide.pdf',
                uploadedAt: '2024-11-01T10:00:00Z',
                views: 245,
                downloads: 89
            },
            {
                id: 2,
                authorId: 2,
                authorName: 'Prof. Michael Chen',
                title: 'Python Cheat Sheet',
                description: 'Quick reference for Python syntax, functions, and common operations.',
                subject: 'Programming',
                fileType: 'PDF',
                fileName: 'python-cheatsheet.pdf',
                uploadedAt: '2024-11-05T14:30:00Z',
                views: 412,
                downloads: 178
            },
            {
                id: 3,
                authorId: 3,
                authorName: 'Emma Williams',
                title: 'Essay Structure Template',
                description: 'Professional template for organizing and writing academic essays.',
                subject: 'English',
                fileType: 'DOC',
                fileName: 'essay-template.doc',
                uploadedAt: '2024-11-08T09:15:00Z',
                views: 189,
                downloads: 123
            },
            {
                id: 4,
                authorId: 4,
                authorName: 'Dr. James Rodriguez',
                title: 'Periodic Table Reference',
                description: 'Comprehensive periodic table with element properties and trends.',
                subject: 'Chemistry',
                fileType: 'PDF',
                fileName: 'periodic-table.pdf',
                uploadedAt: '2024-11-10T11:00:00Z',
                views: 334,
                downloads: 156
            },
            {
                id: 5,
                authorId: 5,
                authorName: 'Lisa Anderson',
                title: 'World War II Timeline',
                description: 'Detailed timeline of major events during World War II.',
                subject: 'History',
                fileType: 'PDF',
                fileName: 'wwii-timeline.pdf',
                uploadedAt: '2024-11-12T13:45:00Z',
                views: 267,
                downloads: 98
            }
        ];
    }
}

// Initialize storage
const storage = new Storage();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}