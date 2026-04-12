# Dot-Herbs E-commerce Platform

A full-stack e-commerce platform for herbal products built with React, Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Product Management**: CRUD operations for products with image uploads
- **Shopping Cart**: Persistent cart with localStorage
- **Order Management**: Complete order lifecycle with Stripe payments
- **Reviews & Ratings**: User reviews and product ratings
- **Admin Dashboard**: Comprehensive admin panel for managing products, orders, and users
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Security**: Input validation, rate limiting, CORS, and secure password hashing

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- React Hot Toast
- Lucide React Icons

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs
- Cloudinary (image uploads)
- Stripe (payments)
- Nodemailer (email)

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## 🔧 Installation

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add your environment variables:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dot-herbs
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   JWT_REFRESH_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   FROM_NAME=Dot-Herbs
   FROM_EMAIL=noreply@dotherbs.com
   CLIENT_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the root directory (if not already there)

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_APP_NAME=Dot-Herbs
   VITE_APP_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

Make sure MongoDB is running on your system. The application will automatically create the necessary collections.

To create an admin account, run:

```bash
cd backend
npm run seed
```

The admin account can be customized using `backend/.env`:

```env
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@dotherbs.com
ADMIN_PASSWORD=Admin@123
ADMIN_ROLE=admin
```

## 📧 Email Configuration

For password reset functionality, configure your SMTP settings in the backend `.env` file. You can use Gmail, SendGrid, or any other SMTP provider.

## 💳 Payment Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add them to your environment variables
4. For testing, use Stripe's test card numbers

## 🖼️ Image Upload Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Add them to your backend environment variables

## 🚀 Deployment

### Backend Deployment

- Use services like Heroku, Railway, or Vercel
- Set environment variables in your deployment platform
- Make sure MongoDB is accessible from your deployment environment

### Frontend Deployment

- Build the project: `npm run build`
- Deploy the `dist` folder to services like Vercel, Netlify, or Firebase Hosting
- Set environment variables in your deployment platform

## 📱 Usage

1. Register a new user account or use the admin account
2. Browse products and add them to cart
3. Complete checkout with Stripe payment
4. Leave reviews and ratings for products
5. Admin users can manage products, orders, and users

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 📚 API Documentation

The API endpoints are documented in the backend routes. Key endpoints include:

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/products` - Get products
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@dotherbs.com or create an issue in the repository.
