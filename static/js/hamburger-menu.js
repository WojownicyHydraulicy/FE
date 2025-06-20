/**
 * Funkcja inicjująca działanie po załadowaniu DOM.
 */
document.addEventListener("DOMContentLoaded", async function() {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const menuItems = document.querySelector('.menu-items');
    
    // Przełącz menu po kliknięciu przycisku hamburgera
    
    hamburgerButton.addEventListener('click', function() {
        this.classList.toggle('active');
        menuItems.classList.toggle('active');
    });
    
    // Zamknij menu po kliknięciu poza nim
    document.addEventListener('click', function(event) {
        if (!hamburgerButton.contains(event.target) && !menuItems.contains(event.target)) {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });
    
    // Zamknij menu po naciśnięciu klawisza Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hamburgerButton.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });

    // Sprawdź rolę użytkownika i dodaj link do panelu administratora, jeśli to OWNER
    await checkAndAddAdminLink();
     
    // Obsłuż przycisk wylogowania
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
    
    // Początkowo ukryj elementy menu przeznaczone dla właściciela, aż do zakończenia sprawdzania roli
    const ownerButtons = document.querySelectorAll('.owner-button');
    ownerButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    //  Sprawdź rolę użytkownika i pokaż/ukryj elementy menu przeznaczone dla właściciela
    checkUserRole();
});

/**
 * Funkcja sprawdzająca rolę użytkownika i dodająca link do panelu administratora
 * @returns 
 */
async function checkAndAddAdminLink() {
    // Sprawdź, czy użytkownik jest zalogowany
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return;
    }
    
    try {
        //  Sprawdź rolę użytkownika
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

/**
 * Funkcja dodająca link do panelu administratora
 * @returns 
 */
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

/**
 * Funkcja sprawdzająca rolę użytkownika i pokazująca/ukrywająca elementy menu
 * @returns 
 */
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
        
        // Pokaż elementy menu przeznaczone dla właściciela tylko wtedy, gdy użytkownik ma rolę OWNER
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
