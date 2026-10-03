(() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const USERS_KEY = "awfis_demo_users";
    const SESSION_KEY = "awfis_demo_session";

    const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const phoneOk = value => /^[6-9]\d{9}$/.test(value);

    const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const saveUsers = users => localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

    const authElement = $("#authModal");
    const bookingElement = $("#bookingModal");
    const authModal = authElement ? bootstrap.Modal.getOrCreateInstance(authElement) : null;
    const bookingModal = bookingElement ? bootstrap.Modal.getOrCreateInstance(bookingElement) : null;

    function openAuth(tab = "login") {
        const button = $(`[data-bs-target="#${tab}Pane"]`);
        if (button) bootstrap.Tab.getOrCreateInstance(button).show();
        if (authModal) authModal.show();
    }

    $$('[data-auth]').forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            openAuth(link.dataset.auth);
        });
    });

    function renderAuth() {
        const currentUser = getSession();
        const guestLinks = $("#guestLinks");
        const userMenu = $("#userMenu");

        if (!guestLinks || !userMenu) return;

        guestLinks.classList.toggle("d-none", Boolean(currentUser));
        userMenu.classList.toggle("d-none", !currentUser);

        if (currentUser) {
            $("#userName").textContent = currentUser.name;
            $("#userInitial").textContent = currentUser.name.charAt(0).toUpperCase();
        }
    }

    const signupForm = $("#signupPane");
    const loginForm = $("#loginPane");

    if (signupForm) {
        signupForm.addEventListener("submit", event => {
            event.preventDefault();

            const name = $("#sName").value.trim();
            const email = $("#sEmail").value.trim().toLowerCase();
            const password = $("#sPass").value;
            const error = $("#signupErr");

            if (name.length < 2) {
                error.textContent = "Please enter your full name.";
                return;
            }

            if (!emailOk(email)) {
                error.textContent = "Enter a valid email address.";
                return;
            }

            if (password.length < 6) {
                error.textContent = "Password must be at least 6 characters.";
                return;
            }

            if (!$("#sAgree").checked) {
                error.textContent = "Please accept the User Agreement.";
                return;
            }

            const users = getUsers();

            if (users.some(user => user.email === email)) {
                error.textContent = "This email is already registered.";
                return;
            }

            users.push({ name, email, pass: password });
            saveUsers(users);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));

            signupForm.reset();
            error.textContent = "";
            authModal.hide();
            renderAuth();
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();

            const email = $("#lEmail").value.trim().toLowerCase();
            const password = $("#lPass").value;
            const error = $("#loginErr");

            if (!emailOk(email)) {
                error.textContent = "Enter a valid email address.";
                return;
            }

            if (!password) {
                error.textContent = "Password is required.";
                return;
            }

            const demoUser = email === "xyz@mail.com" && password === "xyz123"
                ? { name: "Demo User", email }
                : null;

            const user = demoUser || getUsers().find(item => item.email === email && item.pass === password);

            if (!user) {
                error.textContent = "Incorrect email or password.";
                return;
            }

            localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
            loginForm.reset();
            error.textContent = "";
            authModal.hide();
            renderAuth();
        });
    }

    const logoutButton = $("#logoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();
            localStorage.removeItem(SESSION_KEY);
            renderAuth();
        });
    }

    function closeMobileNavigation() {
        const navigation = $("#mainNav");
        if (navigation && navigation.classList.contains("show")) {
            bootstrap.Collapse.getOrCreateInstance(navigation).hide();
        }
    }

    function scrollToTarget(selector) {
        const target = $(selector);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        closeMobileNavigation();
    }

    $$('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");

            if (!href || href === "#" || link.hasAttribute("data-auth")) return;

            const target = $(href);

            if (target) {
                event.preventDefault();
                scrollToTarget(href);
                history.replaceState(null, "", href);
            }
        });
    });

    $$('[data-city]').forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            scrollToTarget("#network");
            const city = link.dataset.city.toLowerCase();
            const tile = $$(".net-tile").find(item => item.querySelector(".net-name")?.textContent.trim().toLowerCase() === city);
            if (tile) {
                tile.classList.add("selected-city");
                setTimeout(() => tile.classList.remove("selected-city"), 1800);
            }
        });
    });

    function activateSolution(key) {
        const panel = $(`.wp-panel[data-key="${key}"]`);
        if (!panel) return;

        scrollToTarget("#wpWrap");
        setTimeout(() => {
            panel.click();
            panel.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 250);
    }

    $$('[data-solution]').forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            const solution = link.dataset.solution;

            if (solution === "faq") {
                scrollToTarget("#faq");
                return;
            }

            activateSolution(solution);
        });
    });

    function openBooking(interest) {
        if (!bookingModal) return;

        $("#bookingInterest").value = interest;
        $("#bookingSubtitle").textContent = `Enquiry for: ${interest}`;
        $("#bookingMsg").textContent = "";
        bookingModal.show();
    }

    $$('[data-book]').forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            openBooking(button.dataset.book);
        });
    });

    const bookingForm = $("#bookingForm");

    if (bookingForm) {
        bookingForm.addEventListener("submit", event => {
            event.preventDefault();

            const name = $("#bName").value.trim();
            const email = $("#bEmail").value.trim();
            const phone = $("#bPhone").value.replace(/\D/g, "");
            const city = $("#bCity").value;
            const message = $("#bookingMsg");

            message.className = "small mb-2";

            if (name.length < 2) {
                message.classList.add("text-danger");
                message.textContent = "Please enter your name.";
                return;
            }

            if (!emailOk(email)) {
                message.classList.add("text-danger");
                message.textContent = "Please enter a valid email.";
                return;
            }

            if (!phoneOk(phone)) {
                message.classList.add("text-danger");
                message.textContent = "Enter a valid 10-digit Indian mobile number.";
                return;
            }

            if (!city) {
                message.classList.add("text-danger");
                message.textContent = "Please select a city.";
                return;
            }

            localStorage.setItem("awfis_last_enquiry", JSON.stringify({
                name,
                email,
                phone,
                city,
                interest: $("#bookingInterest").value,
                time: new Date().toISOString()
            }));

            message.classList.add("text-success");
            message.textContent = "Request submitted successfully.";
            bookingForm.reset();
        });
    }

    const bookingPhone = $("#bPhone");

    if (bookingPhone) {
        bookingPhone.addEventListener("input", event => {
            event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
        });
    }

    const welcomePhone = $("#wPhone");
    const welcomeConsent = $("#wConsent");
    const welcomeContinue = $("#wContinue");
    const welcomeMessage = $("#wMsg");

    function syncWelcomeForm() {
        if (!welcomePhone || !welcomeConsent || !welcomeContinue) return;
        welcomeContinue.disabled = !(phoneOk(welcomePhone.value) && welcomeConsent.checked);
    }

    if (welcomePhone) {
        welcomePhone.addEventListener("input", () => {
            welcomePhone.value = welcomePhone.value.replace(/\D/g, "").slice(0, 10);
            if (welcomeMessage) welcomeMessage.textContent = "";
            syncWelcomeForm();
        });
    }

    if (welcomeConsent) {
        welcomeConsent.addEventListener("change", syncWelcomeForm);
    }

    const welcomeForm = $("#welcomeForm");

    if (welcomeForm) {
        welcomeForm.addEventListener("submit", event => {
            event.preventDefault();

            if (!phoneOk(welcomePhone.value)) return;

            welcomeMessage.className = "small mt-2 text-success";
            welcomeMessage.textContent = "Thanks! Continue with your workspace enquiry.";
            openBooking("Workspace enquiry");
        });
    }

    const spaceForm = $(".find-space-form");

    if (spaceForm) {
        spaceForm.addEventListener("submit", event => {
            event.preventDefault();

            const city = $("#spaceCity").value;
            const location = $("#spaceLocation").value;
            const type = $("#spaceType").value;
            const result = $("#searchResult");

            if (!city || !location || !type) {
                result.textContent = "Please select all three options.";
                return;
            }

            result.innerHTML = `Showing workspace options for <strong>${city}</strong> · ${location} · ${type}. <button class="btn btn-sm btn-brand ms-2" type="button" id="searchBook">Continue</button>`;

            $("#searchBook").addEventListener("click", () => {
                openBooking(`${type} in ${city}`);
            });
        });
    }

    const solutionImages = {
        coworking: [
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85"
        ],
        enterprise: [
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85"
        ],
        mobility: [
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85"
        ],
        transform: [
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85"
        ]
    };

    $$(".wp-panel").forEach(panel => {
        const key = panel.dataset.key;
        const slides = $(".wp-slides", panel);
        if (!slides || !solutionImages[key]) return;
        const urls = solutionImages[key];
        slides.innerHTML = urls.map((url, index) => `<div class="wp-slide${index === 0 ? " on" : ""}" style="background-image:url('${url}')"></div>`).join("") +
            `<div class="wp-dots">${urls.map((_, index) => `<button type="button" class="${index === 0 ? "on" : ""}" aria-label="Image ${index + 1}"></button>`).join("")}</div>`;
        const imageSlides = $$(".wp-slide", slides);
        const dots = $$(".wp-dots button", slides);
        let current = 0;
        let timer;
        const show = index => {
            current = index % imageSlides.length;
            imageSlides.forEach((item, i) => item.classList.toggle("on", i === current));
            dots.forEach((item, i) => item.classList.toggle("on", i === current));
        };
        const start = () => {
            clearInterval(timer);
            timer = setInterval(() => show(current + 1), 3600);
        };
        dots.forEach((dot, index) => dot.addEventListener("click", event => {
            event.stopPropagation();
            show(index);
            start();
        }));
        panel.addEventListener("click", () => {
            const wrap = $("#wpWrap");
            wrap.classList.add("is-interactive");
            $$(".wp-panel", wrap).forEach(item => {
                item.classList.toggle("active", item === panel);
                item.setAttribute("aria-expanded", item === panel ? "true" : "false");
            });
            start();
        });
        panel.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                panel.click();
            }
        });
    });

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    renderAuth();
    syncWelcomeForm();
})();
