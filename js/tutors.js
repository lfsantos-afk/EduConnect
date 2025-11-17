// Tutor Functions

class TutorManager {
    constructor() {
        this.storage = storage;
    }

    // Get tutor profile by user ID
    getTutorProfile(userId) {
        return this.storage.getTutorByUserId(userId);
    }

    // Update tutor profile
    updateProfile(userId, updates) {
        try {
            const tutor = this.storage.getTutorByUserId(userId);
            if (!tutor) {
                return { success: false, message: 'Tutor profile not found' };
            }

            const updatedTutor = this.storage.updateTutor(tutor.id, updates);
            
            return { 
                success: true, 
                message: 'Profile updated successfully!',
                tutor: updatedTutor 
            };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // Create new session
    createSession(userId, sessionData) {
        try {
            const tutor = this.storage.getTutorByUserId(userId);
            if (!tutor) {
                return { success: false, message: 'Tutor profile not found' };
            }

            const session = this.storage.addSession({
                tutorId: tutor.id,
                title: sessionData.title,
                subject: sessionData.subject,
                description: sessionData.description,
                date: sessionData.date,
                time: sessionData.time,
                duration: sessionData.duration,
                maxStudents: parseInt(sessionData.maxStudents),
                currentStudents: 0,
                status: 'upcoming'
            });

            return { 
                success: true, 
                message: 'Session created successfully!',
                session: session 
            };
        } catch (error) {
            console.error('Session creation error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // Get tutor's sessions
    getMySessions(userId) {
        const tutor = this.storage.getTutorByUserId(userId);
        if (!tutor) return [];
        
        const sessions = this.storage.getSessionsByTutor(tutor.id);
        return sessions.map(session => {
            const enrollments = this.storage.getEnrollmentsBySession(session.id);
            return {
                ...session,
                enrollments: enrollments,
                enrollmentCount: enrollments.length
            };
        });
    }

    // Update session
    updateSession(sessionId, updates) {
        try {
            const updatedSession = this.storage.updateSession(sessionId, updates);
            if (!updatedSession) {
                return { success: false, message: 'Session not found' };
            }

            return { 
                success: true, 
                message: 'Session updated successfully!',
                session: updatedSession 
            };
        } catch (error) {
            console.error('Session update error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // Delete session
    deleteSession(sessionId) {
        try {
            // Get enrollments for this session
            const enrollments = this.storage.getEnrollmentsBySession(sessionId);
            
            // Notify all enrolled students
            enrollments.forEach(enrollment => {
                const session = this.storage.getSessionById(sessionId);
                this.storage.addNotification({
                    userId: enrollment.studentId,
                    type: 'session_cancelled',
                    title: 'Session Cancelled',
                    message: `The session "${session.title}" has been cancelled by the tutor`,
                    relatedId: sessionId
                });
            });

            this.storage.deleteSession(sessionId);

            return { 
                success: true, 
                message: 'Session deleted successfully!' 
            };
        } catch (error) {
            console.error('Session deletion error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // Get students enrolled in a session
    getSessionStudents(sessionId) {
        const enrollments = this.storage.getEnrollmentsBySession(sessionId);
        return enrollments.map(enrollment => {
            const student = this.storage.getUserById(enrollment.studentId);
            return {
                ...enrollment,
                student: student
            };
        });
    }

    // Get all students (for tutor to view)
    getAllStudents(userId) {
        const tutor = this.storage.getTutorByUserId(userId);
        if (!tutor) return [];

        const sessions = this.storage.getSessionsByTutor(tutor.id);
        const studentIds = new Set();
        const students = [];

        sessions.forEach(session => {
            const enrollments = this.storage.getEnrollmentsBySession(session.id);
            enrollments.forEach(enrollment => {
                if (!studentIds.has(enrollment.studentId)) {
                    studentIds.add(enrollment.studentId);
                    const student = this.storage.getUserById(enrollment.studentId);
                    if (student) {
                        students.push({
                            ...student,
                            enrollmentDate: enrollment.enrolledAt,
                            sessionTitle: session.title
                        });
                    }
                }
            });
        });

        return students;
    }

    // Upload resource
    uploadResource(userId, resourceData) {
        try {
            const tutor = this.storage.getTutorByUserId(userId);
            if (!tutor) {
                return { success: false, message: 'Tutor profile not found' };
            }

            const resource = this.storage.addResource({
                authorId: userId,
                authorName: tutor.name,
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
            return { success: false, message: 'An error occurred' };
        }
    }

    // Get tutor's resources
    getMyResources(userId) {
        const resources = this.storage.getResources();
        return resources.filter(r => r.authorId === userId)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }

    // Delete resource
    deleteResource(resourceId) {
        try {
            this.storage.deleteResource(resourceId);
            return { 
                success: true, 
                message: 'Resource deleted successfully!' 
            };
        } catch (error) {
            console.error('Resource deletion error:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    // Send message to student
    sendMessage(tutorUserId, studentId, message) {
        return this.storage.sendMessage({
            senderId: tutorUserId,
            receiverId: studentId,
            message: message
        });
    }

    // Get conversations
    getConversations(tutorUserId) {
        const conversations = this.storage.getConversations(tutorUserId);
        return conversations.map(conv => {
            const otherId = conv.senderId === tutorUserId ? conv.receiverId : conv.senderId;
            const otherUser = this.storage.getUserById(otherId);
            return {
                ...conv,
                otherUser: otherUser,
                unread: !conv.read && conv.receiverId === tutorUserId
            };
        });
    }

    // Get conversation with specific student
    getConversation(tutorUserId, studentId) {
        return this.storage.getConversation(tutorUserId, studentId);
    }

    // Mark messages as read
    markMessagesAsRead(tutorUserId, studentId) {
        this.storage.markMessagesAsRead(tutorUserId, studentId);
    }

    // Get notifications
    getNotifications(tutorUserId) {
        return this.storage.getUserNotifications(tutorUserId);
    }

    // Get unread notifications count
    getUnreadNotificationsCount(tutorUserId) {
        return this.storage.getUnreadNotifications(tutorUserId).length;
    }

    // Mark notification as read
    markNotificationAsRead(notificationId) {
        this.storage.markNotificationAsRead(notificationId);
    }

    // Mark all notifications as read
    markAllNotificationsAsRead(tutorUserId) {
        this.storage.markAllNotificationsAsRead(tutorUserId);
    }

    // Get statistics
    getStatistics(userId) {
        const tutor = this.storage.getTutorByUserId(userId);
        if (!tutor) return null;

        const sessions = this.storage.getSessionsByTutor(tutor.id);
        const allEnrollments = [];
        sessions.forEach(session => {
            const enrollments = this.storage.getEnrollmentsBySession(session.id);
            allEnrollments.push(...enrollments);
        });

        const uniqueStudents = new Set(allEnrollments.map(e => e.studentId));
        const resources = this.getMyResources(userId);
        const totalViews = resources.reduce((sum, r) => sum + r.views, 0);
        const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0);

        return {
            totalSessions: sessions.length,
            upcomingSessions: sessions.filter(s => s.status === 'upcoming').length,
            totalStudents: uniqueStudents.size,
            totalEnrollments: allEnrollments.length,
            totalResources: resources.length,
            totalResourceViews: totalViews,
            totalResourceDownloads: totalDownloads,
            rating: tutor.rating
        };
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

    // Get upcoming sessions
    getUpcomingSessions(userId) {
        const sessions = this.getMySessions(userId);
        const now = new Date();
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= now && session.status === 'upcoming';
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Get past sessions
    getPastSessions(userId) {
        const sessions = this.getMySessions(userId);
        const now = new Date();
        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate < now || session.status === 'completed';
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Mark session as completed
    completeSession(sessionId) {
        return this.updateSession(sessionId, { status: 'completed' });
    }

    // Get session availability
    getSessionAvailability(sessionId) {
        const session = this.storage.getSessionById(sessionId);
        if (!session) return null;
        
        return {
            available: session.maxStudents - session.currentStudents,
            total: session.maxStudents,
            percentage: (session.currentStudents / session.maxStudents) * 100
        };
    }

    // Reviews Management
    getMyReviews(userId) {
        const tutor = this.storage.getTutorByUserId(userId);
        if (!tutor) return [];
        
        return this.storage.getTutorReviews(tutor.id);
    }

    getReviewsStatistics(userId) {
        const reviews = this.getMyReviews(userId);
        
        if (reviews.length === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            };
        }

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            distribution[review.rating]++;
        });

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        return {
            totalReviews: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10,
            distribution: distribution
        };
    }

    getFavoritesCount(userId) {
        const tutor = this.storage.getTutorByUserId(userId);
        if (!tutor) return 0;
        
        return this.storage.getTutorFavoritesCount(tutor.id);
    }
}

// Initialize tutor manager
const tutorManager = new TutorManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorManager;
}