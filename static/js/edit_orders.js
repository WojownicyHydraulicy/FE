document.addEventListener("DOMContentLoaded", () => {
    initEditOrdersPage();
});

// Inicjalizacja strony edycji zleceń
async function initEditOrdersPage() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    try {
        // Sprawdź rolę użytkownika
        await checkOwnerRole();
        
        // Pobierz aktywne zlecenia do wyboru
        await fetchActiveOrders();
        
        // Pobierz listę pracowników do przypisania
        await fetchEmployees();
        
        // Dodaj obsługę formularza
        initFormHandlers();
        
    } catch (error) {
        showStatusMessage(error.message || "Wystąpił błąd podczas ładowania strony.", "error");
    }
}

// Sprawdź czy użytkownik jest właścicielem
async function checkOwnerRole() {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/check_role/", {
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
    
    const data = await response.json();
    
    if (data.role !== "OWNER") {
        window.location.href = "/orders_panel/";
        throw new Error("Brak dostępu. Tylko właściciel może edytować zlecenia.");
    }
    
    // Pokazujemy przyciski dla właściciela
    document.querySelectorAll('.owner-button').forEach(btn => {
        btn.style.display = 'flex';
    });
}

// Pobierz aktywne zlecenia do wyboru
async function fetchActiveOrders() {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_orders/", {
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
        throw new Error(data.message || "Nie udało się pobrać zleceń");
    }
    
    populateOrdersDropdown(data.orders);
}

// Wypełnij dropdown z zamówieniami
function populateOrdersDropdown(orders) {
    const orderSelect = document.getElementById("orderSelect");
    
    // Wyczyść istniejące opcje (oprócz domyślnej)
    while (orderSelect.options.length > 1) {
        orderSelect.remove(1);
    }
    
    if (orders.length === 0) {
        const option = document.createElement("option");
        option.disabled = true;
        option.text = "Brak dostępnych zleceń";
        orderSelect.add(option);
        return;
    }
    
    // Dodaj wszystkie zlecenia do dropdown
    orders.forEach(order => {
        const option = document.createElement("option");
        option.value = order.order_id;
        
        // Format opisu zlecenia: "Imię, adres (ID)"
        option.text = `${order.name}, ${order.street} ${order.house_nr} (ID: ${order.order_id})`;
        orderSelect.add(option);
    });
    
    // Dodaj obsługę zmiany wyboru
    orderSelect.addEventListener("change", handleOrderSelection);
}

// Obsługa wyboru zlecenia
async function handleOrderSelection(event) {
    const orderId = event.target.value;
    
    if (!orderId) {
        document.getElementById("orderDetails").style.display = "none";
        return;
    }
    
    try {
        await fetchOrderDetails(orderId);
        document.getElementById("orderDetails").style.display = "grid";
    } catch (error) {
        showStatusMessage(error.message || "Nie udało się pobrać szczegółów zlecenia.", "error");
        document.getElementById("orderDetails").style.display = "none";
    }
}

