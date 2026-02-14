const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const yearNode = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.textContent = "Sending...";
    formMessage.className = "form-message";

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      contactForm.reset();
      formMessage.textContent = "Thanks. Your inquiry was sent successfully.";
      formMessage.className = "form-message success";
    } catch (error) {
      formMessage.textContent =
        error.message || "Something went wrong. Please try again.";
      formMessage.className = "form-message error";
    }
  });
}
