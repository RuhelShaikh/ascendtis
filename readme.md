## Technologies Used

- **Node.js**: Runtime environment for executing JavaScript code server-side.
- **Express**: Web application framework for Node.js.
- **MySQL**: A relational database for storing data
- **Postman**: Tool for API testing (for testing API endpoints).
- **Railway**: Deployment platform.

## API Endpoints

**User Routes (/api/users)**

1. Register User
   POST /api/users/register
   Register a new user.

2. Login User
   POST /api/users/login
   Log in a user and receive a JWT token.

3. Forgot Password
   POST /api/users/forgot-password
   Send a password reset link to the user's email.

4. Reset Password Form
   GET /api/users/reset-password
   Renders the password reset form from the reset link.

5. Reset Password Submission
   POST /api/users/reset-password
   Resets the password with the new one.

6. Deactivate User Account
   PATCH /api/users/deactivate (Protected)
   Deactivate the current user's account.

7. Update User Details
   PATCH /api/users/update (Protected)
   Update user details like username or email.

8. Update Password
   PATCH /api/users/update-password (Protected)
   Update the user's password by providing the old and new password.

**Admin Routes**

1. Register Admin
   POST /api/admin/register
   Register a new admin account.

2. Login Admin
   POST /api/admin/login
   Log in an admin and receive a JWT token.

3. Get All Users
   GET /api/admin/users
   Retrieve all users.

4. Update User Details
   PATCH /api/admin/users/:id
   Update a user's details by providing the user ID.

5. Delete User
   DELETE /api/admin/users/:id
   Delete a user account by providing the user ID.

## Deployment

The application has been deployed on Railway. You can test the APIs using the provided endpoints.
