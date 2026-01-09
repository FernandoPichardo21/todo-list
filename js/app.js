// ===== APP CONFIGURATION =====
const CONFIG = {
    STORAGE_KEY: 'todo_list_tasks',
    ANIMATION_DELAY: 300,
    MAX_TASK_LENGTH: 200
};

// ===== STATE MANAGEMENT =====
let tasks = [];
let currentFilter = 'all';
let taskToDelete = null;

// ===== DOM ELEMENTS =====
const elements = {
    taskForm: document.getElementById('task-form'),
    taskInput: document.getElementById('task-input'),
    tasksList: document.getElementById('tasks-list'),
    emptyState: document.getElementById('empty-state'),
    totalTasks: document.getElementById('total-tasks'),
    pendingTasks: document.getElementById('pending-tasks'),
    completedTasks: document.getElementById('completed-tasks'),
    visibleTasks: document.getElementById('visible-tasks'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    confirmModal: document.getElementById('confirm-modal'),
    cancelDelete: document.getElementById('cancel-delete'),
    confirmDelete: document.getElementById('confirm-delete'),
    modalTaskText: document.getElementById('modal-task-text'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    themeToggle: document.querySelector('.theme-toggle')
};

// ===== UTILITY FUNCTIONS =====
const utils = {
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    showNotification: (message, type = 'success') => {
        elements.toastMessage.textContent = message;
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    },
    
    animateElement: (element, animation) => {
        element.classList.add(animation);
        setTimeout(() => {
            element.classList.remove(animation);
        }, CONFIG.ANIMATION_DELAY);
    },
    
    saveToLocalStorage: () => {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tasks));
    },
    
    loadFromLocalStorage: () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            tasks = JSON.parse(saved);
            renderTasks();
            updateStats();
        }
    }
};

// ===== TASK MANAGEMENT FUNCTIONS =====
const taskManager = {
    addTask: (text) => {
        if (!text.trim()) {
            utils.animateElement(elements.taskInput, 'animate-shake');
            utils.showNotification('La tarea no puede estar vacía', 'warning');
            return false;
        }
        
        if (text.length > CONFIG.MAX_TASK_LENGTH) {
            utils.showNotification(`La tarea no puede tener más de ${CONFIG.MAX_TASK_LENGTH} caracteres`, 'warning');
            return false;
        }
        
        const newTask = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        utils.saveToLocalStorage();
        renderTasks();
        updateStats();
        elements.taskInput.value = '';
        
        utils.showNotification('Tarea agregada correctamente');
        utils.animateElement(elements.taskForm, 'animate-pulse');
        
        return true;
    },
    
    toggleTask: (taskId) => {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            tasks[taskIndex].updatedAt = new Date().toISOString();
            utils.saveToLocalStorage();
            renderTasks();
            updateStats();
            
            const status = tasks[taskIndex].completed ? 'completada' : 'pendiente';
            utils.showNotification(`Tarea marcada como ${status}`);
        }
    },
    
    deleteTask: (taskId) => {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const taskText = tasks[taskIndex].text;
            tasks.splice(taskIndex, 1);
            utils.saveToLocalStorage();
            renderTasks();
            updateStats();
            
            utils.showNotification('Tarea eliminada correctamente');
            return taskText;
        }
        return null;
    },
    
    editTask: (taskId, newText) => {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1 && newText.trim()) {
            tasks[taskIndex].text = newText.trim();
            tasks[taskIndex].updatedAt = new Date().toISOString();
            utils.saveToLocalStorage();
            renderTasks();
            
            utils.showNotification('Tarea actualizada correctamente');
            return true;
        }
        return false;
    }
};

// ===== RENDER FUNCTIONS =====
const renderTasks = () => {
    elements.tasksList.innerHTML = '';
    
    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    if (filteredTasks.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.visibleTasks.textContent = '0';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.visibleTasks.textContent = filteredTasks.length.toString();
    
    filteredTasks.forEach((task, index) => {
        const taskElement = document.createElement('li');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        taskElement.style.animationDelay = `${index * 0.05}s`;
        
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <small class="task-date">
                    Creada: ${utils.formatDate(task.createdAt)} | 
                    Actualizada: ${utils.formatDate(task.updatedAt)}
                </small>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" title="Editar tarea">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" title="Eliminar tarea">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        elements.tasksList.appendChild(taskElement);
        
        // Add event listeners for this task
        const checkbox = taskElement.querySelector('.task-checkbox');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        const taskText = taskElement.querySelector('.task-text');
        
        checkbox.addEventListener('click', () => {
            utils.animateElement(checkbox, 'animate-bounce');
            setTimeout(() => {
                taskManager.toggleTask(task.id);
            }, CONFIG.ANIMATION_DELAY / 2);
        });
        
        editBtn.addEventListener('click', () => {
            const newText = prompt('Editar tarea:', task.text);
            if (newText !== null && newText.trim() !== task.text) {
                taskManager.editTask(task.id, newText);
            }
        });
        
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation(task.id, task.text);
        });
        
        // Double click to edit
        taskText.addEventListener('dblclick', () => {
            const newText = prompt('Editar tarea:', task.text);
            if (newText !== null && newText.trim() !== task.text) {
                taskManager.editTask(task.id, newText);
            }
        });
    });
};

