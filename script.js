import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY",
    authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId: "REPLACE_WITH_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const complaintsCollection = collection(db, "complaints");
const complaintsQuery = query(complaintsCollection, orderBy("createdAt", "desc"));

const elements = {
    complaintForm: document.getElementById("complaintForm"),
    reportName: document.getElementById("reportName"),
    reportLocation: document.getElementById("reportLocation"),
    reportCategory: document.getElementById("reportCategory"),
    reportDescription: document.getElementById("reportDescription"),
    reportImage: document.getElementById("reportImage"),
    reportAlert: document.getElementById("reportAlert"),
    statusFilter: document.getElementById("statusFilter"),
    searchInput: document.getElementById("searchInput"),
    complaintPreview: document.getElementById("complaintPreview"),
    adminAreaBtn: document.getElementById("adminAreaBtn"),
    adminSection: document.getElementById("adminSection"),
    adminLoginCard: document.getElementById("adminLoginCard"),
    adminDashboard: document.getElementById("adminDashboard"),
    adminLoginForm: document.getElementById("adminLoginForm"),
    adminEmail: document.getElementById("adminEmail"),
    adminPassword: document.getElementById("adminPassword"),
    adminLoginAlert: document.getElementById("adminLoginAlert"),
    adminStatusBadge: document.getElementById("adminStatusBadge"),
    adminComplaintRows: document.getElementById("adminComplaintRows"),
    adminSignOut: document.getElementById("adminSignOut"),
    refreshAdmin: document.getElementById("refreshAdmin"),
    adminCancel: document.getElementById("adminCancel"),
    previewButton: document.getElementById("previewButton"),
    clearFormButton: document.getElementById("clearFormButton"),
    loaderOverlay: document.getElementById("loaderOverlay")
};

let allComplaints = [];

const showLoader = (show) => {
    elements.loaderOverlay.classList.toggle("d-none", !show);
};

