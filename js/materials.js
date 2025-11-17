// educonnect/js/materials.js - NEW FILE

/**
 * Materials Management Module
 * Handles educational materials display and management
 */

const MaterialsManager = {
    // ==================== DISPLAY MATERIALS ====================
    
    loadMaterials(containerId, filterOptions = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let materials = [];

        if (filterOptions.myMaterials) {
            materials = Auth.isStudent() ? 
                Students.getMyMaterials() : 
                Tutors.getMyMaterials();
        } else if (filterOptions.subject) {
            materials = Auth.isStudent() ?
                Students.getMaterialsBySubject(filterOptions.subject) :
                Storage.getMaterialsBySubject(filterOptions.subject);
        } else {
            materials = Storage.getPublicMaterials();
        }

        // Apply search filter
        if (filterOptions.search) {
            const searchTerm = filterOptions.search.toLowerCase();
            materials = materials.filter(m =>
                m.title.toLowerCase().includes(searchTerm) ||
                m.description.toLowerCase().includes(searchTerm) ||
                m.subject.toLowerCase().includes(searchTerm) ||
                m.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Apply type filter
        if (filterOptions.type && filterOptions.type !== 'all') {
            materials = materials.filter(m => m.type === filterOptions.type);
        }

        // Sort
        if (filterOptions.sortBy) {
            switch (filterOptions.sortBy) {
                case 'newest':
                    materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'popular':
                    materials.sort((a, b) => b.downloads - a.downloads);
                    break;
                case 'name':
                    materials.sort((a, b) => a.title.localeCompare(b.title));
                    break;
            }
        } else {
            materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (materials.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No materials found</h3>
                    <p>Try adjusting your filters or upload your first material</p>
                </div>
            `;
            return;
        }

        container.innerHTML = materials.map(material => this.createMaterialCard(material)).join('');
    },

    createMaterialCard(material) {
        const typeIcon = this.getTypeIcon(material.type);
        const isOwner = Auth.isAuthenticated() && material.uploadedBy === Auth.getCurrentUser().id;
        const visibilityBadge = material.isPublic ? 
            '<span class="badge badge-success">Public</span>' : 
            '<span class="badge badge-warning">Private</span>';

        return `
            <div class="card material-card" style="margin-bottom: 16px;">
                <div style="display: flex; gap: 16px;">
                    <div style="font-size: 48px; flex-shrink: 0;">${typeIcon}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${material.title}</h3>
                                <p style="font-size: 14px; color: var(--gray-600);">
                                    By ${material.uploaderName || 'Unknown'} • ${material.subject}
                                </p>
                            </div>
                            ${visibilityBadge}
                        </div>
                        
                        ${material.description ? `
                            <p style="color: var(--gray-600); font-size: 14px; margin-bottom: 12px;">${material.description}</p>
                        ` : ''}
                        
                        <div style="display: flex; flex-wrap: gap: 6px; margin-bottom: 12px;">
                            ${material.tags.map(tag => `
                                <span style="background: var(--gray-100); padding: 4px 10px; border-radius: 12px; font-size: 12px; color: var(--gray-700);">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--gray-200);">
                            <div style="font-size: 13px; color: var(--gray-500);">
                                📥 ${material.downloads} downloads • 💾 ${material.size}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                ${isOwner ? `
                                    <button onclick="MaterialsManager.editMaterial(${material.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 14px;">
                                        Edit
                                    </button>
                                    <button onclick="MaterialsManager.deleteMaterial(${material.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 14px;">
                                        Delete
                                    </button>
                                ` : ''}
                                <button onclick="MaterialsManager.downloadMaterial(${material.id})" class="btn btn-primary" style="padding: 6px 12px; font-size: 14px;">
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getTypeIcon(type) {
        const icons = {
            'PDF': '📄',
            'Document': '📝',
            'Presentation': '📊',
            'Spreadsheet': '📈',
            'Video': '🎥',
            'Audio': '🎵',
            'Image': '🖼️',
            'Archive': '🗜️',
            'Other': '📎'
        };
        return icons[type] || icons['Other'];
    },

    // ==================== UPLOAD MATERIAL ====================
    
    showUploadModal() {
        const modal = document.getElementById('uploadMaterialModal');
        if (!modal) {
            this.createUploadModal();
            return this.showUploadModal();
        }

        // Reset form
        document.getElementById('uploadMaterialForm').reset();
        document.getElementById('materialId').value = '';
        document.getElementById('uploadModalTitle').textContent = 'Upload Material';

        modal.classList.add('active');
    },

    createUploadModal() {
        const subjects = Auth.isStudent() ?
            Students.getAvailableSubjects() :
            (Tutors.getMyProfile()?.subjects || []);

        const modalHTML = `
            <div id="uploadMaterialModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title" id="uploadModalTitle">Upload Material</h3>
                        <button class="modal-close" onclick="MaterialsManager.closeUploadModal()">&times;</button>
                    </div>
                    <form id="uploadMaterialForm" onsubmit="MaterialsManager.submitMaterial(event)">
                        <input type="hidden" id="materialId">
                        
                        <div class="form-group">
                            <label class="form-label">Title *</label>
                            <input type="text" id="materialTitle" class="form-input" required placeholder="e.g. Calculus Cheat Sheet">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea id="materialDescription" class="form-textarea" rows="3" placeholder="Brief description of the material"></textarea>
                        </div>

                        <div class="grid grid-2">
                            <div class="form-group">
                                <label class="form-label">Subject *</label>
                                <select id="materialSubject" class="form-select" required>
                                    <option value="">Select subject</option>
                                    ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Type *</label>
                                <select id="materialType" class="form-select" required>
                                    <option value="">Select type</option>
                                    <option value="PDF">PDF</option>
                                    <option value="Document">Document</option>
                                    <option value="Presentation">Presentation</option>
                                    <option value="Spreadsheet">Spreadsheet</option>
                                    <option value="Video">Video</option>
                                    <option value="Audio">Audio</option>
                                    <option value="Image">Image</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Tags (comma separated)</label>
                            <input type="text" id="materialTags" class="form-input" placeholder="e.g. calculus, derivatives, integrals">
                            <p style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">Help others find your material with relevant tags</p>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="materialPublic" style="width: auto;">
                                <span>Make this material public (visible to all users)</span>
                            </label>
                        </div>

                        <div class="alert alert-info" style="font-size: 14px;">
                            <strong>Note:</strong> In this demo version, file upload is simulated. In a production environment, actual file upload would be implemented.
                        </div>

                        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                            <button type="button" onclick="MaterialsManager.closeUploadModal()" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Upload Material</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeUploadModal() {
        const modal = document.getElementById('uploadMaterialModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    submitMaterial(event) {
        event.preventDefault();

        const materialId = document.getElementById('materialId').value;
        const title = document.getElementById('materialTitle').value;
        const description = document.getElementById('materialDescription').value;
        const subject = document.getElementById('materialSubject').value;
        const type = document.getElementById('materialType').value;
        const tagsInput = document.getElementById('materialTags').value;
        const isPublic = document.getElementById('materialPublic').checked;

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        const materialData = {
            title,
            description,
            subject,
            type,
            isPublic,
            tags,
            fileUrl: '#' // In real app, this would be the uploaded file URL
        };

        let result;
        if (materialId) {
            // Update existing material
            result = Auth.isStudent() ?
                Students.updateMaterial(parseInt(materialId), materialData) :
                Tutors.updateMaterial(parseInt(materialId), materialData);
        } else {
            // Create new material
            result = Auth.isStudent() ?
                Students.uploadMaterial(materialData) :
                Tutors.uploadMaterial(materialData);
        }

        if (result.success) {
            alert(result.message);
            this.closeUploadModal();
            
            // Reload materials list
            if (document.getElementById('materialsList')) {
                this.loadMaterials('materialsList', { myMaterials: true });
            }
        } else {
            alert(result.message);
        }
    },

    // ==================== MATERIAL ACTIONS ====================
    
    editMaterial(materialId) {
        const material = Storage.getMaterialById(materialId);
        if (!material) {
            alert('Material not found');
            return;
        }

        // Check permission
        if (material.uploadedBy !== Auth.getCurrentUser().id) {
            alert('You do not have permission to edit this material');
            return;
        }

        // Open modal with material data
        this.showUploadModal();

        // Fill form
        document.getElementById('materialId').value = material.id;
        document.getElementById('uploadModalTitle').textContent = 'Edit Material';
        document.getElementById('materialTitle').value = material.title;
        document.getElementById('materialDescription').value = material.description || '';
        document.getElementById('materialSubject').value = material.subject;
        document.getElementById('materialType').value = material.type;
        document.getElementById('materialTags').value = material.tags.join(', ');
        document.getElementById('materialPublic').checked = material.isPublic;
    },

    deleteMaterial(materialId) {
        if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
            return;
        }

        const result = Auth.isStudent() ?
            Students.deleteMaterial(materialId) :
            Tutors.deleteMaterial(materialId);

        if (result.success) {
            alert(result.message);
            
            // Reload materials list
            if (document.getElementById('materialsList')) {
                this.loadMaterials('materialsList', { myMaterials: true });
            }
        } else {
            alert(result.message);
        }
    },

    downloadMaterial(materialId) {
        const result = Auth.isStudent() ?
            Students.downloadMaterial(materialId) :
            { success: false, message: 'Download not available' };

        if (result.success) {
            alert('Download started! In a real application, the file would be downloaded now.');
            
            // Reload to show updated download count
            if (document.getElementById('materialsList')) {
                const currentFilters = this.getCurrentFilters();
                this.loadMaterials('materialsList', currentFilters);
            }
        } else {
            alert(result.message);
        }
    },

    // ==================== FILTERS ====================
    
    applyFilters(containerId) {
        const search = document.getElementById('materialSearch')?.value || '';
        const subject = document.getElementById('materialSubjectFilter')?.value || '';
        const type = document.getElementById('materialTypeFilter')?.value || 'all';
        const sortBy = document.getElementById('materialSortBy')?.value || 'newest';
        const myMaterials = document.getElementById('showMyMaterials')?.checked || false;

        this.loadMaterials(containerId, {
            search,
            subject,
            type,
            sortBy,
            myMaterials
        });
    },

    getCurrentFilters() {
        return {
            search: document.getElementById('materialSearch')?.value || '',
            subject: document.getElementById('materialSubjectFilter')?.value || '',
            type: document.getElementById('materialTypeFilter')?.value || 'all',
            sortBy: document.getElementById('materialSortBy')?.value || 'newest',
            myMaterials: document.getElementById('showMyMaterials')?.checked || false
        };
    },

    // ==================== STATISTICS ====================
    
    getMaterialStats() {
        if (!Auth.isAuthenticated()) return null;

        const myMaterials = Auth.isStudent() ?
            Students.getMyMaterials() :
            Tutors.getMyMaterials();

        const totalDownloads = myMaterials.reduce((sum, m) => sum + m.downloads, 0);
        const publicMaterials = myMaterials.filter(m => m.isPublic).length;
        const privateMaterials = myMaterials.filter(m => !m.isPublic).length;

        // Group by subject
        const bySubject = {};
        myMaterials.forEach(m => {
            bySubject[m.subject] = (bySubject[m.subject] || 0) + 1;
        });

        return {
            totalMaterials: myMaterials.length,
            publicMaterials,
            privateMaterials,
            totalDownloads,
            bySubject
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaterialsManager;
}