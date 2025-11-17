// Firebase Storage Management System
class FirebaseStorage {
    constructor() {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.auth = firebase.auth();
    }

    // Users Management
    async addUser(userData) {
        try {
            const userRef = await this.db.collection('users').add({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: userRef.id, ...userData };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const snapshot = await this.db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();
            
            if (snapshot.empty) return null;
            
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async getUserById(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async updateUser(userId, updates) {
        try {
            await this.db.collection('users').doc(userId).update(updates);
            return await this.getUserById(userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Tutors Management
    async addTutor(tutorData) {
        try {
            const tutorRef = await this.db.collection('tutors').add({
                ...tutorData,
                rating: 5.0,
                totalStudents: 0,
                totalReviews: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: tutorRef.id, ...tutorData };
        } catch (error) {
            console.error('Error adding tutor:', error);
            throw error;
        }
    }

    async getTutors() {
        try {
            const snapshot = await this.db.collection('tutors').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting tutors:', error);
            return [];
        }
    }

    async getTutorById(tutorId) {
        try {
            const doc = await this.db.collection('tutors').doc(tutorId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error getting tutor:', error);
            return null;
        }
    }

    async getTutorByUserId(userId) {
        try {
            const snapshot = await this.db.collection('tutors')
                .where('userId', '==', userId)
                .limit(1)
                .get();
            
            if (snapshot.empty) return null;
            
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error getting tutor:', error);
            return null;
        }
    }

    async updateTutor(tutorId, updates) {
        try {
            await this.db.collection('tutors').doc(tutorId).update(updates);
            return await this.getTutorById(tutorId);
        } catch (error) {
            console.error('Error updating tutor:', error);
            throw error;
        }
    }

    // Sessions Management
    async addSession(sessionData) {
        try {
            const sessionRef = await this.db.collection('sessions').add({
                ...sessionData,
                currentStudents: 0,
                status: 'upcoming',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: sessionRef.id, ...sessionData };
        } catch (error) {
            console.error('Error adding session:', error);
            throw error;
        }
    }

    async getSessions() {
        try {
            const snapshot = await this.db.collection('sessions')
                .orderBy('date', 'asc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }

    async getSessionById(sessionId) {
        try {
            const doc = await this.db.collection('sessions').doc(sessionId).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    async getSessionsByTutor(tutorId) {
        try {
            const snapshot = await this.db.collection('sessions')
                .where('tutorId', '==', tutorId)
                .orderBy('date', 'asc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }

    async updateSession(sessionId, updates) {
        try {
            await this.db.collection('sessions').doc(sessionId).update(updates);
            return await this.getSessionById(sessionId);
        } catch (error) {
            console.error('Error updating session:', error);
            throw error;
        }
    }

    async deleteSession(sessionId) {
        try {
            await this.db.collection('sessions').doc(sessionId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }

    // Enrollments Management
    async addEnrollment(enrollmentData) {
        try {
            const enrollmentRef = await this.db.collection('enrollments').add({
                ...enrollmentData,
                status: 'active',
                enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: enrollmentRef.id, ...enrollmentData };
        } catch (error) {
            console.error('Error adding enrollment:', error);
            throw error;
        }
    }

    async getEnrollmentsByStudent(studentId) {
        try {
            const snapshot = await this.db.collection('enrollments')
                .where('studentId', '==', studentId)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting enrollments:', error);
            return [];
        }
    }

    async getEnrollmentsBySession(sessionId) {
        try {
            const snapshot = await this.db.collection('enrollments')
                .where('sessionId', '==', sessionId)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting enrollments:', error);
            return [];
        }
    }

    // Resources Management with File Upload
    async uploadResourceFile(file, metadata) {
        try {
            // Validate file type
            const allowedTypes = {
                'PDF': ['application/pdf'],
                'DOC': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                'PPT': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
                'XLS': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                'Video': ['video/mp4', 'video/mpeg', 'video/quicktime'],
                'Other': []
            };

            const selectedType = metadata.fileType;
            const actualType = file.type;

            if (selectedType !== 'Other' && allowedTypes[selectedType]) {
                if (!allowedTypes[selectedType].includes(actualType)) {
                    throw new Error(`File type mismatch. Selected ${selectedType} but uploaded ${actualType}`);
                }
            }

            // Create unique filename
            const timestamp = Date.now();
            const filename = `${timestamp}_${file.name}`;
            const storageRef = this.storage.ref(`resources/${filename}`);

            // Upload file
            const uploadTask = await storageRef.put(file, {
                contentType: file.type,
                customMetadata: {
                    authorId: metadata.authorId,
                    subject: metadata.subject
                }
            });

            // Get download URL
            const downloadURL = await uploadTask.ref.getDownloadURL();

            // Save metadata to Firestore
            const resourceRef = await this.db.collection('resources').add({
                authorId: metadata.authorId,
                authorName: metadata.authorName,
                title: metadata.title,
                description: metadata.description,
                subject: metadata.subject,
                fileType: metadata.fileType,
                fileName: file.name,
                fileSize: file.size,
                downloadURL: downloadURL,
                storagePath: uploadTask.ref.fullPath,
                views: 0,
                downloads: 0,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { 
                id: resourceRef.id, 
                downloadURL,
                ...metadata 
            };
        } catch (error) {
            console.error('Error uploading resource:', error);
            throw error;
        }
    }

    async getResources() {
        try {
            const snapshot = await this.db.collection('resources')
                .orderBy('uploadedAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting resources:', error);
            return [];
        }
    }

    async deleteResource(resourceId) {
        try {
            // Get resource data to delete file from storage
            const doc = await this.db.collection('resources').doc(resourceId).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.storagePath) {
                    // Delete file from storage
                    const fileRef = this.storage.ref(data.storagePath);
                    await fileRef.delete();
                }
            }
            
            // Delete from Firestore
            await this.db.collection('resources').doc(resourceId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting resource:', error);
            throw error;
        }
    }

    async incrementResourceViews(resourceId) {
        try {
            await this.db.collection('resources').doc(resourceId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }

    async incrementResourceDownloads(resourceId) {
        try {
            await this.db.collection('resources').doc(resourceId).update({
                downloads: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing downloads:', error);
        }
    }

    // Messages Management (Real-time)
    async sendMessage(messageData) {
        try {
            const messageRef = await this.db.collection('messages').add({
                ...messageData,
                read: false,
                sentAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Create notification for receiver
            await this.addNotification({
                userId: messageData.receiverId,
                type: 'message',
                title: 'New Message',
                message: 'You have a new message',
                relatedId: messageData.senderId
            });
            
            return { id: messageRef.id, ...messageData };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async getConversation(user1Id, user2Id) {
        try {
            const snapshot = await this.db.collection('messages')
                .where('senderId', 'in', [user1Id, user2Id])
                .orderBy('sentAt', 'asc')
                .get();
            
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(msg => 
                    (msg.senderId === user1Id && msg.receiverId === user2Id) ||
                    (msg.senderId === user2Id && msg.receiverId === user1Id)
                );
        } catch (error) {
            console.error('Error getting conversation:', error);
            return [];
        }
    }

    async markMessagesAsRead(user1Id, user2Id) {
        try {
            const snapshot = await this.db.collection('messages')
                .where('senderId', '==', user2Id)
                .where('receiverId', '==', user1Id)
                .where('read', '==', false)
                .get();
            
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });
            
            await batch.commit();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    // Notifications Management
    async addNotification(notificationData) {
        try {
            const notifRef = await this.db.collection('notifications').add({
                ...notificationData,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: notifRef.id, ...notificationData };
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    }

    async getUserNotifications(userId) {
        try {
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).update({
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Reviews Management
    async addReview(reviewData) {
        try {
            const reviewRef = await this.db.collection('reviews').add({
                ...reviewData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update tutor rating
            await this.updateTutorRating(reviewData.tutorId);
            
            return { id: reviewRef.id, ...reviewData };
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    }

    async getTutorReviews(tutorId) {
        try {
            const snapshot = await this.db.collection('reviews')
                .where('tutorId', '==', tutorId)
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    async updateTutorRating(tutorId) {
        try {
            const reviews = await this.getTutorReviews(tutorId);
            if (reviews.length === 0) return;
            
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            await this.updateTutor(tutorId, {
                rating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews.length
            });
        } catch (error) {
            console.error('Error updating tutor rating:', error);
        }
    }

    async hasUserReviewedTutor(userId, tutorId) {
        try {
            const snapshot = await this.db.collection('reviews')
                .where('userId', '==', userId)
                .where('tutorId', '==', tutorId)
                .limit(1)
                .get();
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking review:', error);
            return false;
        }
    }

    // Favorites Management
    async addFavorite(userId, tutorId) {
        try {
            // Check if already exists
            const exists = await this.isFavorite(userId, tutorId);
            if (exists) return null;
            
            const favRef = await this.db.collection('favorites').add({
                userId,
                tutorId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: favRef.id, userId, tutorId };
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    async removeFavorite(userId, tutorId) {
        try {
            const snapshot = await this.db.collection('favorites')
                .where('userId', '==', userId)
                .where('tutorId', '==', tutorId)
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
            }
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    async isFavorite(userId, tutorId) {
        try {
            const snapshot = await this.db.collection('favorites')
                .where('userId', '==', userId)
                .where('tutorId', '==', tutorId)
                .limit(1)
                .get();
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    async getUserFavorites(userId) {
        try {
            const snapshot = await this.db.collection('favorites')
                .where('userId', '==', userId)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    async getTutorFavoritesCount(tutorId) {
        try {
            const snapshot = await this.db.collection('favorites')
                .where('tutorId', '==', tutorId)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting favorites count:', error);
            return 0;
        }
    }

    // Session Management (Current User)
    setCurrentUser(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    getCurrentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    logout() {
        sessionStorage.removeItem('currentUser');
        firebase.auth().signOut();
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

// Initialize storage
const storage = new FirebaseStorage();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseStorage;
}