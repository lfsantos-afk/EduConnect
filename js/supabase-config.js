// Supabase Configuration
// Replace these with your actual Supabase credentials

const SUPABASE_URL = 'https://lryhkxyykjzgyhchreqi.supabase.co'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyeWhreHl5a2p6Z3loY2hyZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTc1OTQsImV4cCI6MjA3ODk3MzU5NH0.pUSGsAWjEQgM3sb_ennT1aISYMolhanoPxNLk-ssKIA';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database Helper Functions
class SupabaseDB {
    constructor() {
        this.client = supabase;
    }

    // User Management
    async createUser(userData) {
        const { data, error } = await this.client
            .from('users')
            .insert([{
                name: userData.name,
                email: userData.email,
                password: userData.password, // In production, use Supabase Auth
                role: userData.role,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserByEmail(email) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async getUserById(id) {
        const { data, error } = await this.client
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async updateUser(userId, updates) {
        const { data, error } = await this.client
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Tutor Management
    async createTutor(tutorData) {
        const { data, error } = await this.client
            .from('tutors')
            .insert([tutorData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getTutors() {
        const { data, error } = await this.client
            .from('tutors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getTutorById(id) {
        const { data, error } = await this.client
            .from('tutors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async getTutorByUserId(userId) {
        const { data, error } = await this.client
            .from('tutors')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async updateTutor(tutorId, updates) {
        const { data, error } = await this.client
            .from('tutors')
            .update(updates)
            .eq('id', tutorId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Sessions Management
    async createSession(sessionData) {
        const { data, error } = await this.client
            .from('sessions')
            .insert([sessionData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getSessions() {
        const { data, error } = await this.client
            .from('sessions')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getSessionById(id) {
        const { data, error } = await this.client
            .from('sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async getSessionsByTutor(tutorId) {
        const { data, error } = await this.client
            .from('sessions')
            .select('*')
            .eq('tutor_id', tutorId)
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async updateSession(sessionId, updates) {
        const { data, error } = await this.client
            .from('sessions')
            .update(updates)
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteSession(sessionId) {
        const { error } = await this.client
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
        return true;
    }

    // Enrollments Management
    async createEnrollment(enrollmentData) {
        const { data, error } = await this.client
            .from('enrollments')
            .insert([enrollmentData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getEnrollmentsByStudent(studentId) {
        const { data, error } = await this.client
            .from('enrollments')
            .select(`
                *,
                sessions(*),
                tutors(*)
            `)
            .eq('student_id', studentId);

        if (error) throw error;
        return data || [];
    }

    async getEnrollmentsBySession(sessionId) {
        const { data, error } = await this.client
            .from('enrollments')
            .select(`
                *,
                users(*)
            `)
            .eq('session_id', sessionId);

        if (error) throw error;
        return data || [];
    }

    // Resources Management with File Upload
    async uploadFile(file, folder = 'resources') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await this.client.storage
            .from('educonnect-files')
            .upload(filePath, file);

        if (error) throw error;
        
        const { data: publicURL } = this.client.storage
            .from('educonnect-files')
            .getPublicUrl(filePath);

        return {
            path: filePath,
            url: publicURL.publicUrl
        };
    }

    async deleteFile(filePath) {
        const { error } = await this.client.storage
            .from('educonnect-files')
            .remove([filePath]);

        if (error) throw error;
        return true;
    }

    async createResource(resourceData) {
        const { data, error } = await this.client
            .from('resources')
            .insert([resourceData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getResources() {
        const { data, error } = await this.client
            .from('resources')
            .select('*')
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async deleteResource(resourceId) {
        const { error } = await this.client
            .from('resources')
            .delete()
            .eq('id', resourceId);

        if (error) throw error;
        return true;
    }

    async incrementResourceViews(resourceId) {
        const { error } = await this.client.rpc('increment_views', { 
            resource_id: resourceId 
        });
        if (error) console.error('Error incrementing views:', error);
    }

    async incrementResourceDownloads(resourceId) {
        const { error } = await this.client.rpc('increment_downloads', { 
            resource_id: resourceId 
        });
        if (error) console.error('Error incrementing downloads:', error);
    }

    // Messages Management
    async sendMessage(messageData) {
        const { data, error } = await this.client
            .from('messages')
            .insert([messageData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getConversation(user1Id, user2Id) {
        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
            .order('sent_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getConversations(userId) {
        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const conversationsMap = new Map();
        (data || []).forEach(msg => {
            const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            if (!conversationsMap.has(otherId) || 
                new Date(msg.sent_at) > new Date(conversationsMap.get(otherId).sent_at)) {
                conversationsMap.set(otherId, msg);
            }
        });

        return Array.from(conversationsMap.values());
    }

    async markMessagesAsRead(currentUserId, otherUserId) {
        const { error } = await this.client
            .from('messages')
            .update({ read: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', currentUserId);

        if (error) throw error;
        return true;
    }

    // Notifications Management
    async createNotification(notificationData) {
        const { data, error } = await this.client
            .from('notifications')
            .insert([notificationData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getUserNotifications(userId) {
        const { data, error } = await this.client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getUnreadNotifications(userId) {
        const { data, error } = await this.client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return data || [];
    }

    async markNotificationAsRead(notificationId) {
        const { error } = await this.client
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    }

    async markAllNotificationsAsRead(userId) {
        const { error } = await this.client
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    }

    // Reviews Management
    async createReview(reviewData) {
        const { data, error } = await this.client
            .from('reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw error;

        // Update tutor rating
        await this.updateTutorRating(reviewData.tutor_id);

        return data;
    }

    async getTutorReviews(tutorId) {
        const { data, error } = await this.client
            .from('reviews')
            .select('*')
            .eq('tutor_id', tutorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async hasUserReviewedTutor(userId, tutorId) {
        const { data, error } = await this.client
            .from('reviews')
            .select('id')
            .eq('user_id', userId)
            .eq('tutor_id', tutorId)
            .single();

        return !!data;
    }

    async updateTutorRating(tutorId) {
        const reviews = await this.getTutorReviews(tutorId);
        if (reviews.length === 0) return;

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await this.updateTutor(tutorId, {
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: reviews.length
        });
    }

    // Favorites Management
    async addFavorite(userId, tutorId) {
        const { data, error } = await this.client
            .from('favorites')
            .insert([{
                user_id: userId,
                tutor_id: tutorId,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Duplicate
                return null;
            }
            throw error;
        }
        return data;
    }

    async removeFavorite(userId, tutorId) {
        const { error } = await this.client
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('tutor_id', tutorId);

        if (error) throw error;
        return true;
    }

    async getUserFavorites(userId) {
        const { data, error } = await this.client
            .from('favorites')
            .select(`
                *,
                tutors(*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }

    async isFavorite(userId, tutorId) {
        const { data, error } = await this.client
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('tutor_id', tutorId)
            .single();

        return !!data;
    }

    async getTutorFavoritesCount(tutorId) {
        const { count, error } = await this.client
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', tutorId);

        if (error) throw error;
        return count || 0;
    }

    // Session Management (Current User)
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    logout() {
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

// Initialize database
const db = new SupabaseDB();

// File validation helper
function validateFile(file, expectedType) {
    const typeMap = {
        'PDF': ['application/pdf'],
        'DOC': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'PPT': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        'XLS': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'Video': ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
        'Image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'Other': []
    };

    if (expectedType === 'Other') return true;

    const allowedTypes = typeMap[expectedType] || [];
    return allowedTypes.includes(file.type);
}