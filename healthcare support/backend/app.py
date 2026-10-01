from flask import Flask, request, render_template, redirect, url_for, flash, session
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
import os
import re
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend')
CORS(app)
app.secret_key = os.getenv('SECRET_KEY', 'healthcare-secret-key')

# MongoDB connection
db = None
try:
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client[os.getenv('DB_NAME', 'healthcare_support')]
    camps_collection = db['camps']
    bookings_collection = db['bookings']
    users_collection = db['users']
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

from flask.json.provider import DefaultJSONProvider

class UpdatedJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

app.json = UpdatedJSONProvider(app)

def send_email_notification(camp_data):
    try:
        sender_email = os.getenv('SENDER_EMAIL', 'kishorenalabothula106@gmail.com')
        sender_password = os.getenv('SENDER_PASSWORD', 'alia itxj llaz copu')

        if db is None:
            print("❌ Database not available")
            return

        all_emails = set()

        for user in users_collection.find({}, {'email': 1, 'name': 1}):
            if user.get('email') and user.get('name'):
                all_emails.add((user['email'], user['name']))

        for booking in bookings_collection.find({}, {'email': 1, 'name': 1}):
            if booking.get('email') and booking.get('name'):
                all_emails.add((booking['email'], booking['name']))

        if not all_emails:
            print("❌ No users found to notify")
            return

        print(f"📧 Sending to {len(all_emails)} users")

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)

        for email, name in all_emails:
            body = f"""Dear {name},

A new health camp has been scheduled!

Camp Details:
- Name: {camp_data['name']}
- Date: {camp_data['date']}
- Time: {camp_data['time']}
- Location: {camp_data['location']}
- Services: {', '.join(camp_data['services'])}
- Available Slots: {camp_data['availableSlots']}

{camp_data.get('description', '')}

Login to your account to book an appointment!

Best regards,
Healthcare Support Team"""

            msg = MIMEText(body)
            msg['Subject'] = f"New Health Camp: {camp_data['name']}"
            msg['From'] = sender_email
            msg['To'] = email
            server.send_message(msg)
            print(f"✅ Email sent to {email}")

        server.quit()
        print(f"🎉 All {len(all_emails)} notifications sent!")

    except Exception as e:
        print(f"❌ Email failed: {e}")


