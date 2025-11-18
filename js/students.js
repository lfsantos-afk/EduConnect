// Student Functions

class StudentManager {
    constructor() {
        this.storage = storage;
    }

    // Get all available tutors
    getAllTutors() {
        return this.storage.getTutors();
    }

    // Filter tutors by subject
    filterTutorsBySubject(subject) {
        const tutors = this.getAllTutors();
        if (!subject || subject === 'all') {
            return tutors;
        }
        return tutors.filter(tutor => 
            tutor.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
        );
    }

    // Search tutors
    searchTutors(query) {
        const tutors = this.getAllTutors();
        const lowerQuery = query.toLowerCase();
        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(lowerQuery) ||
            tutor.description.toLowerCase().includes(lowerQuery) ||
            tutor.subjects.some(s => s.toLowerCase().includes(lowerQuery))
        );
    }

    // Get tutor details
    getTutorDetails(tutorId) {
        return this.storage.getTutorById(tutorId);
    }

    // Get available sessions
    getAllSessions() {
        return this.storage.getSessions().filter(s => s.status === 'upcoming');
    }

    // Get sessions by tutor
    getSessionsByTutor(tutorId) {
        return this.storage.getSessionsByTutor(tutorId).filter(s => s.status === 'upcoming');
    }

    // Enroll in a session
    enrollInSession(studentId, sessionId) {
        try {
            const session = this.storage.getSessionById(sessionId);
            
            if (!session) {
                return { success: false, message: 'Session not found' };
            }

            // Check if already enrolled
            const existingEnrollments = this.storage.getEnrollmentsBySession(sessionId);
            const alreadyEnrolled = existingEnrollments.some(e => e.studentId === studentId);
            
            if (alreadyEnrolled) {
                return { success: false, message: 'You are already enrolled in this session' };
            }

            // Check if session is full
            if (session.currentStudents >= session.maxStudents) {
                return { success: false, message: 'This session is full' };
            }

            // Create enrollment
            const enrollment = this.storage.addEnrollment({
                studentId: studentId,
                sessionId: sessionId,
                tutorId: session.tutorId
            });

            // Update session student count
            this.storage.updateSession(sessionId, {
                currentStudents: session.currentStudents + 1
            });

            // Create notification for tutor
            const student = this.storage.getUserById(studentId);
            const tutor = this.storage.getTutorById(session.tutorId);
            if (tutor && tutor.userId) {
                this.storage.addNotification({
                    userId: tutor.userId,
                    type: 'enrollment',
                    title: 'New Student Enrolled',
                    message: `${student.name} has enrolled in your "${session.title}" session`,
                    relatedId: sessionId
                });
            }

            return { 
                success: true, 
                message: 'Successfully enrolled in session!',
                enrollment: enrollment 
            };
        } catch (error) {
            console.error('Enrollment error:', error);
            return { success: false, message: 'An error occurred during enrollment' };
        }
    }

    // Get student's enrollments
    getMyEnrollments(studentId) {
        const enrollments = this.storage.getEnrollmentsByStudent(studentId);
        return enrollments.map(enrollment => {
            const session = this.storage.getSessionById(enrollment.sessionId);
            const tutor = this.storage.getTutorById(enrollment.tutorId);
            return {
                ...enrollment,
                session: session,
                tutor: tutor
            };
        });
    }

    // Get all resources
    getAllResources() {
        return this.storage.getResources().sort((a, b) => 
            new Date(b.uploadedAt) - new Date(a.uploadedAt)
        );
    }

    // Filter resources by subject
    filterResourcesBySubject(subject) {
        const resources = this.getAllResources();
        if (!subject || subject === 'all') {
            return resources;
        }
        return resources.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    }

    // Search resources
    searchResources(query) {
        const resources = this.getAllResources();
        const lowerQuery = query.toLowerCase();
        return resources.filter(r => 
            r.title.toLowerCase().includes(lowerQuery) ||
            r.description.toLowerCase().includes(lowerQuery) ||
            r.subject.toLowerCase().includes(lowerQuery) ||
            r.authorName.toLowerCase().includes(lowerQuery)
        );
    }

    // Upload resource (student can share resources too)
    uploadResource(studentId, resourceData) {
        try {
            const student = this.storage.getUserById(studentId);
            const resource = this.storage.addResource({
                authorId: studentId,
                authorName: student.name,
                title: resourceData.title,
                description: resourceData.description,
                subject: resourceData.subject,
                fileType: resourceData.fileType,
                fileName: resourceData.fileName
            });

            return { 
                success: true, 
                message: 'Resource uploaded successfully!',
                resource: resource 
            };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, message: 'An error occurred during upload' };
        }
    }

    // Download resource
    downloadResource(resourceId) {
        this.storage.incrementResourceDownloads(resourceId);
        const resource = this.storage.getResources().find(r => r.id === resourceId);
        return resource;
    }

    // View resource (increment view count)
    viewResource(resourceId) {
        this.storage.incrementResourceViews(resourceId);
    }

    // Send message to tutor
    sendMessage(studentId, tutorUserId, message) {
        return this.storage.sendMessage({
            senderId: studentId,
            receiverId: tutorUserId,
            message: message
        });
    }

    // Get conversations
    getConversations(studentId) {
        const conversations = this.storage.getConversations(studentId);
        return conversations.map(conv => {
            const otherId = conv.senderId === studentId ? conv.receiverId : conv.senderId;
            const otherUser = this.storage.getUserById(otherId);
            return {
                ...conv,
                otherUser: otherUser,
                unread: !conv.read && conv.receiverId === studentId
            };
        });
    }

    // Get conversation with specific tutor
    getConversation(studentId, tutorUserId) {
        return this.storage.getConversation(studentId, tutorUserId);
    }

    // Mark messages as read
    markMessagesAsRead(studentId, tutorUserId) {
        this.storage.markMessagesAsRead(studentId, tutorUserId);
    }

    // Get notifications
    getNotifications(studentId) {
        return this.storage.getUserNotifications(studentId);
    }

    // Get unread notifications count
    getUnreadNotificationsCount(studentId) {
        return this.storage.getUnreadNotifications(studentId).length;
    }

    // Mark notification as read
    markNotificationAsRead(notificationId) {
        this.storage.markNotificationAsRead(notificationId);
    }

    // Mark all notifications as read
    markAllNotificationsAsRead(studentId) {
        this.storage.markAllNotificationsAsRead(studentId);
    }

    // Get unique subjects from all tutors
    getAllSubjects() {
        const tutors = this.getAllTutors();
        const subjects = new Set();
        tutors.forEach(tutor => {
            tutor.subjects.forEach(subject => subjects.add(subject));
        });
        return Array.from(subjects).sort();
    }

    // Get tutor rating
    getTutorRating(tutorId) {
        const tutor = this.storage.getTutorById(tutorId);
        return tutor ? tutor.rating : 0;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Format time for display
    formatTime(timeString) {
        return timeString;
    }

    // Check if session is available for enrollment
    isSessionAvailable(sessionId) {
        const session = this.storage.getSessionById(sessionId);
        if (!session) return false;
        return session.currentStudents < session.maxStudents && session.status === 'upcoming';
    }

    // Favorites Management
    addFavorite(studentId, tutorId) {
        const result = this.storage.addFavorite(studentId, tutorId);
        if (result) {
            return { success: true, message: 'Tutor added to favorites!' };
        }
        return { success: false, message: 'Already in favorites' };
    }

    removeFavorite(studentId, tutorId) {
        this.storage.removeFavorite(studentId, tutorId);
        return { success: true, message: 'Removed from favorites' };
    }

    isFavorite(studentId, tutorId) {
        return this.storage.isFavorite(studentId, tutorId);
    }

    getFavoriteTutors(studentId) {
        const favorites = this.storage.getUserFavorites(studentId);
        return favorites.map(fav => {
            const tutor = this.storage.getTutorById(fav.tutorId);
            return {
                ...tutor,
                favoritedAt: fav.createdAt
            };
        });
    }

    // Reviews Management
    addReview(studentId, tutorId, rating, comment) {
        try {
            // Check if already reviewed
            if (this.storage.hasUserReviewedTutor(studentId, tutorId)) {
                return { success: false, message: 'You have already reviewed this tutor' };
            }

            // Check if student has completed a session with this tutor
            const enrollments = this.storage.getEnrollmentsByStudent(studentId);
            const hasCompletedSession = enrollments.some(e => {
                const session = this.storage.getSessionById(e.sessionId);
                return session && session.tutorId === tutorId && session.status === 'completed';
            });

            if (!hasCompletedSession) {
                return { success: false, message: 'You must complete a session with this tutor before reviewing' };
            }

            const student = this.storage.getUserById(studentId);
            const review = this.storage.addReview({
                userId: studentId,
                userName: student.name,
                tutorId: tutorId,
                rating: rating,
                comment: comment
            });

            // Notify tutor
            const tutor = this.storage.getTutorById(tutorId);
            if (tutor && tutor.userId) {
                this.storage.addNotification({
                    userId: tutor.userId,
                    type: 'review',
                    title: 'New Review Received',
                    message: `${student.name} left you a ${rating}-star review`,
                    relatedId: review.id
                });
            }

            return { success: true, message: 'Review submitted successfully!', review: review };
        } catch (error) {
            console.error('Review error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    getTutorReviews(tutorId) {
        return this.storage.getTutorReviews(tutorId);
    }

    hasReviewedTutor(studentId, tutorId) {
        return this.storage.hasUserReviewedTutor(studentId, tutorId);
    }

    canReviewTutor(studentId, tutorId) {
        // Check if has completed session and hasn't reviewed
        const enrollments = this.storage.getEnrollmentsByStudent(studentId);
        const hasCompletedSession = enrollments.some(e => {
            const session = this.storage.getSessionById(e.sessionId);
            return session && session.tutorId === tutorId && session.status === 'completed';
        });

        const hasReviewed = this.hasReviewedTutor(studentId, tutorId);
        
        return hasCompletedSession && !hasReviewed;
    }
}

// Initialize student manager
const studentManager = new StudentManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentManager;
}