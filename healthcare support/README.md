# Smart Healthcare Support - Health Camp Booking System

A web-based application that connects people with upcoming health camps in their locality and allows them to book appointments easily.

## Features

- **Camp Listings**: View all nearby upcoming health camps with details
- **Slot Booking System**: Book appointments with patient information
- **Confirmation System**: Booking confirmation with details
- **Admin Panel**: Manage health camps and view registrations
- **Mobile-Responsive Design**: Works on both mobile and desktop devices

## Quick Start

### Prerequisites
- Python 3.8+
- MongoDB
- Web browser

### Installation

1. **Extract the zip file** to your desired location

2. **Set up the backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start MongoDB:**
   - Install MongoDB Community Server
   - Start MongoDB service: `net start MongoDB` (Windows)

4. **Run the application:**
   - **Easy way**: Double-click `start_app.bat`
   - **Manual way**:
     ```bash
     # Terminal 1 - Start Backend
     cd backend
     python app.py
     
     # Terminal 2 - Open Frontend
     cd frontend
     # Open index.html in your browser
     ```

### Default Access

- **Website**: Open `frontend/index.html` in your browser
- **Admin Login**: 
  - Username: `admin`
  - Password: `admin123`

## Project Structure

```
healthcare-support/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── start.py           # Startup script
├── frontend/
│   ├── index.html         # Main website
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
├── start_app.bat          # Easy startup script
└── README.md              # This file
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/camps` - Get all health camps
- `POST /api/bookings` - Book an appointment

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `POST /api/camps` - Create new camp
- `PUT /api/camps/{id}` - Update camp
- `DELETE /api/camps/{id}` - Delete camp
- `GET /api/bookings` - View all bookings

## Usage

### For Users
1. Visit the website
2. Browse available health camps
3. Click "Book Appointment" on desired camp
4. Fill in personal details
5. Receive booking confirmation

### For Admins
1. Click "Admin Login" button
2. Enter credentials (admin/admin123)
3. Manage camps (Add/Edit/Delete)
4. View all bookings

## Configuration

Edit `backend/.env` file to customize:
```
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=healthcare_support
FLASK_DEBUG=True
PORT=5000
```

## Technologies Used

- **Backend**: Python, Flask, MongoDB, PyMongo
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: MongoDB
- **Styling**: CSS Grid, Flexbox, Font Awesome icons

## Features in Detail

### Camp Management
- Add new health camps with details
- Edit existing camp information
- Delete camps and associated bookings
- View camp statistics

### Booking System
- Real-time slot availability
- Form validation
- Booking confirmation with ID
- Mobile number validation

### Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interface
- Fast loading times

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is installed and running
   - Check connection string in `.env` file

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing Python processes

3. **Module Not Found**
   - Run: `pip install -r requirements.txt`
   - Ensure you're in the backend directory

### Support
For issues or questions, check the console logs in your browser's developer tools and the terminal output from the Python server.

## License
This project is for educational purposes.