// Pobierz szczegóły wybranego zlecenia
async function fetchOrderDetails(orderId) {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch(`https://orders-management-api-409909044870.europe-central2.run.app/get_order/${orderId}`, {
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
        throw new Error("Brak uprawnień do przeglądania szczegółów zlecenia.");
    }
    
    const data = await response.json();
    
    if (data.status !== "success") {
        throw new Error(data.message || "Nie udało się pobrać szczegółów zlecenia");
    }
    
    populateOrderForm(data.order);
}

// Wypełnij formularz danymi zlecenia
function populateOrderForm(order) {
    // Podstawowe pola formularza
    document.getElementById("orderId").value = order.order_id;
    document.getElementById("name").value = order.name || "";
    document.getElementById("telephone").value = order.telephone || "";
    document.getElementById("email").value = order.email || "";
    document.getElementById("city").value = order.city || "";
    document.getElementById("street").value = order.street || "";
    document.getElementById("house_nr").value = order.house_nr || "";
    document.getElementById("post_code").value = order.post_code || "";
    document.getElementById("description").value = order.description || "";
    document.getElementById("urgency").value = order.urgency || "Niski priorytet";
    document.getElementById("payment_method").value = order.payment_method || "Gotówka";
    document.getElementById("sales_document").value = order.sales_document || "Paragon";
    document.getElementById("order_status").value = order.order_status || "New";
    document.getElementById("appointment_date").value = order.appointment_date || "";
    document.getElementById("price").value = order.price || "";
    
    // Dane faktury
    document.getElementById("billing_name").value = order.billing_name || "";
    document.getElementById("billing_address").value = order.billing_address || "";
    document.getElementById("billing_city").value = order.billing_city || "";
    document.getElementById("billing_postcode").value = order.billing_postcode || "";
    document.getElementById("billing_country").value = order.billing_country || "";
    document.getElementById("billing_phone").value = order.billing_phone || "";
    document.getElementById("billing_tax_id").value = order.billing_tax_id || "";
    
    // Pokazanie/ukrycie pól faktury
    const invoiceFields = document.getElementById("invoiceFields");
    if (order.sales_document === "Faktura") {
        invoiceFields.style.display = "block";
    } else {
        invoiceFields.style.display = "none";
    }
    
    // Przypisany pracownik
    if (order.assigned_to) {
        const assignedSelect = document.getElementById("assignedTo");
        for (let i = 0; i < assignedSelect.options.length; i++) {
            if (assignedSelect.options[i].value === order.assigned_to) {
                assignedSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Zdjęcie zlecenia
    const photoContainer = document.getElementById("orderPhoto");
    if (order.photo_url) {
        photoContainer.innerHTML = `<img src="${order.photo_url}" alt="Zdjęcie zlecenia">`;
    } else {
        photoContainer.innerHTML = `<div class="no-photo">Brak zdjęcia</div>`;
    }
    
    // Komentarz AI
    const aiCommentBox = document.getElementById("aiComment");
    if (order.client_response) {
        aiCommentBox.innerHTML = order.client_response;
        aiCommentBox.classList.remove("no-comment");
    } else {
        aiCommentBox.innerHTML = `<div class="no-comment">Brak komentarza AI</div>`;
    }
}

// Pobierz listę pracowników
async function fetchEmployees() {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/get_all_employees/", {
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
        throw new Error("Brak uprawnień do przeglądania listy pracowników.");
    }
    
    const data = await response.json();
    
    if (data.status !== "success") {
        throw new Error(data.message || "Nie udało się pobrać listy pracowników");
    }
    
    populateEmployeesDropdown(data.employees);
}

// Wypełnij dropdown z pracownikami
function populateEmployeesDropdown(employees) {
    const employeeSelect = document.getElementById("assignedTo");
    
    // Wyczyść istniejące opcje (oprócz domyślnej)
    while (employeeSelect.options.length > 1) {
        employeeSelect.remove(1);
    }
    
    if (employees.length === 0) {
        const option = document.createElement("option");
        option.disabled = true;
        option.text = "Brak dostępnych pracowników";
        employeeSelect.add(option);
        return;
    }
    
    // Dodaj wszystkich pracowników do dropdown
    employees.forEach(employee => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.text = employee.name;
        employeeSelect.add(option);
    });
}

// Inicjalizacja obsługi formularza
function initFormHandlers() {
    const form = document.getElementById("editOrderForm");
    const cancelBtn = document.getElementById("cancelBtn");
    
    // Obsługa zmiany typu dokumentu (paragon/faktura)
    const salesDocumentSelect = document.getElementById("sales_document");
    salesDocumentSelect.addEventListener("change", function() {
        const invoiceFields = document.getElementById("invoiceFields");
        invoiceFields.style.display = this.value === "Faktura" ? "block" : "none";
    });
    
    // Obsługa przycisku anuluj
    cancelBtn.addEventListener("click", function() {
        document.getElementById("orderDetails").style.display = "none";
        document.getElementById("orderSelect").selectedIndex = 0;
    });
    
    // Obsługa wysyłki formularza
    form.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        try {
            await updateOrder(new FormData(form));
            showStatusMessage("Zlecenie zostało zaktualizowane pomyślnie.", "success");
        } catch (error) {
            showStatusMessage(error.message || "Nie udało się zaktualizować zlecenia.", "error");
        }
    });
}

// Aktualizacja zlecenia
async function updateOrder(formData) {
    const token = localStorage.getItem("auth_token");
    
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/update_order/", {
        method: "PUT",
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
    
    if (response.status === 403) {
        throw new Error("Brak uprawnień do aktualizacji zlecenia.");
    }
    
    const data = await response.json();
    
    if (data.status !== "success") {
        throw new Error(data.message || "Nie udało się zaktualizować zlecenia");
    }
    
    return data;
}

// Wyświetlanie komunikatów statusu
function showStatusMessage(message, type = "info") {
    const statusContainer = document.getElementById("statusMessages");
    
    // Stwórz element komunikatu
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("status-message");
    messageDiv.classList.add(`${type}-message`);
    
    // Dodaj ikonę w zależności od typu
    const iconMap = {
        success: "✅",
        error: "❌",
        info: "ℹ️"
    };
    
    messageDiv.innerHTML = `<span class="status-icon">${iconMap[type]}</span> ${message}`;
    
    // Dodaj komunikat na górze kontenera
    statusContainer.prepend(messageDiv);
    
    // Usuń komunikat po 5 sekundach (oprócz błędów)
    if (type !== "error") {
        setTimeout(() => {
            messageDiv.style.opacity = "0";
            messageDiv.style.transform = "translateY(-10px)";
            setTimeout(() => {
                statusContainer.removeChild(messageDiv);
            }, 300);
        }, 5000);
    }
}
