document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("username").value.trim(),
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value
  };
  try {
    const res = await fetch("https://users-management-api-409909044870.europe-central2.run.app/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || JSON.stringify(json));
    // rejestracja ok → przekieruj na logowanie
    window.location.href = "/login/";
  } catch (err) {
    document.getElementById("registerError").innerText = err.message;
  }
});