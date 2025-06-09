document.addEventListener("DOMContentLoaded", function() {
    // Sprawdzenie, czy użytkownik jest zalogowany
    const token = localStorage.getItem("auth_token");
    console.log("Loaded token:", token); // Dodane dla debugowania
    
    if (!token) {
        window.location.href = "/login/";
        return;
    }
    
    // Inicjalizacja panelu
    initAdminPanel();
});

// Inicjalizacja panelu administracyjnego
async function initAdminPanel() {
    try {
        // Sprawdzenie, czy użytkownik ma uprawnienia OWNER
        const isOwner = await checkOwnerRole();
        if (!isOwner) {
            // Jeśli nie jest właścicielem, pokaż komunikat o braku dostępu
            document.getElementById("accessDenied").style.display = "flex";
            document.getElementById("usersContainer").style.display = "none";
            return;
        }
        
        // Użytkownik jest właścicielem, pokaż panel zarządzania
        document.getElementById("accessDenied").style.display = "none";
        document.getElementById("usersContainer").style.display = "block";
        
        // Pobierz listę użytkowników
        await fetchUsers();
        
        // Inicjalizacja filtrowania i wyszukiwania
        setupFiltering();
        
        // Dodaj obsługę przycisku ponownego wczytania
        document.getElementById("retryButton").addEventListener("click", fetchUsers);
    } catch (error) {
        console.error("Błąd inicjalizacji panelu:", error);
        showError("Wystąpił błąd podczas inicjalizacji panelu. Spróbuj odświeżyć stronę.");
    }
}

// Sprawdzenie, czy użytkownik ma uprawnienia OWNER
async function checkOwnerRole() {
    try {
        const token = localStorage.getItem("auth_token");
        console.log("Using token for role check:", token); // Dodane dla debugowania
        
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (response.status === 401) {
            console.log("Unauthorized in role check, clearing token"); // Dodane dla debugowania
            localStorage.removeItem("auth_token");
            window.location.href = "/login/";
            return false;
        }
        
        const data = await response.json();
        console.log("Role check response:", data); // Dodane dla debugowania
        return data.role === "OWNER";
    } catch (error) {
        console.error("Błąd sprawdzania roli:", error);
        return false;
    }
}

// Zmienne globalne do obsługi paginacji
let currentPage = 0;
const pageSize = 10; // Liczba użytkowników na stronę
let totalPages = 1;
let allUsers = []; // Przechowuje wszystkich załadowanych użytkowników

// Pobieranie listy użytkowników
async function fetchUsers() {
    const loadingElement = document.getElementById("loadingUsers");
    const errorElement = document.getElementById("usersError");
    const usersListElement = document.getElementById("usersList");
    
    try {
        // Pokaż ładowanie
        loadingElement.style.display = "flex";
        errorElement.style.display = "none";
        usersListElement.style.display = "none";
        
        // Pobierz token z localStorage
        const token = localStorage.getItem("auth_token");
        
        // Użyj endpointu /all_users/ z API orders-management
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/all_users/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            console.log("Unauthorized in fetchUsers, clearing token");
            localStorage.removeItem("auth_token");
            window.location.href = "/login/";
            return;
        }
        
        if (response.status === 403) {
            console.log("Forbidden: User doesn't have OWNER role");
            document.getElementById("accessDenied").style.display = "flex";
            document.getElementById("usersContainer").style.display = "none";
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Błąd HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("All users response:", data);
        
        // Sprawdź, czy odpowiedź ma oczekiwany format
        if (data.status !== "success" || !data.users) {
            throw new Error(data.message || "Nieoczekiwany format odpowiedzi API");
        }
        
        // Mapowanie pól do formatu oczekiwanego przez renderUsers
        const users = data.users.map(user => ({
            id: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            city: user.city
        }));
        
        // Renderowanie użytkowników
        renderUsers(users);
        
        // Ukryj ładowanie, pokaż listę
        loadingElement.style.display = "none";
        usersListElement.style.display = "grid";
    } catch (error) {
        console.error("Błąd pobierania użytkowników:", error);
        loadingElement.style.display = "none";
        errorElement.style.display = "flex";
        document.getElementById("errorMessage").textContent = 
            "Nie udało się pobrać listy użytkowników. " + error.message;
    }
}

