document.addEventListener("DOMContentLoaded", () => {
    initReviewPage();
});

// Inicjalizacja strony przeglądania wniosków
async function initReviewPage() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    try {
        const pendingRequests = await fetchPendingRequests(token);
        renderPendingRequests(pendingRequests);
    } catch (error) {
        handleError(error);
    }
}

// Pobieranie oczekujących wniosków
async function fetchPendingRequests(token) {
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/pending_leave_requests/", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        }
    });

    if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login/";
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }

    if (response.status === 403) {
        throw new Error("Brak uprawnień do przeglądania wniosków urlopowych.");
    }

    const data = await response.json();
    
    if (data.status !== "success") {
        throw new Error(data.message || "Nie udało się pobrać wniosków");
    }
    
    return data.leave_requests;
}

// Renderowanie oczekujących wniosków
function renderPendingRequests(requests) {
    const container = document.getElementById("pendingRequests");
    container.innerHTML = "";

    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-requests">
                <div class="empty-icon">✓</div>
                <h3>Brak oczekujących wniosków</h3>
                <p>Obecnie nie ma żadnych wniosków urlopowych do rozpatrzenia.</p>
            </div>
        `;
        return;
    }

    // Tworzenie tabeli wniosków
    const table = document.createElement("table");
    table.className = "requests-table";
    
    // Nagłówek tabeli
    table.innerHTML = `
        <thead>
            <tr>
                <th>Pracownik</th>
                <th>Data</th>
                <th>Powód</th>
                <th>Akcje</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    const tbody = table.querySelector("tbody");
    
    // Dodawanie wierszy
    requests.forEach(request => {
        const row = document.createElement("tr");
        
        // Formatowanie daty
        const date = new Date(request.work_date);
        const formattedDate = date.toLocaleDateString("pl-PL", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${request.worker_name}</td>
            <td>${formattedDate}</td>
            <td>${request.reason}</td>
            <td class="action-buttons">
                <button class="approve-btn" data-id="${request.id}">Zatwierdź</button>
                <button class="reject-btn" data-id="${request.id}">Odrzuć</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    container.appendChild(table);
    
    // Dodanie obsługi przycisków
    initActionButtons();
}

// Inicjalizacja przycisków akcji
function initActionButtons() {
    // Przyciski zatwierdzania
    document.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", (e) => handleReviewAction(e.target.dataset.id, "approve"));
    });
    
    // Przyciski odrzucania
    document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", (e) => handleReviewAction(e.target.dataset.id, "reject"));
    });
}

// Obsługa akcji zatwierdzania/odrzucania
async function handleReviewAction(requestId, action) {
    const token = localStorage.getItem("auth_token");
    
    // Komunikaty potwierdzenia
    const confirmMessages = {
        "approve": "Czy na pewno chcesz zatwierdzić ten wniosek urlopowy?",
        "reject": "Czy na pewno chcesz odrzucić ten wniosek urlopowy?"
    };
    
    // Pytanie o potwierdzenie
    if (!confirm(confirmMessages[action])) {
        return;
    }
    
    // Dezaktywacja przycisków dla tego wniosku
    const row = document.querySelector(`button[data-id="${requestId}"]`).closest("tr");
    const buttons = row.querySelectorAll("button");
    buttons.forEach(btn => btn.disabled = true);
    
    // Dodanie stanu ładowania
    row.classList.add("processing");
    
    try {
        const formData = new FormData();
        formData.append("request_id", requestId);
        formData.append("action", action);
        
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/review_leave_request/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData
        });
        
        if (response.status === 401) {
            localStorage.removeItem("auth_token");
            window.location.href = "/login/";
            throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        
        const data = await response.json();
        
        if (data.status !== "success") {
            throw new Error(data.message || "Nie udało się zaktualizować wniosku");
        }
        
        // Animacja sukcesu i usunięcie wiersza
        row.classList.add("success");
        setTimeout(() => {
            row.style.opacity = "0";
            setTimeout(() => {
                row.remove();
                
                // Sprawdź czy zostały jakieś wnioski
                const remainingRows = document.querySelectorAll(".requests-table tbody tr");
                if (remainingRows.length === 0) {
                    // Odśwież stronę, aby pokazać komunikat o braku wniosków
                    location.reload();
                }
            }, 500);
        }, 1000);
        
    } catch (error) {
        // Przywrócenie stanu przycisków w przypadku błędu
        row.classList.remove("processing");
        buttons.forEach(btn => btn.disabled = false);
        
        alert(error.message || "Wystąpił błąd podczas przetwarzania wniosku.");
    }
}

// Obsługa błędów
function handleError(error) {
    console.error("Błąd:", error);
    
    const container = document.getElementById("pendingRequests");
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Wystąpił błąd</h3>
            <p>${error.message || "Nie udało się połączyć z serwerem"}</p>
            <button onclick="initReviewPage()" class="retry-button">Spróbuj ponownie</button>
        </div>
    `;
}
