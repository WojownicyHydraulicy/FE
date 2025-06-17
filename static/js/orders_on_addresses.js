/**
 * Funkcja inicjująca działanie po załadowaniu DOM.
 */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    const resultsDiv = document.getElementById("searchResults");
    
    // Sprawdź rolę użytkownika
    checkOwnerRole();
    
    // Dodajemy obsługę touch feedback dla przycisków
    setupTouchFeedback();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("auth_token");
        if (!token) {
            window.location.href = "/login/";
            return;
        }

        // Pokaż stan ładowania
        resultsDiv.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Wyszukiwanie zleceń...</p>
            </div>
        `;

        const formData = new FormData(form);

        try {
            const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_orders_on_addr/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            });

            if (response.status === 401) {
                localStorage.removeItem("auth_token");
                window.location.href = "/login/";
                return;
            }

            const data = await response.json();
            displayResults(data, resultsDiv);
            
            // Przewiń do wyników po wyszukiwaniu na urządzeniach mobilnych
            if (window.innerWidth <= 768) {
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            resultsDiv.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h3>Wystąpił błąd</h3>
                    <p>Nie udało się połączyć z serwerem. Spróbuj ponownie później.</p>
                </div>
            `;
        }
    });
    
    // Optymalizacja formularza dla urządzeń mobilnych
    optimizeFormForMobile();
});

/**
 * Funkcja dodająca touch feedback
 */
function setupTouchFeedback() {
    document.querySelectorAll('.submit-btn, .result-card').forEach(elem => {
        elem.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        elem.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
}

/**
 * Funkcja do optymalizacji formularza dla urządzeń mobilnych
 */
function optimizeFormForMobile() {
    // Sprawdź czy używamy urządzenia mobilnego
    if (window.innerWidth <= 768) {
        // Dodaj autofocus do pierwszego pola formularza (ale tylko na stronach bez klawiatury)
        const firstInput = document.querySelector('.form-group input');
        if (firstInput) {
            // Opóźnij autofocus, aby uniknąć problemów podczas ładowania
            setTimeout(() => {
                // Tylko dla orientacji poziomej - unikamy automatycznego focusu w pionie,
                // który może powodować przewijanie i problemy z klawiaturą
                if (window.innerWidth > window.innerHeight) {
                    firstInput.focus();
                }
            }, 500);
        }
        
        // Dodaj obsługę automatycznego przełączania między polami
        document.querySelectorAll('.form-group input').forEach(input => {
            input.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    // Znajdź następne pole formularza
                    const formControls = Array.from(document.querySelectorAll('.form-group input, .form-group select, button.submit-btn'));
                    const currentIndex = formControls.indexOf(this);
                    
                    if (currentIndex < formControls.length - 1) {
                        formControls[currentIndex + 1].focus();
                    }
                }
            });
        });
    }
}

/**
 * Funkcja pokazująca na stronie pobrane zgłoszenia.
 * @param {*} data - dane dotyczące zgłoszeń
 * @param {*} resultsDiv - zwracany kontener
 * @returns 
 */
function displayResults(data, resultsDiv) {
    resultsDiv.innerHTML = "";
    
    if (data.status !== "success") {
        resultsDiv.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h3>Wystąpił błąd</h3>
                <p>${data.message || "Wystąpił nieznany błąd"}</p>
            </div>
        `;
        return;
    }
    
    if (!data.orders || data.orders.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-results">
                <div class="empty-icon">🔍</div>
                <h3>Brak wyników</h3>
                <p>Nie znaleziono zleceń dla podanego adresu.</p>
            </div>
        `;
        return;
    }
    
    data.orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "result-card";
        
        const imageHTML = order.photo_url 
            ? `<div class="result-image"><img src="${order.photo_url}" alt="Zdjęcie zlecenia" loading="lazy"></div>` 
            : "";
            
        // Format date if available
        const orderDate = order.appointment_date ? new Date(order.appointment_date) : null;
        const formattedDate = orderDate ? orderDate.toLocaleDateString("pl-PL", {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        }) : "Brak daty";
        
        card.innerHTML = `
            <div class="result-header">
                <h3>${order.name}</h3>
                <div class="result-meta">
                    <span class="address-icon">📍</span>
                    ${order.street} ${order.house_nr}, ${order.post_code} ${order.city}
                </div>
            </div>
            
            <div class="result-body">
                <div class="result-info">
                    <div class="info-item">
                        <span class="info-label">Telefon:</span>
                        <span class="info-value">${order.telephone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data realizacji:</span>
                        <span class="info-value">${formattedDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">${order.order_status || "Zakończone"}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Opis:</span>
                        <span class="info-value">${order.description}</span>
                    </div>
                </div>
                ${imageHTML}
            </div>
        `;
        
        resultsDiv.appendChild(card);
    });
}

/**
 * Funkcja sprawdzająca czy użytkownik jest właścicielem i pokazująca/ukrywająca odpowiednie elementy
 * @returns 
 */
async function checkOwnerRole() {
    try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });
        
        if (response.status === 401) {
            return; // Już obsłużone w innych miejscach
        }
        
        const data = await response.json();
        
        // Pokaż/ukryj przyciski tylko dla właścicieli
        const ownerButtons = document.querySelectorAll('.owner-button');
        if (data.role === "OWNER") {
            ownerButtons.forEach(btn => btn.style.display = 'flex');
        } else {
            ownerButtons.forEach(btn => btn.style.display = 'none');
        }
    } catch (error) {
        console.error("Błąd sprawdzania roli:", error);
    }
}