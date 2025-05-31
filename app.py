from flask import Flask, render_template

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

if __name__ == "__main__":
    app.run(debug=True)