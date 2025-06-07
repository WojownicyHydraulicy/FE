document.addEventListener("DOMContentLoaded", () => {
    initLeaveRequestsPage();
});

// Inicjalizacja strony wniosków urlopowych
async function initLeaveRequestsPage() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    try {
        // Pobierz dostępne dni
        await fetchAvailableDays(token);
        
        // Dodaj obsługę formularza
        initFormHandlers();
        
        // Sprawdź rolę użytkownika
        checkOwnerRole();
    } catch (error) {
        showStatusMessage("Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.", "error");
    }
}

// Pobieranie dostępnych dni pracy
async function fetchAvailableDays(token) {
    try {
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_working_days/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("auth_token");
            window.location.href = "/login/";
            throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }

        const data = await response.json();
        
        if (data.status !== "success") {
            throw new Error(data.message || "Nie udało się pobrać dostępnych dni");
        }
        
        populateDateSelect(data.working_days);
    } catch (error) {
        console.error("Błąd:", error);
        throw error;
    }
}

// Wypełnianie selecta dostępnymi dniami
function populateDateSelect(workingDays) {
    const dateSelect = document.getElementById("workDate");
    
    // Wyczyść istniejące opcje (oprócz domyślnej)
    while (dateSelect.options.length > 1) {
        dateSelect.remove(1);
    }
    
    if (workingDays.length === 0) {
        const option = document.createElement("option");
        option.disabled = true;
        option.text = "Brak dostępnych dni";
        dateSelect.add(option);
        dateSelect.disabled = true;
        document.querySelector('.submit-btn').disabled = true;
        showStatusMessage("Nie masz żadnych dostępnych dni do wnioskowania o urlop.", "info");
        return;
    }
    
    // Dodaj nowe opcje
    workingDays.forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        
        // Formatowanie daty dla czytelności
        const date = new Date(day);
        const formattedDate = date.toLocaleDateString("pl-PL", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        option.text = formattedDate;
        dateSelect.add(option);
    });
}

// Inicjalizacja obsługi formularza
function initFormHandlers() {
    const form = document.getElementById("leaveRequestForm");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const reasonInput = document.getElementById("reason");
    const charCounter = document.getElementById("charCounter");
    
    // Dodany kod - obsługa licznika znaków
    reasonInput.addEventListener("input", function() {
        const maxLength = this.maxLength;
        const currentLength = this.value.length;
        charCounter.textContent = `${currentLength}/${maxLength} znaków`;
        
        // Dodanie klasy ostrzeżenia gdy zbliżamy się do limitu
        if (currentLength >= maxLength * 0.8 && currentLength < maxLength) {
            charCounter.className = "char-counter warning";
        } else if (currentLength >= maxLength) {
            charCounter.className = "char-counter error";
        } else {
            charCounter.className = "char-counter";
        }
    });
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const dateSelect = document.getElementById("workDate");
        
        // Walidacja
        if (!dateSelect.value) {
            showStatusMessage("Wybierz datę.", "error");
            return;
        }
        
        if (!reasonInput.value.trim()) {
            showStatusMessage("Podaj powód urlopu.", "error");
            return;
        }
        
        // Pokazanie stanu ładowania
        loadingIndicator.style.display = "flex";
        form.style.opacity = "0.6";
        form.querySelector('button[type="submit"]').disabled = true;
        
        try {
            await submitLeaveRequest(dateSelect.value, reasonInput.value);
            
            // Sukces
            form.reset();
            showStatusMessage("Wniosek urlopowy został złożony pomyślnie.", "success");
            
            // Odśwież dostępne dni
            const token = localStorage.getItem("auth_token");
            await fetchAvailableDays(token);
        } catch (error) {
            showStatusMessage(error.message || "Nie udało się złożyć wniosku urlopowego.", "error");
        } finally {
            // Ukryj ładowanie
            loadingIndicator.style.display = "none";
            form.style.opacity = "1";
            form.querySelector('button[type="submit"]').disabled = false;
        }
    });
}

// Wysyłanie wniosku urlopowego
async function submitLeaveRequest(workDate, reason) {
    const token = localStorage.getItem("auth_token");
    
    const formData = new FormData();
    formData.append("work_date", workDate);
    formData.append("reason", reason);
    
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/create_leave_request/", {
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
        throw new Error(data.message || "Nie udało się złożyć wniosku");
    }
    
    return data;
}

// Sprawdź czy użytkownik jest właścicielem i pokaż/ukryj odpowiednie elementy
async function checkOwnerRole() {
    try {
        const token = localStorage.getItem("auth_token");
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
        // Nie pokazujemy widocznego błędu użytkownikowi
    }
}

// Wyświetlanie komunikatów statusu
function showStatusMessage(message, type = "info") {
    const statusDiv = document.getElementById("requestStatus");
    statusDiv.textContent = message;
    statusDiv.className = "status-message";
    statusDiv.classList.add(type);
    
    // Scrolluj do komunikatu
    statusDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
    
    // Usuń klasę po 5 sekundach dla typów innych niż error
    if (type !== "error") {
        setTimeout(() => {
            statusDiv.classList.remove(type);
            statusDiv.textContent = "";
        }, 5000);
    }
}
