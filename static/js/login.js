document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const token = document.getElementById("token").value.trim();

    if (token.length > 0) {
        localStorage.setItem("auth_token", token);
        window.location.href = "/orders_panel/";
    } else {
        document.getElementById("loginError").innerText = "Podaj token.";
    }
});