// Funkcja renderująca kontrolki paginacji
function renderPagination() {
    // Znajdź lub utwórz kontener paginacji
    let paginationContainer = document.getElementById("paginationControls");
    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "paginationControls";
        paginationContainer.className = "pagination-controls";
        
        // Dodaj kontener paginacji po liście użytkowników
        const usersList = document.getElementById("usersList");
        usersList.parentNode.insertBefore(paginationContainer, usersList.nextSibling);
    }
    
    // Wyczyść obecne kontrolki
    paginationContainer.innerHTML = "";
    
    // Jeśli mamy tylko jedną stronę, nie pokazuj kontrolek
    if (totalPages <= 1) {
        paginationContainer.style.display = "none";
        return;
    }
    
    paginationContainer.style.display = "flex";
    
    // Przycisk "Poprzednia strona"
    const prevButton = document.createElement("button");
    prevButton.className = "pagination-btn prev-btn";
    prevButton.innerHTML = "&#8592; Poprzednia";
    prevButton.disabled = currentPage === 0;
    prevButton.addEventListener("click", () => {
        if (currentPage > 0) {
            fetchUsers(currentPage - 1);
        }
    });
    
    // Przycisk "Następna strona"
    const nextButton = document.createElement("button");
    nextButton.className = "pagination-btn next-btn";
    nextButton.innerHTML = "Następna &#8594;";
    nextButton.disabled = currentPage >= totalPages - 1;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages - 1) {
            fetchUsers(currentPage + 1);
        }
    });
    
    // Info o stronie
    const pageInfo = document.createElement("div");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Strona ${currentPage + 1} z ${totalPages}`;
    
    // Dodaj elementy do kontenera
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}

// Renderowanie listy użytkowników
function renderUsers(users) {
    const usersListElement = document.getElementById("usersList");
    usersListElement.innerHTML = "";
    
    if (!users || users.length === 0) {
        usersListElement.innerHTML = `
            <div class="empty-users">
                <div class="empty-icon">👤</div>
                <h3>Brak użytkowników</h3>
                <p>Nie znaleziono żadnych użytkowników w systemie.</p>
            </div>
        `;
        return;
    }
    
    // Sortowanie: najpierw OWNER, potem WORKER, na końcu USER
    const sortOrder = { "OWNER": 1, "WORKER": 2, "USER": 3 };
    const sortedUsers = [...users].sort((a, b) => {
        return sortOrder[a.role] - sortOrder[b.role] || a.username.localeCompare(b.username);
    });
    
    // Mapowanie nazw ról
    const roleNames = {
        "OWNER": "Manager",
        "WORKER": "Pracownik",
        "USER": "Użytkownik"
    };
    
    // Renderowanie kart użytkowników
    sortedUsers.forEach(user => {
        const userCard = document.createElement("div");
        userCard.className = "user-card";
        userCard.dataset.role = user.role;
        userCard.dataset.username = user.username.toLowerCase();
        
        // Określenie ikony i koloru dla roli
        let roleIcon, roleColorClass;
        switch (user.role) {
            case "OWNER":
                roleIcon = "👑";
                roleColorClass = "role-owner";
                break;
            case "WORKER":
                roleIcon = "🛠️";
                roleColorClass = "role-worker";
                break;
            default:
                roleIcon = "👤";
                roleColorClass = "role-user";
        }
        
        // Przyciski akcji
        let actionButtons = '';
        if (user.role === "USER") {
            // Dla USER pokazujemy przycisk promocji do WORKER
            actionButtons = `
                <button class="promote-btn" data-username="${user.username}">
                    <span class="btn-icon">⬆️</span> Awansuj
                </button>
            `;
        } else if (user.role === "WORKER") {
            // Dla WORKER pokazujemy przycisk degradacji do USER
            actionButtons = `
                <button class="demote-btn" data-username="${user.username}">
                    <span class="btn-icon">⬇️</span> Zdegraduj
                </button>
            `;
        }
        
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}</div>
                <div class="user-name">
                    <h3>${user.firstName || ''} ${user.lastName || ''}</h3>
                    <span class="username">@${user.username}</span>
                </div>
                <div class="user-role ${roleColorClass}">
                    <span class="role-icon">${roleIcon}</span>
                    <span class="role-name">${roleNames[user.role]}</span>
                </div>
            </div>
            <div class="user-details">
                <div class="user-email">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${user.email || 'Brak'}</span>
                </div>
            </div>
            <div class="user-actions">
                ${actionButtons}
            </div>
        `;
        
        usersListElement.appendChild(userCard);
    });
    
    // Dodanie obsługi przycisków
    setupActionButtons();
}

