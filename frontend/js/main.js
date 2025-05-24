// Modern JavaScript with Animations and Enhanced UX
document.addEventListener('DOMContentLoaded', () => {
    // State Management
    const state = {
        listings: [],
        filteredListings: [],
        shortlistedIds: [],
        isShortlistedFilterActive: false,
        searchQuery: '',
        isLoading: true,
        activeTab: null,
        toastTimeout: null
    };

    // DOM Elements
    const elements = {
        listingsContainer: document.getElementById('listings-container'),
        shortlistedTab: document.getElementById('shortlisted-tab'),
        tabs: document.querySelectorAll('.tab-btn'),
        searchInput: document.getElementById('search-input'),
        clearSearch: document.getElementById('clear-search'),
        resultsCount: document.getElementById('results-count')
    };

    // Templates
    const templates = {
        cardTemplate: document.getElementById('designer-card-template'),
        emptyState: document.getElementById('empty-state-template')
    };

    // Initialize the application
    init();

    async function init() {
        // Set up event listeners
        setupEventListeners();
        
        // Load saved shortlisted items from localStorage
        loadShortlistedItems();
        
        // Set initial active tab
        setActiveTab(document.querySelector('.tab-btn'));
        
        // Fetch listings data
        await fetchListings();
        
        // Remove loading spinner
        state.isLoading = false;
        
        // Render initial listings with animation
        renderListings(true);
        
        // Show welcome toast
        showToast('Welcome to EmptyCup!', 'success');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Tab Navigation
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => handleTabClick(tab));
        });
        
        // Search Input
        elements.searchInput.addEventListener('input', handleSearch);
        elements.clearSearch.addEventListener('click', clearSearch);
        
        // Click outside to close dropdowns or panels (if implemented)
        document.addEventListener('click', (e) => {
            // Add any click-outside handling here
        });
    }

    // Tab Click Handler
    function handleTabClick(tab) {
        // Set active tab
        setActiveTab(tab);
        
        // Handle shortlisted filter
        if (tab.id === 'shortlisted-tab') {
            state.isShortlistedFilterActive = !state.isShortlistedFilterActive;
        } else {
            state.isShortlistedFilterActive = false;
        }
        
        // Update UI
        filterAndRenderListings();
    }

    // Set Active Tab with Animation
    function setActiveTab(tab) {
        // Remove active class from all tabs
        elements.tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        state.activeTab = tab.dataset.tab;
    }

    // Search Handler
    function handleSearch(e) {
        state.searchQuery = e.target.value.trim().toLowerCase();
        elements.clearSearch.classList.toggle('visible', state.searchQuery.length > 0);
        filterAndRenderListings();
    }

    // Clear Search
    function clearSearch() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearch.classList.remove('visible');
        filterAndRenderListings();
    }

    // Load Shortlisted Items from localStorage
    function loadShortlistedItems() {
        const saved = localStorage.getItem('emptycup_shortlisted');
        if (saved) {
            try {
                state.shortlistedIds = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse shortlisted items', e);
            }
        }
    }

    // Save Shortlisted Items to localStorage
    function saveShortlistedItems() {
        localStorage.setItem('emptycup_shortlisted', JSON.stringify(state.shortlistedIds));
    }

    // Fetch Listings Data
    async function fetchListings() {
        try {
            // Try to fetch from API first
            const response = await fetch('/api/listings');
            
            if (response.ok) {
                const data = await response.json();
                state.listings = data;
                return;
            }
            
            // If API fails, try static JSON
            console.warn('API fetch failed, trying static JSON file');
            const staticResponse = await fetch('data/listings.json');
            
            if (staticResponse.ok) {
                const data = await staticResponse.json();
                state.listings = data;
                return;
            }
            
            // If both fail, use fallback data
            console.warn('Static JSON fetch failed, using fallback data');
            state.listings = getFallbackData();
            
        } catch (error) {
            console.error('Error fetching listings:', error);
            state.listings = getFallbackData();
            showToast('Failed to load data from server. Using sample data.', 'error');
        }
    }

    // Filter and Render Listings
    function filterAndRenderListings() {
        // Apply filters
        let filtered = [...state.listings];
        
        // Apply shortlist filter if active
        if (state.isShortlistedFilterActive) {
            filtered = filtered.filter(item => state.shortlistedIds.includes(item.id));
        }
        
        // Apply search filter if there's a query
        if (state.searchQuery) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(state.searchQuery) || 
                item.description.toLowerCase().includes(state.searchQuery)
            );
        }
        
        // Update results count
        updateResultsCount(filtered.length);
        
        // Store filtered results
        state.filteredListings = filtered;
        
        // Render with animation
        renderListings();
    }

    // Update Results Count
    function updateResultsCount(count) {
        let statusText = '';
        
        if (state.isLoading) {
            statusText = 'Loading designers...';
        } else if (state.isShortlistedFilterActive && state.searchQuery) {
            statusText = `Found ${count} shortlisted designers matching "${state.searchQuery}"`;
        } else if (state.isShortlistedFilterActive) {
            statusText = `${count} shortlisted designers`;
        } else if (state.searchQuery) {
            statusText = `Found ${count} designers matching "${state.searchQuery}"`;
        } else {
            statusText = `Showing all ${count} designers`;
        }
        
        elements.resultsCount.textContent = statusText;
    }

    // Render Listings with Animation
    function renderListings(isInitialRender = false) {
        // Clear container
        elements.listingsContainer.innerHTML = '';
        
        if (state.isLoading) {
            // Show loading spinner
            elements.listingsContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <span>Loading designers...</span>
                </div>
            `;
            return;
        }
        
        // Check for empty state
        if (state.filteredListings.length === 0) {
            const emptyState = templates.emptyState.content.cloneNode(true);
            elements.listingsContainer.appendChild(emptyState);
            return;
        }
        
        // Create and append designer cards with staggered animation
        state.filteredListings.forEach((designer, index) => {
            const card = createDesignerCard(designer);
            
            // Add staggered animation class for initial render
            if (isInitialRender) {
                card.style.animationDelay = `${index * 100}ms`;
            }
            
            elements.listingsContainer.appendChild(card);
        });
    }

    // Create Designer Card
    function createDesignerCard(designer) {
        const cardElement = templates.cardTemplate.content.cloneNode(true);
        const card = cardElement.querySelector('.designer-card');
        
        // Set card ID
        card.dataset.id = designer.id;
        
        // Populate card data
        cardElement.querySelector('.designer-name').textContent = designer.name;
        cardElement.querySelector('.designer-description').textContent = designer.description;
        cardElement.querySelector('.stat-projects').textContent = `${designer.projects} Projects`;
        cardElement.querySelector('.stat-experience').textContent = `${designer.experience} Years`;
        cardElement.querySelector('.stat-price').textContent = getPriceString(designer.price);
        cardElement.querySelector('.phone-number-1').textContent = designer.phone1;
        cardElement.querySelector('.phone-number-2').textContent = designer.phone2;
        
        // Set rating stars
        cardElement.querySelector('.designer-rating').innerHTML = generateStarRating(designer.rating);
        
        // Configure shortlist button
        const shortlistBtn = cardElement.querySelector('.shortlist-btn');
        const isShortlisted = state.shortlistedIds.includes(designer.id);
        
        if (isShortlisted) {
            shortlistBtn.classList.add('active');
            shortlistBtn.innerHTML = `
                <i class="fas fa-star shortlist-icon"></i>
                <span>Shortlisted</span>
            `;
        } else {
            shortlistBtn.innerHTML = `
                <i class="far fa-star shortlist-icon"></i>
                <span>Shortlist</span>
            `;
        }
        
        // Add shortlist button event listener
        shortlistBtn.addEventListener('click', () => {
            toggleShortlist(designer.id, shortlistBtn);
        });
        
        // Add hover effects for card
        addCardInteractions(card);
        
        return card;
    }

    // Add Card Hover and Interaction Effects
    function addCardInteractions(card) {
        // Add hover class on mouse enter
        card.addEventListener('mouseenter', () => {
            card.classList.add('card-hover');
        });
        
        // Remove hover class on mouse leave
        card.addEventListener('mouseleave', () => {
            card.classList.remove('card-hover');
        });
    }

    // Toggle Shortlist with Animation
    function toggleShortlist(id, button) {
        const index = state.shortlistedIds.indexOf(id);
        const wasShortlisted = index !== -1;
        
        // Toggle shortlist status
        if (wasShortlisted) {
            // Remove from shortlist
            state.shortlistedIds.splice(index, 1);
            button.classList.remove('active');
            button.innerHTML = `
                <i class="far fa-star shortlist-icon"></i>
                <span>Shortlist</span>
            `;
            
            // Show toast
            showToast('Removed from shortlist', 'info');
        } else {
            // Add to shortlist
            state.shortlistedIds.push(id);
            button.classList.add('active');
            button.innerHTML = `
                <i class="fas fa-star shortlist-icon"></i>
                <span>Shortlisted</span>
            `;
            
            // Add pulse animation
            const icon = button.querySelector('.shortlist-icon');
            icon.classList.add('animate__animated', 'animate__pulse');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                icon.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
            
            // Show toast
            showToast('Added to shortlist', 'success');
        }
        
        // Save updated shortlist
        saveShortlistedItems();
        
        // Re-render if shortlisted filter is active
        if (state.isShortlistedFilterActive) {
            filterAndRenderListings();
        }
    }

    // Generate Star Rating HTML
    function generateStarRating(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        return starsHtml;
    }

    // Get Price Display String
    function getPriceString(priceLevel) {
        const symbols = Array(priceLevel).fill('$').join('');
        return `${symbols} Price`;
    }

    // Show Toast Notification
    function showToast(message, type = 'info') {
        // Clear existing toast if any
        if (state.toastTimeout) {
            clearTimeout(state.toastTimeout);
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate__animated animate__fadeInUp`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide after delay
        state.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('animate__fadeOutDown');
            
            setTimeout(() => {
                toast.remove();
                state.toastTimeout = null;
            }, 300);
        }, 3000);
    }

    // Fallback data if API requests fail
    function getFallbackData() {
        return [
            {
                id: 1,
                name: "Epic Designs",
                rating: 4,
                description: "Passionate team of 4 designers working out of Bangalore with an experience of 4 years.",
                projects: 57,
                experience: 8,
                price: 2,
                phone1: "+91 - 984532853",
                phone2: "+91 - 984532854"
            },
            {
                id: 2,
                name: "Studio - D3",
                rating: 5,
                description: "Passionate team of 4 designers working out of Bangalore with an experience of 4 years.",
                projects: 43,
                experience: 6,
                price: 3,
                phone1: "+91 - 984532853",
                phone2: "+91 - 984532854"
            },
            {
                id: 3,
                name: "Design Masters",
                rating: 3,
                description: "Creative team specialized in modern and minimalist designs based in Mumbai.",
                projects: 32,
                experience: 5,
                price: 1,
                phone1: "+91 - 987654321",
                phone2: "+91 - 987654320"
            }
        ];
    }
});