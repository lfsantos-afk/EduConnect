// Student Functions with Supabase

class StudentManager {
    constructor() {
        this.db = db;
    }

    // Get all available tutors
    async getAllTutors() {
        try {
            return await this.db.getTutors();
        } catch (error) {
            console.error('Error getting tutors:', error);
            return [];
        }
    }

    // Filter tutors by subject
    filterTutorsBySubject(tutors, subject) {
        if (!subject || subject === 'all') {
            return tutors;
        }
        return tutors.filter(tutor => 
            tutor.subjects && tutor.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
        );
    }

    // Search tutors
    searchTutors(tutors, query) {
        const lowerQuery = query.toLowerCase();
        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(lowerQuery) ||
            (tutor.description && tutor.description.toLowerCase().includes(lowerQuery)) ||
            (tutor.subjects && tutor.subjects.some(s => s.toLowerCase().includes(lowerQuery)))
        );
    }

    // Get tutor details
    async getTutorDetails(tutorId) {
        try {
            return await this.db.getTutorById(tutorId);
        } catch (error) {
            console.error('Error getting tutor details:', error);
            return null;
        }
    }

    // Get available sessions
    async getAllSessions() {
        try {
            const sessions = await this.db.getSessions();
            return sessions.filter(s => s.status === 'upcoming');
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }

    // Get sessions by tutor
    async getSessionsByTutor(tutorId) {
        try {
            const sessions = await this.db.getSessionsByTutor(tutorId);
            return sessions.filter(s => s.status === 'upcoming');
        } catch (error) {
            console.error('Error getting tutor sessions:', error);
            return [];
        }
    }

    // Enroll in a session
    async enrollInSession(studentId, sessionId) {
        try {
            const session = await this.db.getSessionById(sessionId);
            
            if (!session) {
                return { success: false, message: 'Session not found' };
            }

            // Check if already enrolled
            const existingEnrollments = await this.db.getEnrollmentsBySession(sessionId);
            const alreadyEnrolled = existingEnrollments.some(e => e.student_id === studentId);
            
            if (alreadyEnrolled) {
                return { success: false, message: 'You are already enrolled in this session' };
            }

            // Check if session is full
            if (session.current_students >= session.max_students) {
                return { success: false, message: 'This session is full' };
            }

            // Create enrollment
            const enrollment = await this.db.createEnrollment({
                student_id: studentId,
                session_id: sessionId,
                tutor_id: session.tutor_id,
                status: 'active',
                enrolled_at: new Date().toISOString()
            });

            // Update session student count
            await this.db.updateSession(sessionId, {
                current_students: session.current_students + 1
            });

            // Create notification for tutor
            const student = await this.db.getUserById(studentId);
            const tutor = await this.db.getTutorById(session.tutor_id);
            if (tutor && tutor.user_id) {
                await this.db.createNotification({
                    user_id: tutor.user_id,
                    type: 'enrollment',
                    title: 'New Student Enrolled',
                    message: `${student.name} has enrolled in your "${session.title}" session`,
                    related_id: sessionId,
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            return { 
                success: true, 
                message: 'Successfully enrolled in session!',
                enrollment: enrollment 
            };
        } catch (error) {
            console.error('Enrollment error:', error);
            return { success: false, message: 'An error occurred during enrollment: ' + error.message };
        }
    }

    // Get student's enrollments
    async getMyEnrollments(studentId) {
        try {
            return await this.db.getEnrollmentsByStudent(studentId);
        } catch (error) {
            console.error('Error getting enrollments:', error);
            return [];
        }
    }

    // Get all resources
    async getAllResources() {
        try {
            return await this.db.getResources();
        } catch (error) {
            console.error('Error getting resources:', error);
            return [];
        }
    }

    // Filter resources by subject
    filterResourcesBySubject(resources, subject) {
        if (!subject || subject === 'all') {
            return resources;
        }
        return resources.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
    }

    // Search resources
    searchResources(resources, query) {
        const lowerQuery = query.toLowerCase();
        return resources.filter(r => 
            r.title.toLowerCase().includes(lowerQuery) ||
            r.description.toLowerCase().includes(lowerQuery) ||
            r.subject.toLowerCase().includes(lowerQuery) ||
            r.author_name.toLowerCase().includes(lowerQuery)
        );
    }

    // Upload resource with real file
    async uploadResource(studentId, resourceData, file) {
        try {
            // Validate file type
            if (!validateFile(file, resourceData.file_type)) {
                return { 
                    success: false, 
                    message: `File type mismatch! Expected ${resourceData.file_type} file, but got ${file.type}. Please select the correct file type.` 
                };
            }

            const student = await this.db.getUserById(studentId);
            
            // Upload file to Supabase Storage
            const uploadResult = await this.db.uploadFile(file, 'resources');
            
            // Create resource record
            const resource = await this.db.createResource({
                author_id: studentId,
                author_name: student.name,
                title: resourceData.title,
                description: resourceData.description,
                subject: resourceData.subject,
                file_type: resourceData.file_type,
                file_name: file.name,
                file_path: uploadResult.path,
                file_url: uploadResult.url,
                views: 0,
                downloads: 0,
                uploaded_at: new Date().toISOString()
            });

            return { 
                success: true, 
                message: 'Resource uploaded successfully!',
                resource: resource 
            };
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, message: 'An error occurred during upload: ' + error.message };
        }
    }

    // Download resource
    async downloadResource(resourceId) {
        try {
            await this.db.incrementResourceDownloads(resourceId);
            const resource = await this.db.getResources();
            return resource.find(r => r.id === resourceId);
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }

    // View resource (increment view count)
    async viewResource(resourceId) {
        try {
            await this.db.incrementResourceViews(resourceId);
        } catch (error) {
            console.error('View error:', error);
        }
    }

    // Send message to tutor
    async sendMessage(studentId, tutorUserId, message) {
        try {
            const msg = await this.db.sendMessage({
                sender_id: studentId,
                receiver_id: tutorUserId,
                message: message,
                read: false,
                sent_at: new Date().toISOString()
            });

            // Create notification
            await this.db.createNotification({
                user_id: tutorUserId,
                type: 'message',
                title: 'New Message',
                message: 'You have a new message',
                related_id: studentId,
                read: false,
                created_at: new Date().toISOString()
            });

            return msg;
        } catch (error) {
            console.error('Message error:', error);
            return null;
        }
    }

    // Get conversations
    async getConversations(studentId) {
        try {
            const conversations = await this.db.getConversations(studentId);
            return await Promise.all(conversations.map(async conv => {
                const otherId = conv.sender_id === studentId ? conv.receiver_id : conv.sender_id;
                const otherUser = await this.db.getUserById(otherId);
                return {
                    ...conv,
                    otherUser: otherUser,
                    unread: !conv.read && conv.receiver_id === studentId
                };
            }));
        } catch (error) {
            console.error('Error getting conversations:', error);
            return [];
        }
    }

    // Get conversation with specific tutor
    async getConversation(studentId, tutorUserId) {
        try {
            return await this.db.getConversation(studentId, tutorUserId);
        } catch (error) {
            console.error('Error getting conversation:', error);
            return [];
        }
    }

    // Mark messages as read
    async markMessagesAsRead(studentId, tutorUserId) {
        try {
            await this.db.markMessagesAsRead(studentId, tutorUserId);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Get notifications
    async getNotifications(studentId) {
        try {
            return await this.db.getUserNotifications(studentId);
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    // Get unread notifications count
    async getUnreadNotificationsCount(studentId) {
        try {
            const unread = await this.db.getUnreadNotifications(studentId);
            return unread.length;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            await this.db.markNotificationAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all notifications as read
    async markAllNotificationsAsRead(studentId) {
        try {
            await this.db.markAllNotificationsAsRead(studentId);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    // Get unique subjects from all tutors
    getAllSubjects(tutors) {
        const subjects = new Set();
        tutors.forEach(tutor => {
            if (tutor.subjects) {
                tutor.subjects.forEach(subject => subjects.add(subject));
            }
        });
        return Array.from(subjects).sort();
    }

    // Favorites Management
    async addFavorite(studentId, tutorId) {
        try {
            const result = await this.db.addFavorite(studentId, tutorId);
            if (result) {
                return { success: true, message: 'Tutor added to favorites!' };
            }
            return { success: false, message: 'Already in favorites' };
        } catch (error) {
            console.error('Error adding favorite:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    async removeFavorite(studentId, tutorId) {
        try {
            await this.db.removeFavorite(studentId, tutorId);
            return { success: true, message: 'Removed from favorites' };
        } catch (error) {
            console.error('Error removing favorite:', error);
            return { success: false, message: 'An error occurred' };
        }
    }

    async isFavorite(studentId, tutorId) {
        try {
            return await this.db.isFavorite(studentId, tutorId);
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    async getFavoriteTutors(studentId) {
        try {
            const favorites = await this.db.getUserFavorites(studentId);
            return favorites.map(fav => ({
                ...fav.tutors,
                favorited_at: fav.created_at
            }));
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    // Reviews Management
    async addReview(studentId, tutorId, rating, comment) {
        try {
            // Check if already reviewed
            const hasReviewed = await this.db.hasUserReviewedTutor(studentId, tutorId);
            if (hasReviewed) {
                return { success: false, message: 'You have already reviewed this tutor' };
            }

            // Check if student has completed a session with this tutor
            const enrollments = await this.db.getEnrollmentsByStudent(studentId);
            const hasCompletedSession = enrollments.some(e => {
                return e.sessions && e.sessions.tutor_id === tutorId && e.sessions.status === 'completed';
            });

            if (!hasCompletedSession) {
                return { success: false, message: 'You must complete a session with this tutor before reviewing' };
            }

            const student = await this.db.getUserById(studentId);
            const review = await this.db.createReview({
                user_id: studentId,
                user_name: student.name,
                tutor_id: tutorId,
                rating: rating,
                comment: comment,
                created_at: new Date().toISOString()
            });

            // Notify tutor
            const tutor = await this.db.getTutorById(tutorId);
            if (tutor && tutor.user_id) {
                await this.db.createNotification({
                    user_id: tutor.user_id,
                    type: 'review',
                    title: 'New Review Received',
                    message: `${student.name} left you a ${rating}-star review`,
                    related_id: review.id,
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            return { success: true, message: 'Review submitted successfully!', review: review };
        } catch (error) {
            console.error('Review error:', error);
            return { success: false, message: 'An error occurred: ' + error.message };
        }
    }

    async getTutorReviews(tutorId) {
        try {
            return await this.db.getTutorReviews(tutorId);
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    async hasReviewedTutor(studentId, tutorId) {
        try {
            return await this.db.hasUserReviewedTutor(studentId, tutorId);
        } catch (error) {
            console.error('Error checking review:', error);
            return false;
        }
    }

    async canReviewTutor(studentId, tutorId) {
        try {
            const enrollments = await this.db.getEnrollmentsByStudent(studentId);
            const hasCompletedSession = enrollments.some(e => {
                return e.sessions && e.sessions.tutor_id === tutorId && e.sessions.status === 'completed';
            });

            const hasReviewed = await this.hasReviewedTutor(studentId, tutorId);
            
            return hasCompletedSession && !hasReviewed;
        } catch (error) {
            console.error('Error checking can review:', error);
            return false;
        }
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
    async isSessionAvailable(sessionId) {
        try {
            const session = await this.db.getSessionById(sessionId);
            if (!session) return false;
            return session.current_students < session.max_students && session.status === 'upcoming';
        } catch (error) {
            console.error('Error checking availability:', error);
            return false;
        }
    }
}

// Initialize student manager
const studentManager = new StudentManager();