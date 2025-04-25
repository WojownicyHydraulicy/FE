from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def create_order_form():
    return render_template("create_order.html")

@app.route("/login/")
def login_page():
    return render_template("login.html")

@app.route("/orders_panel/")
def orders_panel():
    return render_template("orders.html")

@app.route("/orders_on_addresses/")
def orders_on_addresses_page():
    return render_template("orders_on_addresses.html")


if __name__ == "__main__":
    app.run(debug=True)
