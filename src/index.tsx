import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Application from './Application';
import reportWebVitals from './reportWebVitals';
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDT_Sh2rufVus0ISono5Pb4ZGnU1LDF8CU",
    authDomain: "d4log-bfc60.firebaseapp.com",
    projectId: "d4log-bfc60",
    storageBucket: "d4log-bfc60.appspot.com",
    messagingSenderId: "37093938675",
    appId: "1:37093938675:web:a529225838441b0780ae86",
    measurementId: "G-DJ7FMXPHKQ"
};

// Instantiate Firebase
const application = initializeApp(firebaseConfig);
const analytics = getAnalytics(application); // required
console.log("Firebase initialised.", {
    name: analytics.app.name,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Application />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Disables console logging in production
if (process.env.NODE_ENV !== 'development') {
    console.log = function () {
        return;
    };
}