// Inicjalizacja filtrowania i wyszukiwania
function setupFiltering() {
    // Znajdź kontener przycisków filtrowania
    const filterButtonsContainer = document.querySelector(".filter-buttons");
    
    // Usuń istniejące przyciski
    filterButtonsContainer.innerHTML = '';
    
    // Utwórz strukturę menu rozwijanego
    filterButtonsContainer.innerHTML = `
        <button class="filter-dropdown-btn" id="filterDropdownBtn">
            Wszyscy <span class="dropdown-arrow">▼</span>
        </button>
        <div class="filter-menu" id="filterMenu">
            <button class="filter-option active" data-filter="all">Wszyscy</button>
            <button class="filter-option" data-filter="WORKER">Pracownicy</button>
            <button class="filter-option" data-filter="USER">Użytkownicy</button>
        </div>
    `;
    
    // Obsługa menu rozwijanego
    const dropdownBtn = document.getElementById("filterDropdownBtn");
    const filterMenu = document.getElementById("filterMenu");
    
    // Obsługa kliknięcia przycisku dropdown
    dropdownBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        this.classList.toggle("active");
        filterMenu.classList.toggle("open");
    });
    
    // Zamknij dropdown po kliknięciu poza nim
    document.addEventListener("click", function(e) {
        if (!dropdownBtn.contains(e.target) && !filterMenu.contains(e.target)) {
            dropdownBtn.classList.remove("active");
            filterMenu.classList.remove("open");
        }
    });
    
    // Obsługa opcji filtrowania
    document.querySelectorAll(".filter-option").forEach(option => {
        option.addEventListener("click", function() {
            // Aktualizuj tekst przycisku dropdown
            const filterText = this.textContent;
            dropdownBtn.innerHTML = `${filterText} <span class="dropdown-arrow">▼</span>`;
            
            // Aktualizuj aktywną opcję
            document.querySelectorAll(".filter-option").forEach(opt => {
                opt.classList.remove("active");
            });
            this.classList.add("active");
            
            // Zamknij menu
            filterMenu.classList.remove("open");
            dropdownBtn.classList.remove("active");
            
            // Zastosuj filtrowanie
            currentPage = 0;
            applyFilters();
        });
    });
    
    // Obsługa wyszukiwania
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function() {
        // Zresetuj stronę przy nowym wyszukiwaniu
        currentPage = 0;
        applyFilters();
    });
}

// Zastosowanie filtrów i wyszukiwania
function applyFilters() {
    const searchText = document.getElementById("searchInput").value.toLowerCase();
    const activeFilter = document.querySelector(".filter-option.active").dataset.filter;
    
    const userCards = document.querySelectorAll(".user-card");
    userCards.forEach(card => {
        // Sprawdź filtr roli
        const matchesRole = activeFilter === "all" || card.dataset.role === activeFilter;
        
        // Sprawdź tekst wyszukiwania
        const matchesSearch = card.dataset.username.includes(searchText) || 
                             card.textContent.toLowerCase().includes(searchText);
        
        // Pokaż/ukryj kartę
        card.style.display = matchesRole && matchesSearch ? "block" : "none";
    });
}

