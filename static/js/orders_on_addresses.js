document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    const resultsDiv = document.getElementById("searchResults");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("auth_token");
        if (!token) {
            window.location.href = "/login/";
            return;
        }

        const formData = new FormData(form);

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
        resultsDiv.innerHTML = "";

        if (data.status === "success") {
            if (data.orders.length === 0) {
                resultsDiv.innerHTML = "<p style='grid-column:1/-1;text-align:center;'>Brak zleceń dla podanego adresu.</p>";
            } else {
                data.orders.forEach(order => {
                    const div = document.createElement("div");
                    div.className = "result-card";
                    div.innerHTML = `
                        <h3>${order.name}</h3>
                        <div class="result-meta">${order.street} ${order.house_nr}, ${order.post_code} ${order.city}</div>
                        <p><b>Telefon:</b> ${order.telephone}</p>
                        <p><b>Opis:</b> ${order.description}</p>
                        ${order.photo_url ? `<img src="${order.photo_url}" alt="Zdjęcie zlecenia">` : ""}
                    `;
                    resultsDiv.appendChild(div);
                });
            }
        } else {
            resultsDiv.innerHTML = `<p style="color:red;grid-column:1/-1;text-align:center;">${data.message}</p>`;
        }
    });
});