const showAlert = (container, message, type = "success") => {
    container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
    return new Date(timestamp).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getStatusBadge = (status) => {
    const safeStatus = status || "Pending";
    return `<span class="badge-status ${safeStatus}">${safeStatus}</span>`;
};

const scrollToElement = (element) => {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
};

const updateComplaintCards = () => {
    const filterValue = elements.statusFilter.value;
    const searchValue = elements.searchInput.value.trim().toLowerCase();

    const filteredComplaints = allComplaints.filter((item) => {
        const matchesStatus = filterValue === "All" || item.status === filterValue;
        const matchesSearch = [item.name, item.location, item.category, item.description, item.id]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(searchValue));
        return matchesStatus && matchesSearch;
    });

    if (filteredComplaints.length === 0) {
        elements.complaintPreview.innerHTML = `<div class="col-12"><div class="card rounded-4 p-4 text-center text-muted">No complaints found. Submit a new report and refresh the dashboard.</div></div>`;
        return;
    }

    elements.complaintPreview.innerHTML = filteredComplaints.map((complaint) => {
        const image = complaint.imageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
        const description = complaint.description.length > 140 ? `${complaint.description.slice(0, 140)}...` : complaint.description;
        return `
            <div class="col-lg-6">
                <div class="card report-card overflow-hidden h-100">
                    <img src="${image}" alt="Issue image" />
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h5 class="card-title mb-0">${complaint.category}</h5>
                            ${getStatusBadge(complaint.status)}
                        </div>
                        <p class="card-text text-muted mb-2">${description}</p>
                        <p class="mb-1"><strong>${complaint.name}</strong> • ${complaint.location}</p>
                        <small class="text-muted">${formatTimestamp(complaint.createdAt)}</small>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

const updateAdminRows = () => {
    if (!elements.adminComplaintRows) return;

    if (allComplaints.length === 0) {
        elements.adminComplaintRows.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No complaints have been submitted yet.</td></tr>`;
        return;
    }

    elements.adminComplaintRows.innerHTML = allComplaints.map((complaint) => {
        const finalState = complaint.status === "Completed" || complaint.status === "Rejected";
        const actionDisabled = finalState ? "disabled" : "";
        return `
            <tr>
                <td><span class="text-muted">${complaint.id}</span></td>
                <td>${complaint.name}</td>
                <td>${complaint.location}</td>
                <td>${complaint.category}</td>
                <td>${getStatusBadge(complaint.status)}</td>
                <td>${formatTimestamp(complaint.createdAt)}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary admin-action-btn mb-1" data-id="${complaint.id}" data-action="Accepted" ${actionDisabled}>Accept</button>
                    <button class="btn btn-sm btn-outline-success admin-action-btn mb-1" data-id="${complaint.id}" data-action="Completed" ${actionDisabled}>Completed</button>
                    <button class="btn btn-sm btn-outline-danger admin-action-btn mb-1" data-id="${complaint.id}" data-action="Rejected" ${actionDisabled}>Reject</button>
                </td>
            </tr>
        `;
    }).join("");
};

const renderAllViews = () => {
    updateComplaintCards();
    updateAdminRows();
};

const resetComplaintForm = () => {
    elements.reportName.value = "";
    elements.reportLocation.value = "";
    elements.reportCategory.value = "Garbage";
    elements.reportDescription.value = "";
    elements.reportImage.value = "";
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    elements.reportAlert.innerHTML = "";

    const name = elements.reportName.value.trim();
    const location = elements.reportLocation.value.trim();
    const category = elements.reportCategory.value;
    const description = elements.reportDescription.value.trim();
    const imageFile = elements.reportImage.files[0];

    if (!name || !location || !description) {
        showAlert(elements.reportAlert, "Please complete all required fields.", "danger");
        return;
    }

    showLoader(true);
    try {
        const imageUrl = imageFile ? await readFileAsDataURL(imageFile) : null;
        await addDoc(complaintsCollection, {
            name,
            location,
            category,
            description,
            imageUrl,
            status: "Pending",
            createdAt: serverTimestamp()
        });

        showAlert(elements.reportAlert, "Complaint submitted successfully!", "success");
        resetComplaintForm();
    } catch (error) {
        showAlert(elements.reportAlert, `Unable to submit complaint: ${error.message}`, "danger");
    } finally {
        showLoader(false);
    }
};

const handleAdminLogin = async (event) => {
    event.preventDefault();
    elements.adminLoginAlert.innerHTML = "";
    const email = elements.adminEmail.value.trim();
    const password = elements.adminPassword.value;

    if (!email || !password) {
        showAlert(elements.adminLoginAlert, "Please enter both email and password.", "danger");
        return;
    }

    showLoader(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert(elements.adminLoginAlert, "Signed in successfully.", "success");
    } catch (error) {
        showAlert(elements.adminLoginAlert, `Login failed: ${error.message}`, "danger");
    } finally {
        showLoader(false);
    }
};

const handleAdminSignOut = async () => {
    showLoader(true);
    try {
        await signOut(auth);
        showAlert(elements.adminLoginAlert, "Signed out successfully.", "success");
    } catch (error) {
        showAlert(elements.adminLoginAlert, `Sign out failed: ${error.message}`, "danger");
    } finally {
        showLoader(false);
    }
};

const handleAdminActionClick = async (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;

    const complaintId = button.dataset.id;
    const nextStatus = button.dataset.action;
    const complaintDoc = doc(db, "complaints", complaintId);

    showLoader(true);
    try {
        await updateDoc(complaintDoc, { status: nextStatus });
        showAlert(elements.adminLoginAlert, `Complaint marked ${nextStatus}.`, "success");
    } catch (error) {
        showAlert(elements.adminLoginAlert, `Could not update status: ${error.message}`, "danger");
    } finally {
        showLoader(false);
    }
};

const showAdminSection = () => {
    elements.adminSection.classList.remove("d-none");
    scrollToElement(elements.adminSection);
};

const hideAdminSection = () => {
    elements.adminSection.classList.add("d-none");
};

const configureAuthState = (user) => {
    if (user) {
        elements.adminStatusBadge.textContent = `Signed in as ${user.email}`;
        elements.adminLoginCard.classList.add("d-none");
        elements.adminDashboard.classList.remove("d-none");
    } else {
        elements.adminStatusBadge.textContent = "Logged out";
        elements.adminLoginCard.classList.remove("d-none");
        elements.adminDashboard.classList.add("d-none");
    }
};

const initializeFirestoreListener = () => {
    onSnapshot(complaintsQuery, (snapshot) => {
        allComplaints = snapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
        }));
        renderAllViews();
    }, (error) => {
        console.error("Firestore listener failed: ", error);
    });
};

const initializeEvents = () => {
    elements.complaintForm.addEventListener("submit", handleComplaintSubmit);
    elements.statusFilter.addEventListener("change", updateComplaintCards);
    elements.searchInput.addEventListener("input", updateComplaintCards);
    elements.adminAreaBtn.addEventListener("click", showAdminSection);
    elements.previewButton.addEventListener("click", () => scrollToElement(elements.complaintPreview));
    elements.clearFormButton.addEventListener("click", resetComplaintForm);
    elements.adminLoginForm.addEventListener("submit", handleAdminLogin);
    elements.adminSignOut.addEventListener("click", handleAdminSignOut);
    elements.refreshAdmin.addEventListener("click", renderAllViews);
    elements.adminCancel.addEventListener("click", hideAdminSection);
    elements.adminComplaintRows.addEventListener("click", handleAdminActionClick);
};

const initializeApp = () => {
    configureAuthState(null);
    initializeEvents();
    initializeFirestoreListener();

    onAuthStateChanged(auth, (user) => {
        configureAuthState(user);
    });
};

initializeApp();
