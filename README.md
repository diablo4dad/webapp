# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Local Firebase Emulators

The browser app connects to Firebase emulators automatically when served from
`localhost`, `127.0.0.1`, or `::1`. Set `VITE_FIREBASE_EMULATORS=false` to opt
out for a local run, or `VITE_FIREBASE_EMULATORS=true` to force emulator mode.

For Vite development, use separate terminals:

```sh
npm run emulators:backend
npm run emulators:seed
npm start
```

Vite proxies `/api/...` requests to the Functions emulator. The seed command
exports the static catalogue into Firestore emulator data and uploads
`public/icons` into the Storage emulator. It also creates a local editor user:
`editor@d4log.local` / `LocalEditor123!`.

For Firebase Hosting emulator development, build first, then use separate
terminals:

```sh
npm run build
npm run emulators:hosting
npm run emulators:seed
```

Then open `http://127.0.0.1:5000`. Emulator state is imported from and exported
to `tmp/emulators` when using the emulator scripts. To seed a previously
exported Firestore catalogue, pass `-- --documents <path>` to
`npm run emulators:seed`. Use `-- --skip-auth`, `-- --editor-email`, or
`-- --editor-password` to change local editor-user seeding.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
