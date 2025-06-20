/**
 * Funkcja inicjująca działanie po załadowaniu DOM.
 */
document.addEventListener("DOMContentLoaded", async function() {
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
});

/**
 * Funkcja dodająca link do panelu administratora
 * @returns 
 */
function addAdminPanelLink() {
    // Znajdź kontener menu
    const menuItems = document.getElementById("menuItems");
    if (!menuItems) {
        return;
    }
    
    // Sprawdź, czy link już istnieje
    if (document.querySelector('a[href="/admin_panel/"]')) {
        return;
    }
    
    // Utwórz nowy element linku
    const adminLink = document.createElement("a");
    adminLink.href = "/admin_panel/";
    adminLink.className = "nav-button";
    adminLink.innerHTML = `<span class="btn-icon">👥</span> Panel administracyjny`;
    
    // Dodaj link przed ostatnim elementem (zwykle "Wyloguj")
    const lastLink = menuItems.lastElementChild;
    if (lastLink) {
        menuItems.insertBefore(adminLink, lastLink);
    } else {
        menuItems.appendChild(adminLink);
    }
}