// Inicjalizacja przycisków akcji
function setupActionButtons() {
    // Obsługa przycisku promocji
    document.querySelectorAll(".promote-btn").forEach(button => {
        button.addEventListener("click", async function() {
            const username = this.dataset.username;
            if (confirm(`Czy na pewno chcesz awansować użytkownika ${username} do rangi Pracownika?`)) {
                await promoteUser(username);
            }
        });
    });
    
    // Obsługa przycisku degradacji
    document.querySelectorAll(".demote-btn").forEach(button => {
        button.addEventListener("click", async function() {
            const username = this.dataset.username;
            if (confirm(`Czy na pewno chcesz zdegradować użytkownika ${username} do rangi Użytkownika?`)) {
                await demoteUser(username);
            }
        });
    });
}

// Promocja użytkownika do WORKER
async function promoteUser(username) {
    // Sprawdź, czy użytkownik ma rolę USER
    const userCard = document.querySelector(`.user-card[data-username="${username.toLowerCase()}"]`);
    
    if (!userCard || userCard.dataset.role !== "USER") {
        showError("Promocja jest możliwa tylko dla użytkowników z rolą USER.");
        return;
    }
    
    await changeUserRole(username, "promote");
}

// Degradacja użytkownika do USER
async function demoteUser(username) {
    // Sprawdź, czy użytkownik ma rolę WORKER
    const userCard = document.querySelector(`.user-card[data-username="${username.toLowerCase()}"]`);
    
    if (!userCard || userCard.dataset.role !== "WORKER") {
        showError("Degradacja jest możliwa tylko dla użytkowników z rolą WORKER.");
        return;
    }
    
    await changeUserRole(username, "demote");
}

// Zmiana roli użytkownika
async function changeUserRole(username, action) {
    try {
        // Dezaktywuj wszystkie przyciski akcji podczas operacji
        const actionButtons = document.querySelectorAll(".promote-btn, .demote-btn");
        actionButtons.forEach(btn => btn.disabled = true);
        
        const token = localStorage.getItem("auth_token");
        
        // Używamy bezpośredniego URL zamiast proxy
        const url = `https://orders-management-api-409909044870.europe-central2.run.app/users/${username}/${action}`;
        
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem("auth_token");
            window.location.href = "/login/";
            return;
        }
        
        if (!response.ok) {
            // Próba odczytania komunikatu błędu z odpowiedzi
            let errorMessage = `Błąd HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorMessage;
            } catch (e) {
                // Jeśli nie ma JSON w odpowiedzi, używamy domyślnego komunikatu błędu
            }
            throw new Error(errorMessage);
        }
        
        // Poczekaj 1 sekundę dla lepszego UX
        setTimeout(() => {
            // Odśwież listę użytkowników
            fetchUsers();
            
            // Pokaż komunikat sukcesu
            showSuccessToast(
                action === "promote" 
                    ? `Użytkownik ${username} został awansowany do rangi Pracownika.` 
                    : `Użytkownik ${username} został zdegradowany do rangi Użytkownika.`
            );
        }, 1000);
    } catch (error) {
        console.error(`Błąd podczas ${action === "promote" ? "promocji" : "degradacji"} użytkownika:`, error);
        showError(`Nie udało się ${action === "promote" ? "awansować" : "zdegradować"} użytkownika. ${error.message}`);
        
        // Odblokuj przyciski
        const actionButtons = document.querySelectorAll(".promote-btn, .demote-btn");
        actionButtons.forEach(btn => btn.disabled = false);
    }
}

// Wyświetlanie błędu
function showError(message) {
    const errorElement = document.getElementById("usersError");
    document.getElementById("errorMessage").textContent = message;
    errorElement.style.display = "flex";
}

// Wyświetlenie komunikatu sukcesu
function showSuccessToast(message) {
    // Sprawdź, czy już istnieje element toast
    let toast = document.querySelector(".toast-message");
    
    if (!toast) {
        // Utwórz nowy element toast
        toast = document.createElement("div");
        toast.className = "toast-message";
        document.body.appendChild(toast);
    }
    
    // Ustaw wiadomość i pokaż toast
    toast.textContent = message;
    toast.classList.add("show");
    
    // Usuń toast po 3 sekundach
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
