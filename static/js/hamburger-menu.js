document.addEventListener("DOMContentLoaded", async function() {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const menuItems = document.querySelector('.menu-items');
    
    // Toggle menu on hamburger button click
    hamburgerButton.addEventListener('click', function() {
        this.classList.toggle('active');
        menuItems.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!hamburgerButton.contains(event.target) && !menuItems.contains(event.target)) {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });
    
    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });

    // Sprawdź rolę użytkownika i dodaj link do panelu administratora, jeśli to OWNER
    await checkAndAddAdminLink();
    
    // Handle logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if(confirm('Czy na pewno chcesz się wylogować?')) {
                localStorage.removeItem('auth_token');
                window.location.href = '/';
            }
        });
    }
    
    // Initially hide owner-specific menu items until role check completes
    const ownerButtons = document.querySelectorAll('.owner-button');
    ownerButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Check user role and show/hide owner-specific menu items
    checkUserRole();
});

// Funkcja sprawdzająca rolę użytkownika i dodająca link do panelu administratora
async function checkAndAddAdminLink() {
    // Sprawdź, czy użytkownik jest zalogowany
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return;
    }
    
    try {
        // Sprawdź rolę użytkownika
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (!response.ok) {
            return;
        }
        
        const data = await response.json();
        
        // Jeśli użytkownik ma rolę OWNER, dodaj link do panelu administratora
        if (data.role === "OWNER") {
            addAdminPanelLink();
        }
    } catch (error) {
        console.error("Błąd sprawdzania roli:", error);
    }
}

// Funkcja dodająca link do panelu administratora
function addAdminPanelLink() {
    // Znajdź kontener menu
    const menuItems = document.querySelector('.menu-items');
    if (!menuItems) {
        return;
    }
    
    // Sprawdź, czy link już istnieje
    if (document.querySelector('a[href="/admin_panel/"]')) {
        return;
    }
    
    // Znajdź link do wylogowania (zazwyczaj ostatni element menu)
    const logoutLink = menuItems.querySelector('a[id="logoutBtn"]') || menuItems.lastElementChild;
    
    // Utwórz nowy element linku
    const adminLink = document.createElement("a");
    adminLink.href = "/admin_panel/";
    adminLink.className = "nav-button";
    adminLink.innerHTML = `<span class="btn-icon">👥</span> Panel administracyjny`;
    
    // Dodaj link przed ostatnim elementem (zwykle "Wyloguj")
    if (logoutLink) {
        menuItems.insertBefore(adminLink, logoutLink);
    } else {
        menuItems.appendChild(adminLink);
    }
}

// Function to check user role and show/hide menu items
async function checkUserRole() {
    try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        
        console.log("Checking user role with token...");
        
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (!response.ok) {
            console.error("Role check failed with status:", response.status);
            return;
        }
        
        const data = await response.json();
        console.log("User role check response:", data);
        
        // Show owner-specific menu items only if user is OWNER
        const ownerButtons = document.querySelectorAll('.owner-button');
        if (data.role === "OWNER") {
            console.log("User is OWNER, showing owner buttons:", ownerButtons.length);
            ownerButtons.forEach(btn => {
                btn.style.display = 'flex';
                console.log("Set display:flex for button:", btn.href);
            });
        } else {
            console.log("User is not OWNER, hiding owner buttons");
            ownerButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }
    } catch (error) {
        console.error("Error checking user role:", error);
    }
}
