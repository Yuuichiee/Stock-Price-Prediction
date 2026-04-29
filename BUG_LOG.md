# Predictifi.AI - Bug Log & Troubleshooting

## Bug 01: The "Infinite Loading" Bug

**Date Resolved:** April 28, 2026
**Location:** `frontend/src/App.jsx`

### **Symptoms**
When opening the frontend application in the browser (`http://localhost:5173`), the screen would get stuck indefinitely on the initial spinning `<LoadingScreen />` wheel. The login page and dashboard would never load, effectively freezing the user out of the app.

### **Root Cause**
When the React application first mounts, it attempts to verify if the user is already logged in by making a network request to Supabase via `supabase.auth.getSession()`.

- While waiting for Supabase to respond, the `session` state is set to `undefined`, which tells React to render the `LoadingScreen` component.
- If this network request failed (because of no internet connection, a blocked network request, or a Supabase timeout), the request threw a silent error. 
- Because there was no `.catch()` block written to catch this error, the `session` state never updated. It remained `undefined` forever, creating an infinite loading loop.

### **The Fix**
A safety net (`.catch()`) was added to the promise chain in `App.jsx`. Now, if the connection to the authentication database fails for any reason, the app catches the error, stops the loading spinner by setting the session to `null`, and renders the Login Page. 

**Code Implemented:**
```javascript
// frontend/src/App.jsx
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    setSession(session);
  })
  .catch((err) => {
    console.error("Supabase auth error:", err);
    setSession(null); // Fix: Rejects to 'null' to prevent infinite loading screen
  });
```

### **Takeaway**
Always ensure that asynchronous network requests (`Promises`) have a `.catch()` or are wrapped in a `try...catch` block. Failing to handle "unhappy paths" (like a dropped internet connection) is a common cause of frozen interfaces in modern web applications.
