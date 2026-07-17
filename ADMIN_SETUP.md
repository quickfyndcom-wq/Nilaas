# Admin Dashboard Setup Guide

## Overview
The Store Dashboard now includes admin functionality for managing the entire platform. Admin access is granted based on email configuration.

## Setting Up Admin Access

### 1. Configure Admin Email

Add your admin email to your environment variables file (`.env.local`):

```env
NEXT_PUBLIC_ADMIN_EMAIL=your-admin@example.com
```

For multiple admins, separate emails with commas:
```env
NEXT_PUBLIC_ADMIN_EMAIL=admin1@example.com,admin2@example.com
```

### 2. Create Admin Account

**Option A: Email/Password Login**
1. Create a Firebase account with your admin email
2. Use Firebase Authentication console to set up the email/password
3. Login at `/store/login` with your credentials

**Option B: Google Sign-In**
1. Login at `/store/login` using the "Sign in with Google" button
2. Use the Google account with your configured admin email
3. System will automatically grant admin access

### 3. Login Methods

#### Email & Password
- Navigate to `/store/login`
- Enter your email and password
- Click "Sign In"

#### Google OAuth
- Navigate to `/store/login`
- Click "Sign in with Google"
- Select your admin Google account
- Automatic redirect to dashboard

## Admin Features

Once logged in with admin email, you'll see additional sections:

### 👑 Admin Section
- **All Stores** - View and manage all seller stores
- **Approve Products** - Review and approve pending products
- **Homepage Hero** - Manage hero banner slides
- **Homepage Sections** - Manage homepage content sections
- **Grid Products** - Feature products on homepage

## Access Levels

### Admin Users (with configured email)
✅ Full dashboard access
✅ All seller features
✅ Admin management features
✅ Homepage content management
✅ Approve/reject products
✅ View all stores

### Regular Sellers
✅ Store dashboard access
✅ Manage own products
✅ Process orders
✅ View customers
✅ Manage coupons & shipping
❌ No admin features

### Regular Users
❌ No dashboard access
❌ Must request seller access

## Security Notes

⚠️ **Important:**
- Keep your `NEXT_PUBLIC_ADMIN_EMAIL` secure
- Use strong passwords for admin accounts
- Admin email is checked on every login
- Changing admin email requires app restart
- Only verified emails can access admin features

## Troubleshooting

**Q: I set admin email but still don't see admin features**
- Clear browser cache and reload
- Verify email matches exactly (case-sensitive)
- Check `.env.local` file for proper formatting
- Restart development server

**Q: Google sign-in not working**
- Ensure Firebase Google Auth is enabled
- Check Firebase console for OAuth configuration
- Verify redirect URIs are configured

**Q: Login shows "You do not have access"**
- Your email doesn't match `NEXT_PUBLIC_ADMIN_EMAIL`
- You don't have seller access in database
- Contact platform admin to grant access
