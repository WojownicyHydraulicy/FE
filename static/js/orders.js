document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        window.location.href = "/login/";
        return;
    }

    const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/fetch_orders/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login/";
        return;
    }

    const data = await response.json();
    document.getElementById("mainContent").style.display = "block";

    const container = document.getElementById("ordersList");

    if (data.status === "success") {
        if (data.orders.length === 0) {
            container.innerHTML = "<p class='empty-orders'>Brak aktywnych zleceń.</p>";
            return;
        }

        container.innerHTML = "";
        data.orders.forEach(order => {
            const div = document.createElement("div");
            div.classList.add("order"); // dodanie klasy dla lepszej stylizacji
            div.innerHTML = `
                <h3>Adres: ${order.street} ${order.house_nr}, ${order.post_code} ${order.city}</h3>
                <p>Imię: ${order.name}</p>
                <p>Telefon: ${order.telephone}</p>
                <p>Opis: ${order.description}</p>
                ${order.photo_url ? `<img src="${order.photo_url}" alt="Zdjęcie zlecenia">` : ""}
                <div class="order-buttons">
                    <button onclick="finishOrder('${order.order_id}', 'Completed')">Zakończ</button>
                    <button onclick="finishOrder('${order.order_id}', 'Deleted')">Usuń</button>
                </div>
                <hr>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = `<p style="color:red;">${data.message}</p>`;
    }
});


async function finishOrder(orderId, status) {
    const token = localStorage.getItem("auth_token");

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
    alert(result.message);

    if (result.status === "success") {
        window.location.reload();
    }
}