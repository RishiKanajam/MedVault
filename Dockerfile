# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA-1DgJPuu_iF_jXi0ocA2HSJXsaG0Nhvw
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=apacsolutionchallenge-460009.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=apacsolutionchallenge-460009
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=apacsolutionchallenge-460009.appspot.com
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=200280322925
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:200280322925:web:d93f0f3b70c4f59211e064
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XCLS8JGY2G

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"] 