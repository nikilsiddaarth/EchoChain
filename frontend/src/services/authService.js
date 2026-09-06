const API_URL = "http://localhost:5000/api";

export async function loginUser(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("echoChainToken", data.token);
    localStorage.setItem("echoChainUser", JSON.stringify(data.user));

    return data;
}

export function getStoredUser() {
    const user = localStorage.getItem("echoChainUser");

    return user ? JSON.parse(user) : null;
}

export function logoutUser() {
    localStorage.removeItem("echoChainToken");
    localStorage.removeItem("echoChainUser");
}