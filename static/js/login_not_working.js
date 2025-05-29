document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    const res = await fetch("https://users-management-api-409909044870.europe-central2.run.app/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || JSON.stringify(json));
    // zapis tokenu
    localStorage.setItem("auth_token", json.token);
    window.location.href = "/orders_panel/";
  } catch (err) {
    document.getElementById("loginError").innerText = err.message;
  }
});