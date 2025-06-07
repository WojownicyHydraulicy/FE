document.addEventListener("DOMContentLoaded", () => {
    initOrdersPage();
});

// Main initialization function
async function initOrdersPage() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    showLoadingState();
    
    try {
        const orders = await fetchOrders(token);
        renderOrders(orders);
        initEventListeners();
        checkOwnerRole(); // Dodajemy sprawdzenie roli
    } catch (error) {
        handleError(error);
    }
}

// Display loading state
function showLoadingState() {
    const container = document.getElementById("ordersList");
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Ładowanie zleceń...</p>
        </div>
    `;
}

// Fetch orders from API
async function fetchOrders(token) {
    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_orders/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
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
    
    return data.orders;
}

// Render orders to the page
function renderOrders(orders) {
    document.getElementById("mainContent").style.display = "block";
    const container = document.getElementById("ordersList");
    container.innerHTML = "";

    if (!orders.length) {
        container.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">📭</div>
                <h3>Brak aktywnych zleceń</h3>
                <p>Gdy pojawią się nowe zlecenia, zobaczysz je tutaj.</p>
            </div>
        `;
        return;
    }

    // Group and sort orders by date
    const sortedOrders = orders.sort((a, b) => {
        const da = a.appointment_date || "";
        const db = b.appointment_date || "";
        return da.localeCompare(db);
    });

    let lastDate = null;

    sortedOrders.forEach(order => {
        const dateLabel = formatOrderDate(order.appointment_date);

        if (dateLabel !== lastDate) {
            renderDateHeader(container, dateLabel);
            lastDate = dateLabel;
        }

        renderOrderCard(container, order);
    });
}

