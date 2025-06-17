/**
 * Funkcja inicjująca działanie po załadowaniu DOM.
 */
document.addEventListener("DOMContentLoaded", function() {
    // Obsługa logowania
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            // Pobierz dane logowania
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const loginError = document.getElementById("loginError");
            const loginButton = document.querySelector("#loginForm button[type='submit']");
            
            // Walidacja podstawowa
            if (!email || !password) {
                loginError.innerText = "Podaj email i hasło.";
                return;
            }
            
            // Zmień stan przycisku na ładowanie
            loginButton.disabled = true;
            loginButton.innerHTML = "Logowanie...";
            loginError.innerText = "";
            
            try {
                // Wywołaj API logowania
                const response = await fetch("https://users-management-api-409909044870.europe-central2.run.app/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.token) {
                    // Zapisz token i przekieruj
                    localStorage.setItem("auth_token", data.token);
                    window.location.href = "/orders_panel/";
                } else {
                    // Pokaż błąd z API lub domyślny komunikat
                    const errorMsg = data.detail || data.message || "Nieprawidłowy email lub hasło.";
                    loginError.style.display = "block";
                    loginError.innerText = errorMsg;
                    loginButton.disabled = false;
                    loginButton.innerHTML = "Zaloguj się";
                }
            } catch (error) {
                // Obsługa błędów sieciowych
                console.error("Błąd logowania:", error);
                loginError.style.display = "block";
                loginError.innerText = "Wystąpił błąd podczas logowania. Spróbuj ponownie później.";
                loginButton.disabled = false;
                loginButton.innerHTML = "Zaloguj się";
            }
        });
    }
    
    // Obsługa rejestracji
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            // Pobierz dane rejestracji
            const username = document.getElementById("username").value.trim();
            const firstName = document.getElementById("firstName").value.trim();
            const lastName = document.getElementById("lastName").value.trim();
            const city = document.getElementById("city").value.trim(); // Added city field
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();
            const registerError = document.getElementById("registerError");
            const registerSuccess = document.getElementById("registerSuccess");
            const registerButton = document.querySelector("#registerForm button[type='submit']");
            
            // Podstawowa walidacja
            if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
                registerError.innerText = "Wypełnij wszystkie pola formularza.";
                registerError.style.display = "block";
                registerSuccess.style.display = "none";
                return;
            }
            
            if (password !== confirmPassword) {
                registerError.innerText = "Hasła nie są identyczne.";
                registerError.style.display = "block";
                registerSuccess.style.display = "none";
                return;
            }
            
            // Zmień stan przycisku na ładowanie
            registerButton.disabled = true;
            registerButton.innerHTML = "Rejestracja...";
            registerError.style.display = "none";
            registerSuccess.style.display = "none";
            
            try {
                // Wywołaj API rejestracji
                const response = await fetch("https://users-management-api-409909044870.europe-central2.run.app/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        firstName: firstName,
                        lastName: lastName,
                        city: city, // Include city in request
                        email: email,
                        password: password,
                        confirmPassword: confirmPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Pokaż komunikat sukcesu
                    registerSuccess.innerText = "Rejestracja przebiegła pomyślnie. Możesz się teraz zalogować.";
                    registerSuccess.style.display = "block";
                    registerForm.reset();
                    
                    // Opcjonalnie: przekieruj do formularza logowania lub bezpośrednio zaloguj
                    if (typeof switchToLogin === 'function') {
                        setTimeout(switchToLogin, 2000);
                    }
                } else {
                    // Pokaż błąd z API
                    registerError.innerText = data.message || "Błąd podczas rejestracji. Spróbuj ponownie.";
                    registerError.style.display = "block";
                }
            } catch (error) {
                // Obsługa błędów sieciowych
                console.error("Błąd rejestracji:", error);
                registerError.innerText = "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.";
                registerError.style.display = "block";
            } finally {
                registerButton.disabled = false;
                registerButton.innerHTML = "Zarejestruj się";
            }
        });
    }
    
    // Przełączanie między logowaniem a rejestracją (jeśli istnieją odpowiednie elementy)
    const loginLink = document.getElementById("showLogin");
    const registerLink = document.getElementById("showRegister");
    const loginContainer = document.getElementById("loginContainer");
    const registerContainer = document.getElementById("registerContainer");
    
    // Funkcja przełączania na logowanie
    window.switchToLogin = function() {
        if (loginContainer && registerContainer) {
            loginContainer.style.display = "block";
            registerContainer.style.display = "none";
        }
    };
    
    // Funkcja przełączania na rejestrację
    window.switchToRegister = function() {
        if (loginContainer && registerContainer) {
            loginContainer.style.display = "none";
            registerContainer.style.display = "block";
        }
    };
    
    // Dodanie obsługi zdarzeń do przycisków przełączania
    if (loginLink) {
        loginLink.addEventListener("click", function(e) {
            e.preventDefault();
            switchToLogin();
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener("click", function(e) {
            e.preventDefault();
            switchToRegister();
        });
    }
});
