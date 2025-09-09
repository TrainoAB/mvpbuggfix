import React from 'react';
import './page.css';

const InfoPage = () => {
  return (
    <div className="container">
      {/* Left navigation */}
      <div className="leftNav">
        <div className="sectionContainer">
          <h3>Functions</h3>
          <ul>
            <li>
              <a href="#walkTime">walkTime</a>
            </li>
            <li>
              <a href="#shortenText">shortenText</a>
            </li>
            <li>
              <a href="#getCategories">getCategories</a>
            </li>
            <li>
              <a href="#getUserDetails">getUserDetails</a>
            </li>
            <li>
              <a href="#getUserDetailsAlias">getUserDetailsAlias</a>
            </li>
            <li>
              <a href="#isValidEmail">isValidEmail</a>
            </li>
            <li>
              <a href="#isValidPhoneNumber">isValidPhoneNumber</a>
            </li>
            <li>
              <a href="#logout">logout</a>
            </li>
            <li>
              <a href="#checkSession">checkSession</a>
            </li>
            <li>
              <a href="#localStorageTimestamp">localStorageTimestamp</a>
            </li>
          </ul>
        </div>
        <div className="separator"></div>
        <div className="sectionContainer">
          <h3>Database</h3>
          <ul>
            <li>
              <a href="#db">db.php</a>
            </li>
            <li>
              <a href="#dbconfig">dbconfig.php</a>
            </li>
            <li>
              <a href="#salt">salt.php</a>
            </li>
            <li>
              <a href="#functions">functions.php</a>
            </li>
            <li>
              <a href="#signup">signup.php</a>
            </li>
            <li>
              <a href="#login">login.php</a>
            </li>
            <li>
              <a href="#logout">logout.php</a>
            </li>
            <li>
              <a href="#check_session">check_session.php</a>
            </li>
            <li>
              <a href="#confirmemail">confirmemail.php</a>
            </li>
            <li>
              <a href="#getcategories">getcategories.php</a>
            </li>
            <li>
              <a href="#save_email">save_email.php</a>
            </li>
            <li>
              <a href="#search_trainer">search_trainer.php</a>
            </li>
            <li>
              <a href="#admin_search">admin_search.php</a>
            </li>
            <li>
              <a href="#getuser_details">getuser_details.php</a>
            </li>
          </ul>
        </div>
        <div className="separator"></div>
        <div className="sectionContainer">
          <h3>Context</h3>
          <ul>
            <li>
              <a href="#traincategories">traincategories</a>
            </li>
            <li>
              <a href="#showTerms">showTerms</a>
            </li>
            <li>
              <a href="#isKeyboardOpen">isKeyboardOpen</a>
            </li>
            <li>
              <a href="#isMobile">isMobile</a>
            </li>
            <li>
              <a href="#mapRef">mapRef</a>
            </li>
            <li>
              <a href="#userID">userID</a>
            </li>
            <li>
              <a href="#isLoggedin">isLoggedin</a>
            </li>
            <li>
              <a href="#userData">userData</a>
            </li>
          </ul>
        </div>
        {/* Add more sections as needed */}
      </div>

      {/* Right content */}
      <div className="rightContent">
        <div className="pageTitle">
          <h1>Information Page</h1>
          <p>
            This page provides an overview of various functions and their explanations with examples. You can navigate
            through the sections using the links on the left.
          </p>
        </div>
        {/* Explanations */}
        <div id="walkTime" className="box">
          <h2>walkTime</h2>
          <p>Converts kilometers to time.</p>
          <p>
            This function calculates the time required to walk a certain distance in hours and minutes. It assumes a
            walking speed of 5 kilometers per hour. The input is the distance in kilometers. The output is a string
            representing the time in the format "X hours, Y minutes".
          </p>
          <pre>
            {`
            import { walkTime } from './functions';

            const MyComponent = () => {
              const distance = 10; // Distance in kilometers
              const time = walkTime(distance);

              console.log('Time to walk', distance, 'km:', time); // Output: "Time to walk 10 km: 2 hours, 0 minutes"

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="shortenText" className="box">
          <h2>shortenText</h2>
          <p>Shortens text to a specified length.</p>
          <p>
            This function truncates a given text to a specified maximum length, preserving word boundaries. If the text
            exceeds the maximum length, it is shortened and appended with '...' to indicate truncation. The input is the
            text to be shortened, and the optional length parameter determines the maximum length (default is 200
            characters). The output is the shortened text.
          </p>
          <pre>
            {`
            import { shortenText } from './functions';

            const MyComponent = () => {
              const longText = 'This is a very long text that needs to be shortened. It contains a lot of information that may not be relevant to the user.';
              const shortText = shortenText(longText, 30);

              console.log('Original text:', longText);
              console.log('Shortened text:', shortText); // Output: "Shortened text: This is a very long text that..."

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="getCategories" className="box">
          <h2>getCategories</h2>
          <p>Fetches categories from the server.</p>
          <p>
            This function sends a GET request to the server to fetch categories data. It takes a `setTraincategories`
            function as an argument, which is used to update the state with the fetched categories data. The function
            returns a Promise that resolves with the fetched data or rejects with an error.
          </p>
          <pre>
            {`
            import { getCategories } from './functions';

            const MyComponent = () => {
              const [categories, setCategories] = useState([]);

              useEffect(() => {
                getCategories(setCategories)
                  .then((data) => {
                    // Handle the fetched data
                    console.log('Fetched categories:', data);
                  })
                  .catch((error) => {
                    // Handle the error
                    console.error('Error fetching categories:', error);
                  });
              }, []);

              return (
                <div>
                  {/* Render categories */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="getUserDetails" className="box">
          <h2>getUserDetails</h2>
          <p>Fetches user details by user ID.</p>
          <p>
            This function sends a GET request to the server to fetch user details based on the provided user ID. It
            takes the `userId` as an argument and returns a Promise that resolves with the fetched user data or rejects
            with an error.
          </p>
          <pre>
            {`
            import { getUserDetails } from './functions';

            const MyComponent = () => {
              const [userData, setUserData] = useState(null);
              const userId = 123; // Replace with the actual user ID

              useEffect(() => {
                getUserDetails(userId)
                  .then((data) => {
                    // Handle the fetched user data
                    setUserData(data);
                  })
                  .catch((error) => {
                    // Handle the error
                    console.error('Error fetching user data:', error);
                  });
              }, [userId]);

              return (
                <div>
                  {/* Render user data */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="getUserDetailsAlias" className="box">
          <h2>getUserDetailsAlias</h2>
          <p>Fetches user details by user alias.</p>
          <p>
            This function sends a GET request to the server to fetch user details based on the provided user alias. It
            takes the `alias` as an argument and returns a Promise that resolves with the fetched user data or rejects
            with an error.
          </p>
          <pre>
            {`
            import { getUserDetailsAlias } from './functions';

            const MyComponent = () => {
              const [userData, setUserData] = useState(null);
              const userAlias = 'johndoe'; // Replace with the actual user alias

              useEffect(() => {
                getUserDetailsAlias(userAlias)
                  .then((data) => {
                    // Handle the fetched user data
                    setUserData(data);
                  })
                  .catch((error) => {
                    // Handle the error
                    console.error('Error fetching user data:', error);
                  });
              }, [userAlias]);

              return (
                <div>
                  {/* Render user data */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="isValidEmail" className="box">
          <h2>isValidEmail</h2>
          <p>Validates an email address.</p>
          <p>
            This function takes an email address as input and returns a boolean value indicating whether the email is
            valid or not. It uses a regular expression to validate the email format.
          </p>
          <pre>
            {`
            import { isValidEmail } from './functions';

            const MyComponent = () => {
              const email = 'example@example.com';
              const isValid = isValidEmail(email);

              console.log('Is email valid?', isValid); // Output: true

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="isValidPhoneNumber" className="box">
          <h2>isValidPhoneNumber</h2>
          <p>Validates a phone number.</p>
          <p>
            This function takes a phone number as input and returns a boolean value indicating whether the phone number
            is valid or not. It uses a regular expression to validate the phone number format (E.164 format).
          </p>
          <pre>
            {`
            import { isValidPhoneNumber } from './functions';

            const MyComponent = () => {
              const phoneNumber = '+46701234567';
              const isValid = isValidPhoneNumber(phoneNumber);

              console.log('Is phone number valid?', isValid); // Output: true

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="logout" className="box">
          <h2>logout</h2>
          <p>Logs out the user and clears session data.</p>
          <p>
            This function logs out the user by sending a POST request to the server with the user ID and session ID. It
            also clears the session data from the local storage and redirects the user to the login page. The function
            takes three arguments: `isLoggedin` (a reference to the login state), `userData` (a reference to the user
            data state), and `navigation` (the Next.js navigation instance).
          </p>
          <pre>
            {`
            import { logout } from './functions';
            import { useNavigation } from 'next/navigation';

            const MyComponent = () => {
              const navigation = useNavigation();
              const isLoggedin = useRef(true); // Replace with your actual login state
              const userData = useRef({ /* User data */ }); // Replace with your actual user data

              const handleLogout = () => {
                logout(isLoggedin, userData, navigation);
              };

              return (
                <div>
                  <button onClick={handleLogout}>Logout</button>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="checkSession" className="box">
          <h2>checkSession</h2>
          <p>Checks if the user session is active.</p>
          <p>
            This function sends a POST request to the server with the user ID and session ID to check if the user
            session is active. It returns a Promise that resolves with a boolean value indicating whether the session is
            active or not. The function takes two arguments: `isLoggedin` (a reference to the login state) and
            `navigation` (the Next.js navigation instance).
          </p>
          <pre>
            {`
            import { checkSession } from './functions';
            import { useNavigation } from 'next/navigation';

            const MyComponent = () => {
              const navigation = useNavigation();
              const isLoggedin = useRef(true); // Replace with your actual login state

              useEffect(() => {
                checkSession(isLoggedin, navigation)
                  .then((isActive) => {
                    // Handle the session status
                    console.log('Session is active:', isActive);
                  })
                  .catch((error) => {
                    // Handle the error
                    console.error('Error checking session:', error);
                  });
              }, []);

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="localStorageTimestamp" className="box">
          <h2>localStorageTimestamp</h2>
          <p>Stores the current timestamp in the local storage.</p>
          <p>
            This function generates the current timestamp in the format "YYYY-MM-DD HH:mm:ss" and stores it in the local
            storage under the key "timestamp".
          </p>
          <pre>
            {`
            import { localStorageTimestamp } from './functions';

            const MyComponent = () => {
              useEffect(() => {
                localStorageTimestamp();
                // The current timestamp is now stored in localStorage under the key "timestamp"
              }, []);

              return (
                <div>
                  {/* Render component */}
                </div>
              );
            };
            `}
          </pre>
        </div>

        <div id="db" className="box">
          <h2>db.php</h2>
          <p>
            This file is responsible for creating the database connection and defining the database tables. It includes
            the following tables:
          </p>
          <ul>
            <li>notifyme: Stores email addresses for notification purposes.</li>
            <li>
              users: Stores user information such as usertype, name, email, password, and other user-related data.
            </li>
            <li>user_education: Stores user education information.</li>
            <li>user_files: Stores user-uploaded files and their links.</li>
            <li>user_train_categories: Stores the training categories associated with each user.</li>
            <li>rating: Stores user ratings.</li>
            <li>categories: Stores available training categories.</li>
            <li>chat: Stores chat messages between users.</li>
          </ul>
        </div>

        <div id="dbconfig" className="box">
          <h2>dbconfig.php</h2>
          <p>
            This file contains the database configuration settings, such as the hostname, database name, username, and
            password. It is likely excluded from the codebase for security reasons.
          </p>
        </div>

        <div id="salt" className="box">
          <h2>salt.php</h2>
          <p>
            This file defines a salt value used for password hashing. The salt value is a random string that is
            concatenated with the password before hashing to increase the security of the hashed password.
          </p>
        </div>

        <div id="functions" className="box">
          <h2>functions.php</h2>
          <p>This file contains various utility functions used throughout the application, such as:</p>
          <ul>
            <li>isValidEmail: Checks if an email address is valid.</li>
            <li>sendJson: Sends a JSON response.</li>
            <li>generateEmailConfirmationHash: Generates a hash for email confirmation.</li>
            <li>isEmailExists: Checks if an email already exists in the database.</li>
            <li>hashPassword: Hashes a password with a salt.</li>
            <li>sendJsonError: Sends a JSON error response.</li>
            <li>verifyPassword: Verifies a password against a hashed password and salt.</li>
            <li>sendEmail: Sends an email using SMTP settings.</li>
          </ul>
        </div>

        <div id="signup" className="box">
          <h2>signup.php</h2>
          <p>This file handles the user registration process. It performs the following tasks:</p>
          <ul>
            <li>Validates the incoming JSON data.</li>
            <li>Checks if the email already exists in the database.</li>
            <li>Generates a confirmation hash for email verification.</li>
            <li>Inserts the user data into the `users` table.</li>
            <li>
              Inserts additional user data into related tables (e.g., `user_education`, `user_files`,
              `user_train_categories`).
            </li>
            <li>Sends an email with a confirmation link to the user.</li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
import { isValidEmail } from './functions';

const handleSignup = async (userData) => {
try {
// Validate email
if (!isValidEmail(userData.email)) {
console.error('Invalid email address');
return;
}

// Send signup data to the server
const response = await fetch('https://traino.nu/php/signup.php', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify(userData),
});

if (response.ok) {
console.log('Signup successful');
// Handle successful signup
} else {
console.error('Signup failed');
// Handle signup failure
}
} catch (error) {
console.error('Error during signup:', error);
}
};
`}
          </pre>
        </div>

        <div id="login" className="box">
          <h2>login.php</h2>
          <p>This file handles the user login process. It performs the following tasks:</p>
          <ul>
            <li>Validates the incoming JSON data.</li>
            <li>Checks if the email exists in the database.</li>
            <li>Verifies the provided password against the stored hashed password.</li>
            <li>
              If the login is successful, it returns a success response with the user ID, usertype, email, alias, and a
              session ID.
            </li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
const handleLogin = async (email, password) => {
try {
// Send login data to the server
const response = await fetch('https://traino.nu/php/login.php', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify({ email, password }),
});

if (response.ok) {
const data = await response.json();
console.log('Login successful:', data);
// Handle successful login
} else {
console.error('Login failed');
// Handle login failure
}
} catch (error) {
console.error('Error during login:', error);
}
};
`}
          </pre>
        </div>

        <div id="logout" className="box">
          <h2>logout.php</h2>
          <p>This file handles the user logout process. It performs the following tasks:</p>
          <ul>
            <li>Validates the incoming JSON data.</li>
            <li>Unsets all session variables.</li>
            <li>Destroys the current session.</li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
import { logout } from './functions';

const handleLogout = () => {
const user_id = localStorage.getItem('user_id');
const session_id = localStorage.getItem('session_id');

if (user_id && session_id) {
const data = { user_id, session_id };

fetch('https://traino.nu/php/logout.php', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify(data),
})
.then((response) => {
  if (response.ok) {
    console.log('Logout successful');
    logout(); // Call logout function to clear session data
  } else {
    console.error('Logout failed');
  }
})
.catch((error) => {
  console.error('Error during logout:', error);
});
} else {
console.error('User ID or session ID not found');
}
};
`}
          </pre>
        </div>

        <div id="check_session" className="box">
          <h2>check_session.php</h2>
          <p>This file checks if the user session is active. It performs the following tasks:</p>
          <ul>
            <li>Validates the incoming JSON data.</li>
            <li>Checks if the provided user ID and session ID are valid.</li>
            <li>
              Returns a success response if the session is active, or an error response if the session is not active.
            </li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
import { checkSession } from './functions';

const handleCheckSession = async () => {
const user_id = localStorage.getItem('user_id');
const session_id = localStorage.getItem('session_id');

if (user_id && session_id) {
const data = { user_id, session_id };

try {
const response = await fetch('https://traino.nu/php/check_session.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

const result = await response.json();

if (result.success) {
  console.log('Session is active');
  // Handle active session
} else if (result.error) {
  console.error('Session is not active:', result.error);
  // Handle inactive session
}
} catch (error) {
console.error('Error during session check:', error);
}
} else {
console.error('User ID or session ID not found');
}
};
`}
          </pre>
        </div>

        <div id="confirmemail" className="box">
          <h2>confirmemail.php</h2>
          <p>This file handles the email confirmation process. It performs the following tasks:</p>
          <ul>
            <li>Checks if the email and confirmation code parameters are provided in the URL.</li>
            <li>Retrieves the `confirmed` status from the `users` table based on the provided email.</li>
            <li>Updates the `confirmed` status in the `users` table if the confirmation code is valid.</li>
          </ul>
          <p>Example usage:</p>
          <p>
            To confirm an email, the user needs to click on the confirmation link sent to their email address. The link
            will have the following format:
          </p>
          <pre>https://traino.nu/confirm-email/&lt;encoded_email&gt;/&lt;confirmation_hash&gt;</pre>
          <p>
            When the user clicks on this link, the `confirmemail.php` file will be executed, and it will handle the
            email confirmation process based on the provided parameters.
          </p>
        </div>

        <div id="getcategories" className="box">
          <h2>getcategories.php</h2>
          <p>
            This file retrieves the available training categories from the `categories` table and sends them as a JSON
            response.
          </p>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
import { getCategories } from './functions';

const MyComponent = () => {
const [categories, setCategories] = useState([]);

useEffect(() => {
const fetchCategories = async () => {
try {
  const data = await getCategories();
  setCategories(data);
} catch (error) {
  console.error('Error fetching categories:', error);
}
};

fetchCategories();
}, []);

return (
<div>
{/* Render categories */}
</div>
);
};
`}
          </pre>
        </div>

        <div id="save_email" className="box">
          <h2>save_email.php</h2>
          <p>
            This file handles the process of saving an email address in the `notifyme` table. It performs the following
            tasks:
          </p>
          <ul>
            <li>Validates the incoming email address.</li>
            <li>Inserts the email address into the `notifyme` table.</li>
            <li>Redirects the user to a registered page upon successful insertion.</li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
import { isValidEmail } from './functions';

const handleSaveEmail = async (email) => {
try {
// Validate email
if (!isValidEmail(email)) {
console.error('Invalid email address');
return;
}

// Send email data to the server
const formData = new FormData();
formData.append('email', email);

const response = await fetch('https://traino.nu/php/save_email.php', {
method: 'POST',
body: formData,
});

if (response.ok) {
console.log('Email saved successfully');
// Handle successful email save
} else {
console.error('Failed to save email');
// Handle email save failure
}
} catch (error) {
console.error('Error during email save:', error);
}
};
`}
          </pre>
        </div>

        <div id="search_trainer" className="box">
          <h2>search_trainer.php</h2>
          <p>This file handles the search functionality for trainers. It performs the following tasks:</p>
          <ul>
            <li>Retrieves user details based on the search query.</li>
            <li>Applies pagination to the search results.</li>
            <li>Returns the search results, total results, and total pages as a JSON response.</li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
const handleSearchTrainers = async (query, page, perPage) => {
try {
const response = await fetch(\`https://traino.nu/php/search_trainer.php?query=\${encodeURIComponent(query)}&page=\${page}&perpage=\${perPage}\`);

if (response.ok) {
const data = await response.json();
console.log('Search results:', data);
// Handle search results
} else {
console.error('Failed to search trainers');
// Handle search failure
}
} catch (error) {
console.error('Error during trainer search:', error);
}
};
`}
          </pre>
        </div>

        <div id="admin_search" className="box">
          <h2>admin_search.php</h2>
          <p>This file handles the search functionality for administrators. It performs the following tasks:</p>
          <ul>
            <li>Retrieves user details based on the search query.</li>
            <li>Applies pagination to the search results.</li>
            <li>Returns the search results, total results, and total pages as a JSON response.</li>
          </ul>
          <p>Example usage from client-side JavaScript:</p>
          <pre>
            {`
const handleAdminSearch = async (query, page, perPage) => {
try {
const response = await fetch(\`https://traino.nu/php/admin_search.php?query=\${encodeURIComponent(query)}&page=\${page}&perpage=\${perPage}\`);

if (response.ok) {
const data = await response.json();
console.log('Search results:', data);
// Handle search results
} else {
console.error('Failed to search users');
// Handle search failure
}
} catch (error) {
console.error('Error during user search:', error);
}
};
`}
          </pre>
        </div>

        <div id="getuser_details" className="box">
          <h2>getuser_details.php</h2>
          <p>This file retrieves user details based on the user ID or alias. It performs the following tasks:</p>
          <ul>
            <li>Retrieves user information from the `users` table.</li>
            <li>Retrieves the user's training categories from the `user_train_categories` and `categories` tables.</li>
            <li>Retrieves the user's average rating from the `rating` table.</li>
            <li>Returns the user details as a JSON response.</li>
          </ul>
          <p>Example usage from client-side JavaScript using async/await:</p>
          <pre>
            {`
    import { getUserDetails, getUserDetailsAlias } from './functions';

    const MyComponent = () => {
      const [userData, setUserData] = useState(null);
      const userId = 123; // Replace with the actual user ID
      const userAlias = 'johndoe'; // Replace with the actual user alias

      useEffect(() => {
        // Fetch user details by ID
        const fetchUserDataById = async () => {
          try {
            const data = await getUserDetails(userId);
            setUserData(data);
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        };

        // Fetch user details by alias
        const fetchUserDataByAlias = async () => {
          try {
            const data = await getUserDetailsAlias(userAlias);
            setUserData(data);
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        };

        fetchUserDataById();
        fetchUserDataByAlias();
      }, [userId, userAlias]);

      return (
        <div>
          {/* Render user data */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        {/* Explanations */}
        <div id="traincategories" className="box">
          <h2>traincategories</h2>
          <p>
            The `traincategories` context variable holds an array of training categories fetched from the server. It can
            be accessed and used in any component that is wrapped by the `TrainoContextProvider`.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { traincategories } = useAppState();

      // Use the traincategories data
      console.log('Training categories:', traincategories);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="showTerms" className="box">
          <h2>showTerms</h2>
          <p>
            The `showTerms` context variable is a boolean that controls the visibility of terms and conditions. The
            `setShowTerms` function can be used to toggle the visibility.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { showTerms, setShowTerms } = useAppState();

      const handleToggleTerms = () => {
        setShowTerms(!showTerms);
      };

      return (
        <div>
          <button onClick={handleToggleTerms}>
            {showTerms ? 'Hide Terms' : 'Show Terms'}
          </button>
          {showTerms && (
            <div>
              {/* Render terms and conditions */}
            </div>
          )}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="isKeyboardOpen" className="box">
          <h2>isKeyboardOpen</h2>
          <p>
            The `isKeyboardOpen` context variable is a boolean that indicates whether the keyboard is open or not on
            mobile devices. The `setIsKeyboardOpen` function can be used to update this state.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { isKeyboardOpen } = useAppState();

      // Use the isKeyboardOpen state
      console.log('Keyboard is open:', isKeyboardOpen);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="isMobile" className="box">
          <h2>isMobile</h2>
          <p>
            The `isMobile` context variable is a boolean that indicates whether the application is running on a mobile
            device or not.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { isMobile } = useAppState();

      // Use the isMobile state
      console.log('Is mobile device:', isMobile);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="mapRef" className="box">
          <h2>mapRef</h2>
          <p>
            The `mapRef` context variable is a reference to a map component, likely used for rendering a map or
            interacting with map-related functionality.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { mapRef } = useAppState();

      // Use the mapRef
      console.log('Map reference:', mapRef);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="userID" className="box">
          <h2>userID</h2>
          <p>
            The `userID` context variable is a reference to the user's ID, which can be used for authentication,
            fetching user data, or other user-related operations.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { userID } = useAppState();

      // Use the userID
      console.log('User ID:', userID.current);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="isLoggedin" className="box">
          <h2>isLoggedin</h2>
          <p>
            The `isLoggedin` context variable is a reference to a boolean value that indicates whether the user is
            currently logged in or not.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { isLoggedin } = useAppState();

      // Use the isLoggedin state
      console.log('Is logged in:', isLoggedin.current);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>

        <div id="userData" className="box">
          <h2>userData</h2>
          <p>
            The userData context variable refers to the logged-in user's data, including information such as their name,
            email, profile picture, etc. This variable only allows changes to the currently logged-in user's data and
            cannot be used to modify data for any other users.
          </p>
          <pre>
            {`
    import { useAppState } from '@/app/hooks/useAppState';

    const MyComponent = () => {
      const { userData } = useAppState();

      // Use the userData
      console.log('User data:', userData.current);

      return (
        <div>
          {/* Render component */}
        </div>
      );
    };
    `}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
