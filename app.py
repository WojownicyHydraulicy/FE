from flask import Flask, render_template, request, jsonify
import requests
from flask import Response

app = Flask(__name__)

@app.route("/")
def create_order_form():
    return render_template("create_order.html")

@app.route("/register/")               # <--- DODANE
def register_page():
    return render_template("register.html")

@app.route("/login/")
def login_page():
    return render_template("login.html")

@app.route("/orders_panel/")
def orders_panel():
    return render_template("orders.html")

@app.route("/orders_on_addresses/")
def orders_on_addresses_page():
    return render_template("orders_on_addresses.html")

# Nowe trasy dla zarządzania wnioskami urlopowymi
@app.route("/leave_requests/")
def leave_requests_page():
    return render_template("leave_requests.html")

@app.route("/review_leave_requests/")
def review_leave_requests_page():
    return render_template("review_leave_requests.html")

@app.route("/edit_orders/")
def edit_orders_page():
    return render_template("edit_orders.html")

# Dodajemy trasę do panelu administratora (jeśli jeszcze nie istnieje)
@app.route("/admin_panel/")
def admin_panel_page():
    return render_template("admin_panel.html")

# Dodajemy trasę proxy dla operacji promocji/degradacji użytkowników
@app.route("/api/users/<username>/<action>", methods=["PUT"])
def proxy_user_role_change(username, action):
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