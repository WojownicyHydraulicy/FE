document.addEventListener("DOMContentLoaded", function() {
    // Toggle hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const menuItems = document.getElementById('menuItems');
    
    if (hamburgerBtn && menuItems) {
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            menuItems.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerBtn.contains(e.target) && !menuItems.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                menuItems.classList.remove('active');
            }
        });
    }
    
    // Add logout functionality if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if(confirm('Czy na pewno chcesz się wylogować?')) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login/';
            }
        });
    }
    
    // IMPORTANT: Hide owner-specific menu items by default until role check completes
    hideOwnerButtons();
    
    // Check user role and show/hide owner-specific menu items
    checkUserRole();
});

// Hide all owner-specific buttons by default
function hideOwnerButtons() {
    const ownerButtons = document.querySelectorAll('.owner-button');
    ownerButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

// Function to check user role and show/hide menu items
async function checkUserRole() {
    try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Show owner-specific menu items only if user is OWNER
        const ownerButtons = document.querySelectorAll('.owner-button');
        if (data.role === "OWNER") {
            ownerButtons.forEach(btn => {
                btn.style.display = 'flex';
            });
        }
    } catch (error) {
        console.error("Error checking user role:", error);
    }
}
