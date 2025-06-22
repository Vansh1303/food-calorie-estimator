# Food Calorie Estimator 🍎

A modern web application that uses AI to estimate calories from food images. Built with React, TypeScript, and Google's Gemini AI.

## Features ✨

- 📸 Real-time camera capture for food images
- 📤 Image upload functionality
- 🤖 AI-powered calorie estimation using Google's Gemini
- 📱 Responsive design for all devices
- 🔒 Secure API key handling
- ⚡ Fast and efficient image processing

## Tech Stack 🛠

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI API
- Modern JavaScript (ES6+)

## Prerequisites 📋

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- Modern web browser with camera access

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
4. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
5. Add your API key to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Usage 📱

1. **Using Camera**:
   - Click the camera icon
   - Allow camera permissions
   - Take a photo of your food
   - Get instant calorie estimation

2. **Uploading Image**:
   - Click the upload icon
   - Select a food image from your device
   - Get instant calorie estimation

## Environment Variables 🔑

| Variable | Description |
|----------|-------------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key |

## Development 🛠

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security 🔒

- API keys are stored in environment variables
- Camera access requires user permission
- HTTPS required for camera functionality

## Browser Support 🌐

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Google Gemini AI for the calorie estimation API
- React and Vite teams for the amazing tools
- All contributors and users of this project

## Contact 📧

Vansh - [GitHub](https://github.com/Vansh1303)

Project Link: [https://github.com/Vansh1303/food-calorie-estimator](https://github.com/Vansh1303/food-calorie-estimator)

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API key secure and restrict it in Google Cloud Console
- The `.env.local` file is already in `.gitignore`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- React
- TypeScript
- Vite
- Gemini API