// Format order date for display
function formatOrderDate(dateString) {
    if (!dateString) return "Brak umówionej wizyty";
    
    return new Date(dateString).toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// Render date group header
function renderDateHeader(container, dateLabel) {
    const header = document.createElement("div");
    header.classList.add("date-group");
    
    const formattedDate = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
    
    header.innerHTML = `
        <span class="date-icon">📅</span>
        <span class="date-text">${formattedDate}</span>
    `;
    
    container.appendChild(header);
}

// Render a single order card
function renderOrderCard(container, order) {
    const card = document.createElement("div");
    card.classList.add("order");
    card.dataset.orderId = order.order_id;

    if (order.priority === "high") {
        card.classList.add("priority-high");
    }

    // Generate billing section if needed
    const billingHTML = order.sales_document === 'Faktura' ? `
        <div class="billing-info">
            <div class="info-header">
                <span class="info-icon">🧾</span>
                <h4>Dane do faktury</h4>
            </div>
            <div class="billing-details">
                <div class="info-row"><span>Nazwa:</span> ${order.billing_name}</div>
                <div class="info-row"><span>Adres:</span> ${order.billing_address}</div>
                <div class="info-row"><span>Miasto:</span> ${order.billing_city}, ${order.billing_postcode}</div>
                <div class="info-row"><span>Kraj:</span> ${order.billing_country}</div>
                <div class="info-row"><span>Telefon:</span> ${order.billing_phone}</div>
                <div class="info-row"><span>NIP:</span> ${order.billing_tax_id}</div>
            </div>
        </div>` : '';

    // Generate photo section if available
    const imageHTML = order.photo_url ? `
        <div class="photo-container">
            <img src="${order.photo_url}" alt="Zdjęcie zlecenia" loading="lazy">
        </div>` : '';

    card.innerHTML = `
        <div class="order-header">
            <h3>
                <span class="location-icon">📍</span>
                ${order.street} ${order.house_nr}, ${order.post_code} ${order.city}
            </h3>
            <div class="price-tag">${order.price}</div>
        </div>
        
        <div class="order-body">
            <div class="info-section">
                <div class="info-columns">
                    <div class="info-column">
                        <div class="info-item">
                            <span class="info-icon">👤</span>
                            <div class="info-content">
                                <div class="info-label">Imię</div>
                                <div class="info-value">${order.name}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📱</span>
                            <div class="info-content">
                                <div class="info-label">Telefon</div>
                                <div class="info-value">${order.telephone}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📧</span>
                            <div class="info-content">
                                <div class="info-label">Email</div>
                                <div class="info-value">${order.email}</div>
                            </div>
                        </div>
                    </div>
                    <div class="info-column">
                        <div class="info-item">
                            <span class="info-icon">🗓️</span>
                            <div class="info-content">
                                <div class="info-label">Data wizyty</div>
                                <div class="info-value">${order.appointment_date || '—'}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">💳</span>
                            <div class="info-content">
                                <div class="info-label">Płatność</div>
                                <div class="info-value">${order.payment_method}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">📃</span>
                            <div class="info-content">
                                <div class="info-label">Dokument</div>
                                <div class="info-value">${order.sales_document}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="description-box">
                    <div class="info-header">
                        <span class="info-icon">📝</span>
                        <h4>Opis zlecenia</h4>
                    </div>
                    <p>${order.description}</p>
                </div>
                
                ${billingHTML}
                ${imageHTML}
            </div>
            
            <div class="ai-comment-section">
                <button class="toggle-response">
                    <span class="comment-icon">💬</span>
                    <span class="comment-text">Komentarz AI</span>
                    <span class="toggle-icon">▼</span>
                </button>
                <div class="client-response">
                    ${order.client_response || '<em>Brak komentarza AI.</em>'}
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="complete-btn" data-action="complete" data-id="${order.order_id}">
                    <span class="btn-icon">✓</span> Zakończ
                </button>
                <button class="delete-btn" data-action="delete" data-id="${order.order_id}">
                    <span class="btn-icon">✕</span> Usuń
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// Initialize all event listeners
function initEventListeners() {
    // Toggle AI comments
    document.querySelectorAll(".toggle-response").forEach(btn => {
        btn.addEventListener("click", toggleAIComment);
        
        // Dodajemy obsługę dotyku z lepszym feedbackiem
        btn.addEventListener("touchstart", function() {
            this.classList.add("touch-active");
        }, { passive: true });
        
        btn.addEventListener("touchend", function() {
            this.classList.remove("touch-active");
        }, { passive: true });
    });
    
    // Action buttons (complete/delete)
    document.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", handleOrderAction);
        
        // Dodajemy obsługę dotyku z lepszym feedbackiem
        btn.addEventListener("touchstart", function() {
            this.classList.add("touch-active");
        }, { passive: true });
        
        btn.addEventListener("touchend", function() {
            this.classList.remove("touch-active");
        }, { passive: true });
    });
    
    // Dodajemy obsługę gestów przesunięcia na kartach zleceń (swipe)
    if ('ontouchstart' in window) {
        setupSwipeActions();
    }
}

// Toggle AI comment visibility
function toggleAIComment(event) {
    const btn = event.currentTarget;
    const responseBox = btn.nextElementSibling;
    const toggleIcon = btn.querySelector('.toggle-icon');
    
    if (responseBox.classList.contains('visible')) {
        responseBox.classList.remove('visible');
        toggleIcon.textContent = '▼';
    } else {
        responseBox.classList.add('visible');
        toggleIcon.textContent = '▲';
    }
}

// Handle order action (complete/delete)
function handleOrderAction(event) {
    const btn = event.currentTarget;
    const action = btn.dataset.action;
    const orderId = btn.dataset.id;
    
    const actionMap = {
        'complete': 'Completed',
        'delete': 'Deleted'
    };
    
    const confirmMessages = {
        'complete': 'Czy na pewno chcesz zakończyć to zlecenie?',
        'delete': 'Czy na pewno chcesz usunąć to zlecenie?'
    };
    
    if (confirm(confirmMessages[action])) {
        finishOrder(orderId, actionMap[action]);
    }
}

// Dodajemy obsługę gestów przesunięcia (swipe) na mobilnych urządzeniach
function setupSwipeActions() {
    const orders = document.querySelectorAll('.order');
    
    orders.forEach(order => {
        let startX, startY, distX, distY;
        const threshold = 100; // minimalny dystans przesunięcia
        
        order.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        order.addEventListener('touchmove', function(e) {
            if (!startX || !startY) return;
            
            distX = e.touches[0].clientX - startX;
            distY = e.touches[0].clientY - startY;
            
            // Jeśli przesunięcie pionowe jest większe, pozwalamy na normalne przewijanie
            if (Math.abs(distY) > Math.abs(distX)) return;
            
            // W przeciwnym razie zapobiegamy domyślnemu przewijaniu
            if (Math.abs(distX) > 10) e.preventDefault();
        }, { passive: false });
        
        order.addEventListener('touchend', function(e) {
            if (!startX || !startY) return;
            
            // Jeśli przesunięcie w lewo jest wystarczająco duże
            if (distX < -threshold) {
                // Znajdź przycisk "Zakończ" i symuluj kliknięcie
                const completeBtn = order.querySelector('.complete-btn');
                if (completeBtn) {
                    order.classList.add('swipe-left-animation');
                    setTimeout(() => {
                        completeBtn.click();
                    }, 300);
                }
            }
            
            // Jeśli przesunięcie w prawo jest wystarczająco duże
            if (distX > threshold) {
                // Znajdź przycisk "Usuń" i symuluj kliknięcie
                const deleteBtn = order.querySelector('.delete-btn');
                if (deleteBtn) {
                    order.classList.add('swipe-right-animation');
                    setTimeout(() => {
                        deleteBtn.click();
                    }, 300);
                }
            }
            
            // Reset wartości
            startX = null;
            startY = null;
            distX = null;
            distY = null;
        }, { passive: true });
    });
}

// Display error message
function handleError(error) {
    console.error("Błąd:", error);
    
    const container = document.getElementById("ordersList");
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Wystąpił błąd</h3>
            <p>${error.message || "Nie udało się połączyć z serwerem"}</p>
            <button onclick="initOrdersPage()" class="retry-button">Spróbuj ponownie</button>
        </div>
    `;
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

// Complete or delete an order
async function finishOrder(orderId, status) {
    const token = localStorage.getItem("auth_token");
    
    // Show processing state
    const orderCard = document.querySelector(`.order[data-order-id="${orderId}"]`);
    if (orderCard) {
        orderCard.classList.add('processing');
    }

    try {
        const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/finish_order/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                order_id: orderId,
                order_status: status
            })
        });

        const result = await response.json();
        
        if (result.status === "success") {
            // Success animation
            if (orderCard) {
                orderCard.classList.add('completed');
                setTimeout(() => {
                    orderCard.classList.add('fade-out');
                    setTimeout(() => {
                        // Reload page after animation completes
                        window.location.reload();
                    }, 500);
                }, 1000);
            } else {
                window.location.reload();
            }
        } else {
            throw new Error(result.message || "Wystąpił nieznany błąd");
        }
    } catch (err) {
        console.error("Błąd przy aktualizacji statusu:", err);
        alert("Nie udało się zaktualizować statusu zlecenia.");
        
        // Remove processing state
        if (orderCard) {
            orderCard.classList.remove('processing');
        }
    }
}
