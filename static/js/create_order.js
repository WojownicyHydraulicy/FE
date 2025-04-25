document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("orderForm");
    const spinner = document.getElementById("spinner");
    const submitBtn = document.getElementById("submitBtn");
    const resultDiv = document.getElementById("result");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        spinner.style.display = "block";
        submitBtn.disabled = true;
        resultDiv.innerHTML = "";

        const formData = new FormData(form);

        try {
            const response = await fetch("https://orders-management-api-409909044870.europe-central2.run.app/create_order/", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.status === "success") {
                resultDiv.innerHTML = `<p style="color:green;">Zgłoszenie zostało utworzone!</p>`;
                form.reset();
            } else {
                resultDiv.innerHTML = `<p style="color:red;">Błąd: ${result.message}</p>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p style="color:red;">Wystąpił błąd połączenia z API lub z odpowiedzią serwera.</p>`;
        } finally {
            spinner.style.display = "none";
            submitBtn.disabled = false;
        }
    });
});