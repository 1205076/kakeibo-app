from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # 🌟 新しいテーブル：ユーザーのログイン情報
    c.execute('''CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY, user TEXT, item_name TEXT, target_amount INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, user TEXT, type TEXT, date TEXT, amount INTEGER, category TEXT, memo TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS category_budgets (id INTEGER PRIMARY KEY, user TEXT, category TEXT, amount INTEGER)''')
    conn.commit()
    conn.close()

# 🌟 新規登録とログインの処理
@app.route('/api/auth', methods=['POST'])
def auth():
    data = request.json
    action = data.get('action') # 'login' か 'register'
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    if action == 'register':
        try:
            c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            conn.commit()
            return jsonify({"status": "success", "message": "登録完了！ログインしてください。"})
        except sqlite3.IntegrityError:
            return jsonify({"status": "error", "message": "そのユーザー名はすでに使われています。"})
        finally:
            conn.close()
            
    elif action == 'login':
        c.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = c.fetchone()
        conn.close()
        if user:
            return jsonify({"status": "success", "message": "ログイン成功！"})
        else:
            return jsonify({"status": "error", "message": "ユーザー名かパスワードが違います。"})

@app.route('/api/transactions', methods=['GET', 'POST'])
def manage_transactions():
    if request.method == 'POST':
        data = request.json
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        transaction_type = data.get('type', 'expense')
        c.execute("INSERT INTO transactions (user, type, date, amount, category, memo) VALUES (?, ?, ?, ?, ?, ?)",(data['user'], transaction_type, data['date'], data['amount'], data['category'], data['memo']))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    else:
        user = request.args.get('user')
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT id, type, date, amount, category, memo FROM transactions WHERE user = ? ORDER BY date DESC", (user,))
        transactions = [{'id': row[0], 'type': row[1], 'date': row[2], 'amount': row[3], 'category': row[4], 'memo': row[5]} for row in c.fetchall()]
        conn.close()
        return jsonify(transactions)

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/budgets', methods=['GET', 'POST'])
def manage_budgets():
    if request.method == 'POST':
        data = request.json
        user = data['user']
        category = data['category']
        amount = data['amount']
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("DELETE FROM category_budgets WHERE user = ? AND category = ?", (user, category))
        c.execute("INSERT INTO category_budgets (user, category, amount) VALUES (?, ?, ?)", (user, category, amount))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    else:
        user = request.args.get('user')
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT category, amount FROM category_budgets WHERE user = ?", (user,))
        budgets = {row[0]: row[1] for row in c.fetchall()}
        conn.close()
        return jsonify(budgets)

@app.route('/api/wishlist', methods=['GET', 'POST'])
def manage_wishlist():
    if request.method == 'POST':
        data = request.json
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO wishlist (user, item_name, target_amount) VALUES (?, ?, ?)",(data['user'], data['item_name'], data['target_amount']))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    else:
        user = request.args.get('user')
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT id, item_name, target_amount FROM wishlist WHERE user = ?", (user,))
        items = [{'id': row[0], 'name': row[1], 'amount': row[2]} for row in c.fetchall()]
        conn.close()
        return jsonify(items)

@app.route('/api/wishlist/<int:item_id>', methods=['DELETE'])
def delete_wishlist(item_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("DELETE FROM wishlist WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8000, debug=True)