// ===== UPDATE STATS =====
const updateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    elements.totalTasks.textContent = total.toString();
    elements.completedTasks.textContent = completed.toString();
    elements.pendingTasks.textContent = pending.toString();
    
    // Animate stats update
    utils.animateElement(elements.totalTasks.closest('.stat-card'), 'animate-pulse');
    utils.animateElement(elements.pendingTasks.closest('.stat-card'), 'animate-pulse');
    utils.animateElement(elements.completedTasks.closest('.stat-card'), 'animate-pulse');
};

// ===== MODAL FUNCTIONS =====
const showDeleteConfirmation = (taskId, taskText) => {
    taskToDelete = taskId;
    elements.modalTaskText.textContent = taskText;
    elements.confirmModal.classList.add('show');
};

const hideDeleteConfirmation = () => {
    taskToDelete = null;
    elements.confirmModal.classList.remove('show');
};

// ===== EVENT LISTENERS =====
const setupEventListeners = () => {
    // Form submission
    elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        taskManager.addTask(elements.taskInput.value);
    });
    
    // Filter buttons
    elements.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            elements.filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter
            currentFilter = button.dataset.filter;
            renderTasks();
            
            // Animate filter change
            utils.animateElement(button, 'animate-pulse');
        });
    });
    
    // Modal buttons
    elements.cancelDelete.addEventListener('click', hideDeleteConfirmation);
    elements.confirmDelete.addEventListener('click', () => {
        if (taskToDelete) {
            const deletedText = taskManager.deleteTask(taskToDelete);
            if (deletedText) {
                utils.showNotification(`Tarea eliminada: "${deletedText}"`);
            }
            hideDeleteConfirmation();
        }
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = elements.themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.className = 'fas fa-sun';
            utils.showNotification('🌙 Modo oscuro activado');
        } else {
            icon.className = 'fas fa-moon';
            utils.showNotification('☀️ Modo claro activado');
        }
        utils.animateElement(elements.themeToggle, 'animate-pulse');
    });
    
    // Close modal on outside click
    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) {
            hideDeleteConfirmation();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus task input on Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.taskInput.focus();
        }
        
        // Add task on Enter
        if (e.key === 'Enter' && elements.taskInput === document.activeElement) {
            e.preventDefault();
            elements.taskForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape key closes modal
        if (e.key === 'Escape' && elements.confirmModal.classList.contains('show')) {
            hideDeleteConfirmation();
        }
    });
    
    // Input validation
    elements.taskInput.addEventListener('input', () => {
        if (elements.taskInput.value.length > CONFIG.MAX_TASK_LENGTH) {
            elements.taskInput.style.borderColor = 'var(--danger-color)';
            utils.showNotification(`Máximo ${CONFIG.MAX_TASK_LENGTH} caracteres`, 'warning');
        } else {
            elements.taskInput.style.borderColor = '';
        }
    });
};

// ===== INITIALIZATION =====
const init = () => {
    console.log('Iniciando Todo List App...');
    
    // Load data from localStorage
    utils.loadFromLocalStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update initial stats
    updateStats();
    
    // Set initial filter
    elements.filterButtons.forEach(btn => {
        if (btn.dataset.filter === currentFilter) {
            btn.classList.add('active');
        }
    });
    
    // Check for system theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
        const icon = elements.themeToggle.querySelector('i');
        icon.className = 'fas fa-sun';
    }
    
    // Show welcome message
    setTimeout(() => {
        if (tasks.length === 0) {
            utils.showNotification('¡Bienvenido a Todo List! Agrega tu primera tarea.');
        } else {
            utils.showNotification(`Cargadas ${tasks.length} tareas desde el almacenamiento local`);
        }
    }, 1000);
    
    console.log('App inicializada correctamente');
};

// ===== START THE APP =====
document.addEventListener('DOMContentLoaded', init);
