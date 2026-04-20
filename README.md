# Cleaning Reporting System

A modern, responsive web app for Swachh Nagar that lets citizens submit cleanliness complaints and admins manage them using Firebase.

## Folder structure

- `index.html` — main website with complaint form, preview feed, and admin dashboard
- `styles.css` — custom theme and responsive styling
- `script.js` — Firebase authentication, Firestore complaint storage, dynamic UI logic
- `README.md` — setup instructions

## Features

- Clean homepage with complaint submission form
- Bootstrap-based responsive UI with green/blue styling
- Public complaint feed with search and status filter
- Firebase Firestore storage for complaints
- Firebase Authentication for admin login
- Admin dashboard with Accept / Completed / Reject controls
- Dynamic complaint status updates
- Timestamp shown for each complaint
- Loading animation and success alerts
- Mobile friendly layout
- Font Awesome icons

## Setup steps for Firebase

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In your project, go to **Authentication** > **Get Started** and enable **Email/Password** sign-in.
3. Add an admin user under **Users** with an email and password.
4. Go to **Firestore Database** and create a database in **Production** or **Test** mode.
5. In the Firestore database, create a collection named `complaints`.

## Add Firebase configuration

1. Open `script.js`.
2. Replace the `firebaseConfig` object values with your Firebase project's config.

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Running locally

Because the app uses ES modules, open it using a local web server instead of directly opening the file in the browser.

Option 1: Python

```bash
python -m http.server 5500
```

Option 2: Node

```bash
npx http-server -p 5500
```

Then open `http://127.0.0.1:5500` in your browser.

## Admin login

- Click **Admin Login** in the top navigation.
- Enter the email and password for the admin user created in Firebase Authentication.
- After login, the admin dashboard appears with all complaints from Firestore.

## How to use

- Fill the complaint form with name, location, issue type, description, and optional image.
- Click **Submit Complaint** and wait for confirmation.
- Use the **Complaint Feed** section to search and filter reports.
- Admin can accept, reject, or complete complaints directly from the dashboard.

## Notes

- The app stores complaints in Firestore, with each record including a timestamp and optional image URL.
- The admin dashboard updates in real time whenever Firestore data changes.
