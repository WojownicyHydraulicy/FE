"""
@file app.py
@brief Główna aplikacja Flask uruchamiająca serwer i zarządzająca routingiem.
"""


from flask import Flask, render_template, request, jsonify
import requests
from flask import Response

app = Flask(__name__)

@app.route("/")
def create_order_form():
    """
    @brief Obsługuje trasę główną aplikacji i wyświetla formularz zamówienia usługi.
    @return Szablon HTML z formularzem zamówienia (create_order.html).
    """
    return render_template("create_order.html")

@app.route("/register/")               # <--- DODANE
def register_page():
    """
    @brief Obsługuje trasę rejestracji i wyświetla formularz rejestracji.
    @return Szablon HTML z formularzem rejestracji (register.html).
    """
    return render_template("register.html")

@app.route("/login/")
def login_page():
    """
    @brief Obsługuje trasę logowania i wyświetla formularz logowania.
    @return Szablon HTML z formularzem logowania (login.html).
    """
    return render_template("login.html")

@app.route("/orders_panel/")
def orders_panel():
    """
    @brief Obsługuje trasę panelu zamówień i wyświetla listę wszystkich zamówień.
    @return Szablon HTML z panelem zamówień (orders.html).
    """
    return render_template("orders.html")

@app.route("/orders_on_addresses/")
def orders_on_addresses_page():
    """
    @brief Obsługuje trasę wyświetlania napraw przypisanych do adresów.
    @return Szablon HTML z listą napraw dla konkretnego adresu (orders_on_addresses.html).
    """
    return render_template("orders_on_addresses.html")

# Nowe trasy dla zarządzania wnioskami urlopowymi
@app.route("/leave_requests/")
def leave_requests_page():
    """
    @brief Obsługuje trasę do zarządzania wnioskami urlopowymi.
    @return Szablon HTML z panelem zarządzania wnioskami urlopowymi (leave_requests.html).
    """
    return render_template("leave_requests.html")

@app.route("/review_leave_requests/")
def review_leave_requests_page():
    """
    @brief Obsługuje trasę przeglądu wniosków urlopowych.
    @return Szablon HTML z listą wniosków urlopowych (review_leave_requests.html).
    """
    return render_template("review_leave_requests.html")

@app.route("/edit_orders/")
def edit_orders_page():
    """
    @brief Obsługuje trasę do formularza edycji danych zamówienia.
    @return Szablon HTML z formularzem edycji zamówienia (edit_orders.html).
    """
    return render_template("edit_orders.html")

# Dodajemy trasę do panelu administratora (jeśli jeszcze nie istnieje)
@app.route("/admin_panel/")
def admin_panel_page():
    """
    @brief Obsługuje trasę do panelu administratora.
    @return Szablon HTML z panelem administratora (admin_panel.html).
    """
    return render_template("admin_panel.html")

# Dodajemy trasę proxy dla operacji promocji/degradacji użytkowników
@app.route("/api/users/<username>/<action>", methods=["PUT"])
def proxy_user_role_change(username, action):
    """
    @brief Trasa proxy do promocji lub degradacji użytkowników przez API zewnętrzne.
    @param username Nazwa użytkownika, którego dotyczy operacja.
    @param action Rodzaj operacji: 'promote' lub 'demote'.
    @return Odpowiedź z API (sukces lub błąd).
    """
    if action not in ["promote", "demote"]:
        return jsonify({"error": "Invalid action"}), 400
    
    # Pobierz token autoryzacyjny z nagłówka żądania
    auth_header = request.headers.get('Authorization')
    
    headers = {}
    if auth_header:
        headers['Authorization'] = auth_header
    
    try:
        response = requests.put(
            f"https://orders-management-api-409909044870.europe-central2.run.app/users/{username}/{action}",
            headers=headers
        )
        
        return Response(
            response.text, 
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)