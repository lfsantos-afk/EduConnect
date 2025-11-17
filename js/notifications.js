// educonnect/js/notifications.js

/**
 * Toast notification system for EduConnect
 * Provides user feedback for actions
 */

const Notifications = {
    // Show success notification
    success(message) {
        this.show(message, 'success');
    },

    // Show error notification
    error(message) {
        this.show(message, 'error');
    },

    // Show info notification
    info(message) {
        this.show(message, 'info');
    },

    // Show warning notification
    warning(message) {
        this.show(message, 'warning');
    },

    // Core notification display function
    show(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-message">${message}</span>
        `;
        
        // Add to document
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },

    // Confirm dialog
    confirm(message, callback) {
        const result = window.confirm(message);
        if (callback) {
            callback(result);
        }
        return result;
    },

    // Loading state
    showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// Add notification styles dynamically
const notificationStyles = `
<style>
    #notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    }

    .notification {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-icon {
        font-size: 20px;
        font-weight: bold;
    }

    .notification-message {
        flex: 1;
    }

    .notification-success {
        background: #dcfce7;
        color: #16a34a;
        border-left: 4px solid #16a34a;
    }

    .notification-error {
        background: #fee2e2;
        color: #dc2626;
        border-left: 4px solid #dc2626;
    }

    .notification-info {
        background: #dbeafe;
        color: #2563eb;
        border-left: 4px solid #2563eb;
    }

    .notification-warning {
        background: #fef3c7;
        color: #d97706;
        border-left: 4px solid #d97706;
    }

    #loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .loading-spinner {
        background: white;
        padding: 32px;
        border-radius: 12px;
        text-align: center;
    }

    .loading-spinner .spinner {
        border: 4px solid #f3f4f6;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }

    .loading-spinner p {
        margin: 0;
        color: #374151;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        #notification-container {
            left: 20px;
            right: 20px;
            max-width: none;
        }
    }
</style>
`;

// Inject styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', notificationStyles);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notifications;
}