@app.route('/')
def index():
    if not session.get('user_logged_in'):
        return redirect(url_for('register'))

    if db is None:
        flash('Database connection unavailable', 'error')
        return render_template('index.html', camps=[])

    try:
        camps = list(camps_collection.find({}, {'_id': 1, 'name': 1, 'date': 1, 'time': 1, 'location': 1, 'services': 1, 'description': 1, 'availableSlots': 1}))
        return render_template('index.html', camps=camps)
    except Exception:
        flash('Failed to retrieve camps', 'error')
        return render_template('index.html', camps=[])


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        password = request.form.get('password', '').strip()

        if not all([name, email, phone, password]):
            flash('All fields are required', 'error')
            return render_template('register.html')

        if not re.match(r'^\d{10}$', phone):
            flash('Phone must be 10 digits', 'error')
            return render_template('register.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters', 'error')
            return render_template('register.html')

        if db is None:
            flash('Database connection unavailable', 'error')
            return render_template('register.html')

        if users_collection.find_one({'email': email}):
            flash('Email already registered', 'error')
            return render_template('register.html')

        users_collection.insert_one({
            'name': name, 'email': email, 'phone': phone,
            'password': password, 'createdAt': datetime.now(timezone.utc)
        })
        session['user_logged_in'] = True
        session['user_email'] = email
        session['user_name'] = name
        flash('Registration successful! Welcome!', 'success')
        return redirect(url_for('index'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()

        if not email or not password:
            flash('Email and password are required', 'error')
            return render_template('login.html')

        if db is None:
            flash('Database connection unavailable', 'error')
            return render_template('login.html')

        user = users_collection.find_one({'email': email, 'password': password})
        if user:
            session['user_logged_in'] = True
            session['user_email'] = email
            session['user_name'] = user['name']
            flash('Login successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'success')
    return redirect(url_for('register'))


@app.route('/camps')
def view_camps():
    return redirect(url_for('index'))


@app.route('/book/<camp_id>', methods=['GET', 'POST'])
def book_appointment(camp_id):
    if not session.get('user_logged_in'):
        return redirect(url_for('login'))

    if db is None:
        flash('Database connection unavailable', 'error')
        return redirect(url_for('index'))

    try:
        camp = camps_collection.find_one({'_id': ObjectId(camp_id)})
    except InvalidId:
        flash('Invalid camp ID', 'error')
        return redirect(url_for('index'))

    if not camp:
        flash('Camp not found', 'error')
        return redirect(url_for('index'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        age = request.form.get('age', '0')

        if not all([name, phone, email]):
            flash('All fields are required', 'error')
            return render_template('booking.html', camp=camp)

        if not re.match(r'^\d{10}$', phone):
            flash('Phone must be 10 digits', 'error')
            return render_template('booking.html', camp=camp)

        if camp['availableSlots'] <= 0:
            flash('No available slots', 'error')
            return render_template('booking.html', camp=camp)

        result = bookings_collection.insert_one({
            'campId': camp_id, 'name': name, 'phone': phone,
            'email': email, 'age': int(age) if age.isdigit() else 0,
            'createdAt': datetime.now(timezone.utc)
        })
        camps_collection.update_one({'_id': ObjectId(camp_id)}, {'$inc': {'availableSlots': -1}})
        flash(f'Booking confirmed! ID: {str(result.inserted_id)[:8].upper()}', 'success')
        return redirect(url_for('index'))

    return render_template('booking.html', camp=camp)


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if username == 'admin' and password == 'admin123':
            session['admin_logged_in'] = True
            flash('Login successful', 'success')
            return redirect(url_for('admin_panel'))
        else:
            flash('Invalid credentials', 'error')

    return render_template('admin_login.html')


@app.route('/admin')
def admin_panel():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    if db is None:
        flash('Database connection unavailable', 'error')
        return render_template('admin_panel.html', camps=[], bookings=[])

    camps = list(camps_collection.find({}))
    bookings = list(bookings_collection.find({}))
    return render_template('admin_panel.html', camps=camps, bookings=bookings)


@app.route('/admin/camps/add', methods=['GET', 'POST'])
def add_camp():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    if request.method == 'POST':
        return handle_camp_form()

    return render_template('camp_form.html', camp=None, action='Add')


@app.route('/admin/camps/edit/<camp_id>', methods=['GET', 'POST'])
def edit_camp(camp_id):
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    if db is None:
        flash('Database connection unavailable', 'error')
        return redirect(url_for('admin_panel'))

    try:
        camp = camps_collection.find_one({'_id': ObjectId(camp_id)})
    except InvalidId:
        flash('Invalid camp ID', 'error')
        return redirect(url_for('admin_panel'))

    if not camp:
        flash('Camp not found', 'error')
        return redirect(url_for('admin_panel'))

    if request.method == 'POST':
        return handle_camp_form(camp_id)

    return render_template('camp_form.html', camp=camp, action='Edit')


def handle_camp_form(camp_id=None):
    if db is None:
        flash('Database connection unavailable', 'error')
        return redirect(url_for('admin_panel'))

    try:
        camp_data = {
            'name': request.form.get('name', '').strip()[:100],
            'date': request.form.get('date', '').strip(),
            'time': request.form.get('time', '').strip(),
            'location': request.form.get('location', '').strip()[:200],
            'services': [s.strip() for s in request.form.get('services', '').split(',') if s.strip()],
            'description': request.form.get('description', '').strip()[:500],
            'availableSlots': int(request.form.get('availableSlots', 0))
        }

        if not all([camp_data['name'], camp_data['date'], camp_data['time'], camp_data['location'], camp_data['services']]):
            flash('All fields are required', 'error')
            return redirect(request.url)

        if camp_data['availableSlots'] <= 0:
            flash('Available slots must be a positive number', 'error')
            return redirect(request.url)

        if camp_id:
            camps_collection.update_one(
                {'_id': ObjectId(camp_id)},
                {'$set': {**camp_data, 'updatedAt': datetime.now(timezone.utc)}}
            )
            flash('Camp updated successfully', 'success')
        else:
            camps_collection.insert_one({**camp_data, 'createdAt': datetime.now(timezone.utc)})
            send_email_notification(camp_data)
            flash('Camp created successfully! Notifications sent.', 'success')

        return redirect(url_for('admin_panel'))

    except Exception as e:
        print(f"Camp form error: {e}")
        flash('Failed to save camp', 'error')
        return redirect(request.url)


@app.route('/admin/camps/delete/<camp_id>', methods=['POST'])
def delete_camp_route(camp_id):
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    if db is None:
        flash('Database connection unavailable', 'error')
        return redirect(url_for('admin_panel'))

    try:
        result = camps_collection.delete_one({'_id': ObjectId(camp_id)})
        if result.deleted_count == 0:
            flash('Camp not found', 'error')
        else:
            bookings_collection.delete_many({'campId': camp_id})
            flash('Camp deleted successfully', 'success')
    except Exception as e:
        print(f"Delete error: {e}")
        flash('Failed to delete camp', 'error')

    return redirect(url_for('admin_panel'))


@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
