# **App Name**: Cave Explorer 4D

## Core Features:

- Cave Listing: Display a list of available caves fetched from Firestore, showing their cover image and name.
- Spot Listing: List spots within a cave from Firestore, indicating PRO spots for FREE users.
- Immersive Spot Experience: Display a fullscreen, dark-themed view of a spot, including image, title, and description. Implement audio narration and haptic feedback (vibrations) using vibration patterns specified in Firestore.
- Haptic Feedback: Provide customized haptic feedback (vibrations) for certain spot actions using navigator.vibrate, configurable from Firestore. Provide 'rumble' and 'drip' presets.
- Google Authentication: Implement Google Sign-In with Firebase Authentication to manage user accounts.
- Access Control: Control access to PRO spots based on user role (FREE/PRO) stored in Firestore.
- Personalized Ambience: Dynamically adjust audio ambience of each cave environment. An AI tool evaluates data fields associated with the caves or spots to determine the perfect background music/ambience. Volume and spatialization would be affected in real time.

## Style Guidelines:

- Primary color: Deep stone gray (#555B6E) to reflect the cave environment.
- Background color: Dark slate gray (#2A2B32) to enhance the immersive, dark cave atmosphere. 
- Accent color: Pale blue (#ACB9C9) to evoke a sense of water and underground springs; it creates good contrast with the dark background and primary color.
- Body and headline font: 'PT Sans', a humanist sans-serif that combines a modern look and a little warmth or personality, is suitable for both headlines and body text.
- Use simple, clean icons representing cave elements like rocks, water droplets, and paths.
- Mobile-first design with large, one-hand-operable buttons.
- Subtle animations for transitions between spots and loading states, like a gentle fade or shift.