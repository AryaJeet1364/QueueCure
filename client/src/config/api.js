// import axios from "axios";

// const API_URL =
//   import.meta.env.VITE_API_URL ||
//   (import.meta.env.PROD
//     ? "https://queue-cure-backend.onrender.com/api"
//     : "http://localhost:4000/api");

// const api = axios.create({
//   baseURL: API_URL,
//   timeout: 15000
// });

// api.interceptors.request.use(
//   (config) => {
//     console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//   (response) => {
//     console.log(`📥 ${response.status} ${response.config.url}`);
//     return response;
//   },
//   (error) => {
//     if (error.response) {
//       console.error({
//         status: error.response.status,
//         url: error.response.config?.url,
//         message: error.response.data?.message || "Request failed"
//       });
//     } else if (error.request) {
//       console.error("Network error: Server unreachable");
//     } else {
//       console.error(error.message);
//     }

//     return Promise.reject(error);
//   }
// );

// export const patientAPI = {
//   getAll: () => api.get("/patients"),
//   create: (data) => api.post("/patients", data),
//   getById: (id) => api.get(`/patients/${id}`)
// };

// export const sessionAPI = {
//   getAll: () => api.get("/sessions"),
//   create: (data) => api.post("/sessions", data)
// };

// export const queueAPI = {
//   getState: () => api.get("/queue/state"),
//   enqueue: (data) => api.post("/queue/enqueue", data),
//   dequeue: () => api.post("/queue/dequeue")
// };

// export default api;



import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://queue-cure-backend.onrender.com/api"
    : "http://localhost:4000/api");

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with DETAILED error extraction
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Extract the most detailed error message possible
    let errorMessage = "Something went wrong";
    let errorDetails = null;

    if (error.response) {
      // Server responded with error
      const { data, status, config } = error.response;
      
      console.error({
        status: status,
        url: config?.url,
        data: data
      });

      // Try different error response formats
      if (data) {
        // Format 1: { message: "..." }
        if (data.message) {
          errorMessage = data.message;
        }
        // Format 2: { errors: [{ msg: "..." }] }
        else if (data.errors && data.errors.length > 0) {
          errorMessage = data.errors[0].msg || data.errors[0].message;
          errorDetails = data.errors;
        }
        // Format 3: { error: "..." }
        else if (data.error) {
          errorMessage = data.error;
        }
        // Format 4: { success: false, message: "..." }
        else if (data.success === false && data.message) {
          errorMessage = data.message;
        }
      }

      // Add status code context
      if (status === 400) {
        errorMessage = `❌ ${errorMessage}`;
      } else if (status === 404) {
        errorMessage = `🔍 Not Found: ${errorMessage}`;
      } else if (status === 409) {
        errorMessage = `👤 ${errorMessage}`;
      } else if (status === 500) {
        errorMessage = `⚠️ Server Error: ${errorMessage}`;
      } else if (status === 401) {
        errorMessage = `🔒 Unauthorized: ${errorMessage}`;
      }

    } else if (error.request) {
      // No response received
      errorMessage = "🌐 Cannot connect to server. Please check your connection.";
    } else {
      // Request setup error
      errorMessage = `📌 ${error.message || "Request failed"}`;
    }

    // Attach the detailed message to the error object
    error.userMessage = errorMessage;
    error.details = errorDetails;

    return Promise.reject(error);
  }
);

export default api;